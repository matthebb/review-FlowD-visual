#!/usr/bin/env python3
"""Build data/fiuc.js (the Costing model tab's peer comparison) from the CAUBO FIUC master dataset.

Usage:
    pip install pandas
    python scripts/build_fiuc.py "path/to/CAUBO_FIUC-Master_Dataset.xlsb"   (or .xlsx)

Reads the three long-format data sheets (Table 1 Income, Table 2 Expenditures,
Table 4 General Operating Expenditures), computes each university's cost-structure
ratios for every year, and writes the latest year's comparison plus the time series.
.xlsb is read with a small built-in parser, so no extra packages are needed.
Peer groups (Nova Scotia, Atlantic, U15) are defined in the lists below.
"""
import csv, io, json, struct, sys, zipfile
from pathlib import Path
import numpy as np
import pandas as pd

# ---------- minimal .xlsb reader ----------
def records(data):
    i=0; n=len(data)
    while i<n:
        b=data[i]; i+=1; rt=b&0x7F
        if b&0x80: b2=data[i]; i+=1; rt|=(b2&0x7F)<<7
        sz=0; sh=0
        for _ in range(4):
            b=data[i]; i+=1; sz|=(b&0x7F)<<sh; sh+=7
            if not b&0x80: break
        yield rt, data[i:i+sz]; i+=sz
def wstr(b,o=0):
    n=struct.unpack_from('<I',b,o)[0]; return b[o+4:o+4+2*n].decode('utf-16le'), o+4+2*n
def sst(z):
    out=[]
    for rt,p in records(z.read('xl/sharedStrings.bin')):
        if rt==19: out.append(wstr(p,1)[0])
    return out
def rk(v):
    x=v>>2
    if v&2:
        if x&(1<<29): x-= (1<<30)
        val=float(x)
    else:
        val=struct.unpack('<d',struct.pack('<Q',(v&0xFFFFFFFC)<<32))[0]
    return val/100 if v&1 else val
def rows(z, name, S, maxrows=None):
    data=z.read(name); row=None; cur={}
    for rt,p in records(data):
        if rt==0:
            if row is not None: yield row,cur
            row=struct.unpack_from('<I',p,0)[0]; cur={}
            if maxrows and row>=maxrows: return
        elif 1<=rt<=11:
            col=struct.unpack_from('<I',p,0)[0]; v=None
            if rt==2: v=rk(struct.unpack_from('<I',p,8)[0])
            elif rt in (5,9): v=struct.unpack_from('<d',p,8)[0]
            elif rt==7: v=S[struct.unpack_from('<I',p,8)[0]]
            elif rt in (6,8): v=wstr(p,8)[0]
            elif rt in (4,10): v=bool(p[8])
            if v is not None: cur[col]=v
    if row is not None: yield row,cur


TITLES = {'Table 1.': 'inc', 'Table 2.': 'exp', 'Table 4.': 'genop'}
COLS = ['FIUCCODE','Year','Institution_name','Institution code','Institution Type','Language','Status','Province Name','Table','LineID','Line name','ColumnID','Column name','Value']


def load_tables(path):
    out = {}
    if path.suffix.lower() == '.xlsb':
        z = zipfile.ZipFile(path); S = sst(z)
        for name in sorted(n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.bin')):
            head = [c for r, c in rows(z, name, S, maxrows=2)]
            if len(head) < 2 or head[1].get(0) != 'FIUCCODE':
                continue  # pivot tables and notes; we want the long-format data sheets
            first = head[0].get(0, '')
            key = next((v for k, v in TITLES.items() if str(first).startswith(k)), None)
            if not key or key in out:
                continue
            recs = [[c.get(i, '') for i in range(14)] for r, c in rows(z, name, S) if r >= 2]
            out[key] = pd.DataFrame(recs, columns=COLS)
            print(f'Read {key}: {len(recs):,} rows from {name}')
    else:
        xl = pd.ExcelFile(path)
        for sh in xl.sheet_names:
            head = xl.parse(sh, nrows=2, header=None)
            if head.shape[0] < 2 or str(head.iat[1, 0]) != 'FIUCCODE':
                continue
            first = str(head.iat[0, 0])
            key = next((v for k, v in TITLES.items() if first.startswith(k)), None)
            if key and key not in out:
                out[key] = xl.parse(sh, skiprows=1, header=0).iloc[:, :14]
                out[key].columns = COLS
    missing = set(TITLES.values()) - set(out)
    if missing:
        sys.exit('Could not find sheets: ' + ', '.join(missing))
    for d in out.values():
        d['Province Name'] = d['Province Name'].astype(str).str.strip()
        d['Value'] = pd.to_numeric(d['Value'], errors='coerce')
    return out['genop'], out['exp'], out['inc']

U15=['University of Alberta','The University of British Columbia','University of Calgary','Dalhousie University','Université Laval','University of Manitoba','McGill University / Université McGi','McMaster University','Université de Montréal','University of Ottawa / Université d',"Queen's University",'University of Saskatchewan','University of Toronto','University of Waterloo','Western University']
NS=['Acadia University','Cape Breton University','Dalhousie University','Mount Saint Vincent University','NSCAD University',"Saint Mary's University",'St. Francis Xavier University','Université Sainte-Anne']
ATL=NS+['University of New Brunswick','Memorial University of Newfoundland','University of Prince Edward Island','Mount Allison University','Université de Moncton','St. Thomas University']
def metrics(g, e, i, Y):
    G=g[(g.Year==Y)&(g.LineID=='L24')].pivot_table(index='Institution_name',columns='ColumnID',values='Value',aggfunc='sum')
    sch=g[(g.Year==Y)&(g.LineID=='L13')&(g.ColumnID=='C09')].groupby('Institution_name').Value.sum()
    E=e[(e.Year==Y)&(e.LineID=='L24')].pivot_table(index='Institution_name',columns='ColumnID',values='Value',aggfunc='sum')
    I=i[(i.Year==Y)&(i.LineID.isin(['L08','L12','L13','L14','L25','L21','L22','L23']))&(i.ColumnID=='C01')].pivot_table(index='Institution_name',columns='LineID',values='Value',aggfunc='sum')
    IR=i[(i.Year==Y)&(i.LineID=='L25')&(i.ColumnID=='C05')].groupby('Institution_name').Value.sum()
    prov=g[(g.Year==Y)].groupby('Institution_name')['Province Name'].first()
    m=pd.DataFrame({'prov':prov})
    m['go']=G['C09']
    for c,n in [('C01','instr'),('C02','noncredit'),('C03','library'),('C04','computing'),('C05','admin'),('C06','studserv'),('C07','plant'),('C08','extrel')]: m[n]=G.get(c)
    m['schol']=sch
    m['studserv_ex']=m.studserv-m.schol.fillna(0)
    m['incl']=m.instr+m.library+m.admin
    m['allfunds']=E['C09']; m['sr']=E['C05']; m['anc']=E['C06']; m['cap']=E['C07']; m['spt']=E['C02']
    m['rev_go']=I['L25']; m['prov_go']=I['L08']; m['tuit_go']=I['L12']; m['nctuit']=I['L13']
    m['sr_rev']=IR
    m['year']=Y
    return m


FIX = {'McGill University / Université McGi':'McGill University','University of Ottawa / Université d':'University of Ottawa','The University of British Columbia':'University of British Columbia','Memorial University of Newfoundland':'Memorial University',"Bishop's University / Université Bi":"Bishop's University",'Concordia University / Université C':'Concordia University','Laurentian University / Université':'Laurentian University','University of Ontario Institute of':'Ontario Tech University','University of Northern British Colu':'UNBC'}


def main(src):
    g, e, i = load_tables(Path(src))
    M = pd.concat([metrics(g, e, i, y) for y in sorted(g.Year.dropna().unique())]).reset_index()
    M['grp'] = np.where(M.Institution_name=='Dalhousie University','Dalhousie',np.where(M.Institution_name.isin(NS),'Nova Scotia',np.where(M.Institution_name.isin(ATL),'Atlantic',np.where(M.Institution_name.isin(U15),'U15','Other Canada'))))
    sv = i[i.ColumnID=='C01'].pivot_table(index=['Year','Institution_name'],columns='LineID',values='Value',aggfunc='sum')
    ac = g[g.ColumnID=='C01'].pivot_table(index=['Year','Institution_name'],columns='LineID',values='Value',aggfunc='sum')
    M = M.set_index(['year','Institution_name'])
    M['sales'] = sv['L23']; M['endow'] = sv['L21'] + sv['L22']; M['nct'] = sv['L13']; M['acad'] = ac['L01']
    M = M.reset_index(); M = M[M.go >= 30000].copy()
    for k in ['incl','instr','library','admin','computing','studserv_ex','schol','plant','extrel','noncredit']:
        M[k+'_sh'] = M[k]/M.go
    M['ri']=M.sr/M.go; M['tuit_sh']=M.tuit_go/M.rev_go; M['prov_sh']=M.prov_go/M.rev_go; M['sales_sh']=M.sales/M.rev_go
    M['endow_sh']=M.endow/M.rev_go; M['nct_sh']=M.nct/M.rev_go; M['proxy_rec']=M.tuit_go/M.incl; M['acad_c01']=M.acad/M.instr; M['go_all']=M.go/M.allfunds
    Y = sorted(M.year.unique())[-1]; m = M[M.year==Y]
    r = lambda v: None if pd.isna(v) else round(float(v), 4)
    k = lambda v: round(float(v)/1000, 1)
    peers = [dict(n=FIX.get(x.Institution_name, x.Institution_name), g=x.grp, go=k(x.go), ri=r(x.ri), incl=r(x.incl_sh), prox=r(x.proxy_rec), tuit=r(x.tuit_sh), prov=r(x.prov_sh)) for x in m.itertuples()]
    keys = ['incl_sh','instr_sh','library_sh','admin_sh','computing_sh','studserv_ex_sh','schol_sh','plant_sh','extrel_sh','noncredit_sh','ri','tuit_sh','prov_sh','sales_sh','endow_sh','nct_sh','proxy_rec','acad_c01','go_all']
    med = {n: {kk: r(v) for kk, v in grp[keys].median().items()} for n, grp in m.groupby('grp')}
    dal = m[m.Institution_name=='Dalhousie University'].iloc[0]
    med['Dalhousie'] = {kk: r(dal[kk]) for kk in keys}
    ts = {}
    for n in ['Nova Scotia','U15']:
        t = M[M.grp==n].groupby('year')[['incl_sh','proxy_rec']].median()
        ts[n] = {'years': list(t.index), 'incl': [r(v) for v in t.incl_sh], 'prox': [r(v) for v in t.proxy_rec]}
    d = M[M.Institution_name=='Dalhousie University'].set_index('year').sort_index()
    ts['Dalhousie'] = {'years': list(d.index), 'incl': [r(v) for v in d.incl_sh], 'prox': [r(v) for v in d.proxy_rec]}
    D = dict(year=Y, go=k(dal.go), instr=k(dal.instr), library=k(dal.library), admin=k(dal.admin), noncredit=k(dal.noncredit), computing=k(dal.computing), studserv_ex=k(dal.studserv_ex), schol=k(dal.schol), plant=k(dal.plant), extrel=k(dal.extrel), allfunds=k(dal.allfunds), sr=k(dal.sr), anc=k(dal.anc), cap=k(dal.cap), spt=k(dal.spt), rev_go=k(dal.rev_go), tuit=k(dal.tuit_go), prov=k(dal.prov_go), nct=k(dal.nct), sales=k(dal.sales), endow=k(dal.endow), acad=k(dal.acad))
    D['rev_other'] = round(D['rev_go']-D['tuit']-D['prov']-D['nct']-D['sales']-D['endow'], 1)
    payload = json.dumps({'dal': D, 'med': med, 'peers': peers, 'ts': ts, 'n': len(peers)}, separators=(',',':'), ensure_ascii=False).replace('</','<\\/')
    out = Path(__file__).resolve().parent.parent / 'data' / 'fiuc.js'
    out.write_text('/* Generated by scripts/build_fiuc.py from the CAUBO FIUC master dataset. Do not edit by hand. */\nwindow.FIUC_DATA = ' + payload + ';\n', encoding='utf-8')
    print(f'Wrote FIUC comparison for {Y}: {len(peers)} universities -> {out}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
