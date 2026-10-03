const RAW = window.APR_DATA || [];
if(!RAW.length) document.addEventListener('DOMContentLoaded',()=>{document.getElementById('view').innerHTML='<p class="empty">No program data found. Run scripts/build_data.py to generate data/programs.js.</p>';});
const CATS = ['Revitalize','Modernize','No Change','Rationalize'];
const CATC = {Revitalize:'var(--c-rev)',Modernize:'var(--c-mod)','No Change':'var(--c-nc)',Rationalize:'var(--c-rat)'};
const QUADS = ['High / growing','High / declining','Low / growing','Low / declining','Not charted'];
const QC = {'High / growing':'var(--hi)','High / declining':'var(--hi-lt)','Low / growing':'var(--lo)','Low / declining':'var(--lo-lt)','Not charted':'var(--nc)'};
const LEVELS = ['UG','Masters','Doctoral','Diploma/Tech','Post-bacc'];
const FACS = [...new Set(RAW.map(r=>r.fac))].sort();
const TABS = [['brief','Briefing'],['costing','Costing model'],['portfolio','Portfolio'],['quadrants','Quadrants'],['labour','Labour market'],['faculties','Faculties'],['programs','Programs'],['categories','Categories'],['scenarios','Scenarios'],['guide','Reading guide']];
const DEF_P = {trend:'c3',grow:0,marg:'thr',smUG:25,smGR:8,minN:0,size:'e24',lm:'lma'};
const DEF_W = {below:2,decl:1,sust:1,small:1,weak:1,share:1,grads:1,deficit:1, strong:2,short:1,grow:1,above:1,mkt:1,res:1};
const DEF_S = {rev:8,mod:4,nc:0,rat:-100,vc:40,ratRec:60,eff:0,dropTeach:true};
const RISK = [['below','Below margin line'],['decl','Enrolment declining'],['sust','Declining on 3- and 10-yr'],['small','Subscale enrolment'],['weak','Weaker labour market'],['share','Losing NS market share'],['grads','Credentials decreasing'],['deficit','Deficit over $500K']];
const OPP = [['strong','Stronger labour market'],['short','Workforce shortage risk'],['grow','Enrolment growing'],['above','At or above margin line'],['mkt','Rising share or growing market'],['res','Research-priority aligned']];

const store = {get(k,d){try{const v=localStorage.getItem('aprlens.'+k);return v?JSON.parse(v):d}catch(e){return d}}, set(k,v){try{localStorage.setItem('aprlens.'+k,JSON.stringify(v))}catch(e){}}};
let P = Object.assign({},DEF_P,store.get('P',{}));
let W = Object.assign({},DEF_W,store.get('W',{}));
let S = Object.assign({},DEF_S,store.get('S',{}));
let F = {fac:'All',lv:'All',cat:'All',teach:true,lmg:'All'};
let OV = store.get('OV',{});
let tab = (location.hash||'').slice(1); if(!TABS.some(t=>t[0]===tab)) tab = store.get('tab','brief');
let mFilter = '';
let selId = null, matrixSel = null, wcWeight='n', histW='n', facSort={k:'mar',d:1}, progSort={k:'risk',d:-1}, cmpGroup='lv', mixW='n';

/* ---------- formatting ---------- */
const f$ = v => { if(v==null||isNaN(v)) return '–'; const a=Math.abs(v), s=v<0?'−':''; return a>=1e6? s+'$'+(a/1e6).toFixed(a>=1e7?1:2)+'M' : a>=1e3? s+'$'+Math.round(a/1e3)+'K' : s+'$'+Math.round(a); };
const fN = v => v==null||isNaN(v)?'–':Math.round(v).toLocaleString('en-CA');
const fP = (v,d=1) => v==null||isNaN(v)?'–':(v*100).toFixed(d)+'%';
const fPs = (v,d=1) => v==null||isNaN(v)?'–':(v>0?'+':v<0?'−':'')+Math.abs(v*100).toFixed(d)+'%';
const fC = v => v==null||isNaN(v)?'–':(v<0?'−$':'$')+Math.abs(Math.round(v)).toLocaleString('en-CA');
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sum = (a,f) => a.reduce((s,x)=>s+(+f(x)||0),0);
const median = a => { const b=a.filter(v=>v!=null&&!isNaN(v)).sort((x,y)=>x-y); if(!b.length) return null; const m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; };
const hash = n => { let x = (n*2654435761)>>>0; return (x%1000)/1000; };

/* ---------- derive ---------- */
function derive(r){
  const o = Object.assign({},r);
  o.cat = OV[r.id] || r.cat;
  o.teach = r.st !== 'Active';
  const tr = r[P.trend];
  o.tr = tr;
  o.trendOK = tr!=null && (r.e10||0) >= P.minN;
  o.growing = o.trendOK ? tr*100 >= P.grow : null;
  o.line = P.marg==='thr' ? r.thr : 0;
  o.mrel = r.mpc!=null ? r.mpc - o.line : null;
  o.above = o.mrel!=null ? o.mrel >= 0 : null;
  o.quad = (o.mrel==null || o.growing==null || !r.e24) ? 'Not charted' : (o.above?'High':'Low')+' / '+(o.growing?'growing':'declining');
  o.isGrad = ['Masters','Doctoral'].includes(r.lv);
  o.small = (r.e24||0) < (o.isGrad ? P.smGR : P.smUG);
  o.lmg = LENS[P.lm].g(r);
  o.lmaS = lmStrong(r);
  o.costRec = r.cost>0 ? r.rev/r.cost : null;
  o.sole = r.ms===1;
  const R = {below:o.above===false, decl:o.growing===false, sust:(r.c3!=null&&r.c10!=null&&r.c3<0&&r.c10<0), small:o.small && !!r.e24, weak:o.lmaS==='weak', share:r.mst==='Falling share', grads:r.grad==='Decreasing', deficit:(r.mar||0) < -500000};
  const O = {strong:o.lmaS==='strong', short:/Shortage/.test(r.pv), grow:o.growing===true, above:o.above===true, mkt:r.mst==='Rising share'||r.mkt==='Growing market', res:!!r.res};
  o.R=R; o.O=O;
  o.risk = RISK.reduce((s,[k])=>s+(R[k]?W[k]:0),0);
  o.opp = OPP.reduce((s,[k])=>s+(O[k]?W[k]:0),0);
  // signal-implied category: a mechanical reading of the guide's quadrant logic
  let ic;
  if(o.teach) ic='No Change';
  else if(o.quad==='Not charted') ic='Insufficient data';
  else if(o.growing && o.above) ic = o.lmaS==='strong' ? 'Modernize' : 'No Change';
  else if(o.growing && !o.above) ic = 'Modernize';
  else if(!o.growing && o.above) ic = 'Revitalize';
  else ic = (o.small && o.lmaS!=='strong') ? 'Rationalize' : 'Revitalize';
  o.icat = ic;
  return o;
}
let ALL = [], VIS = [];
function recompute(){
  ALL = RAW.map(derive);
  VIS = ALL.filter(r => (F.fac==='All'||r.fac===F.fac) && (F.lv==='All'||r.lv===F.lv) && (F.cat==='All'||r.cat===F.cat) && (F.teach||!r.teach) && (F.lmg==='All'||r.lmg===+F.lmg));
}
function totals(a){
  const cost=sum(a,r=>r.cost), rev=sum(a,r=>r.rev), mar=sum(a,r=>r.mar), chp=sum(a,r=>r.chp);
  return {n:a.length, e24:sum(a,r=>r.e24), e21:sum(a,r=>r.e21), cost, rev, mar, chp, rec:cost?rev/cost:null, mpc:chp?mar/chp:null};
}

/* ---------- svg helpers ---------- */
const lin = (d0,d1,r0,r1) => v => r0 + (v-d0)/(d1-d0||1)*(r1-r0);
function nice(min,max,n=5){ const span=max-min||1; let step=Math.pow(10,Math.floor(Math.log10(span/n))); const err=span/n/step; if(err>=7.5)step*=10; else if(err>=3.5)step*=5; else if(err>=1.5)step*=2; const t=[]; for(let v=Math.ceil(min/step)*step; v<=max+1e-9; v+=step) t.push(+v.toFixed(10)); return t; }
const TIPS = new Map(); let tipN=0;
const tipAttr = html => { const k='t'+(tipN++); TIPS.set(k,html); return `data-t="${k}"`; };
function progTip(r, extra=''){
  return `<b>${esc(r.nm)}</b><div class="kv">
  <span>Faculty</span><span>${esc(r.fac)}</span><span>Level · category</span><span>${r.lv} · ${r.cat}</span>
  <span>Enrolment 24-25</span><span>${fN(r.e24)} (${fN(r.e21)} in 21-22)</span>
  <span>3-yr / 10-yr CAGR</span><span>${fPs(r.c3)} / ${fPs(r.c10)}</span>
  <span>Margin per CHP</span><span>${fC(r.mpc)} (line ${fC(r.line)})</span>
  <span>Total margin</span><span>${f$(r.mar)}</span>
  <span>LMA signal</span><span>${r.lma??'–'} · ${esc(r.emp)}</span>
  ${r.teach?`<span>Status</span><span>${esc(r.st)}</span>`:''}${extra}</div>`;
}
const sizeVal = r => { const v = P.size==='absmar'?Math.abs(r.mar||0):r[P.size]; return Math.max(0,v||0); };
let SIZEMAX = 1;
const rad = (r,max=20) => 2.5 + Math.sqrt(sizeVal(r)/SIZEMAX)*max;
function axisX(x, ticks, y0, y1, fmt, H){ return ticks.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${y0}" y2="${y1}"/>`).join('') ; }

/* ---------- tabs & controls ---------- */
const $ = id => document.getElementById(id);
function opts(sel, list, val, allLabel){ sel.innerHTML = (allLabel?`<option value="All">${allLabel}</option>`:'') + list.map(v=>`<option${v===val?' selected':''}>${esc(v)}</option>`).join(''); }
function ensureControls(){
  if(!$('fLm')){ const t=$('fTeach'); const lab=document.createElement('label'); lab.className='ctl'; lab.htmlFor='fLm'; lab.id='fLmLab'; lab.innerHTML='Labour market<select id="fLm"></select>'; (t?t.closest('label'):$('scope')).before(lab); }
  if(!$('pLm')){ const ps=$('pSize'); const lab=document.createElement('label'); lab.className='ctl'; lab.htmlFor='pLm'; lab.innerHTML='Labour-market lens<select id="pLm"><option value="lma">LMA signal (AD)</option><option value="emp">NS employment outlook (AE)</option><option value="cops">COPS shortage / surplus (AF)</option></select>'; if(ps) ps.closest('label').before(lab); else document.body.appendChild(lab); }
}
function initControls(){
  ensureControls();
  if(!$('guideLink')){ const b=document.createElement('button'); b.type='button'; b.id='guideLink'; b.className='linkbtn guide-link'; $('scope').after(b); }
  $('guideLink').onclick=()=>{ const from=tab; goTab('guide', GUIDE_SEC[from]); };
  opts($('fFac'),FACS,F.fac,'All faculties'); opts($('fLv'),LEVELS,F.lv,'All levels'); opts($('fCat'),CATS,F.cat,'All categories');
  $('fFac').onchange=e=>{F.fac=e.target.value;render()}; $('fLv').onchange=e=>{F.lv=e.target.value;render()}; $('fCat').onchange=e=>{F.cat=e.target.value;render()};
  $('fTeach').onchange=e=>{F.teach=e.target.checked;render()};
  $('fLm').onchange=e=>{F.lmg=e.target.value;render()};
  const pmap={pTrend:'trend',pGrow:'grow',pMarg:'marg',pSmUG:'smUG',pSmGR:'smGR',pMinN:'minN',pSize:'size',pLm:'lm'};
  Object.entries(pmap).forEach(([id,k])=>{ const el=$(id); el.value=P[k]; el.onchange=()=>{ P[k]= el.type==='number'? (+el.value||0) : el.value; if(k==='lm') F.lmg='All'; store.set('P',P); render(); }; });
  $('pReset').onclick=()=>{ P={...DEF_P}; Object.entries(pmap).forEach(([id,k])=>$(id).value=P[k]); store.set('P',P); render(); };
  $('tabs').innerHTML = TABS.map(([k,l])=>`<button role="tab" type="button" data-tab="${k}" aria-selected="${k===tab}">${l}</button>`).join('');
  $('tabs').onclick = e => { const b=e.target.closest('[data-tab]'); if(!b) return; goTab(b.dataset.tab); };
}
function goTab(k, anchor){
  tab=k; store.set('tab',tab);
  document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-selected',x.dataset.tab===tab));
  render();
  if(anchor) guideScroll(anchor, false); else window.scrollTo({top:0});
}
function render(){
  recompute(); TIPS.clear(); tipN=0;
  $('fLm').innerHTML=`<option value="All">All (${LENS[P.lm].name})</option>`+LENS[P.lm].groups.map((g,i)=>`<option value="${i}"${String(i)===String(F.lmg)?' selected':''}>${esc(g)}</option>`).join(''); $('fLmLab').firstChild.textContent='Labour market';
  SIZEMAX = Math.max(...ALL.map(r=>{const v=P.size==='absmar'?Math.abs(r.mar||0):r[P.size];return v||0}));
  const t = totals(VIS);
  $('scope').textContent = `${VIS.length} of ${RAW.length} programs · ${fN(t.e24)} students · line: ${P.marg==='thr'?'table threshold':'$0'} · trend: ${P.trend==='c3'?'3-yr':'10-yr'}`;
  const v = $('view');
  document.body.classList.toggle('tab-guide', tab==='guide');
  ({brief:vBrief,costing:vCosting,portfolio:vPortfolio,quadrants:vQuadrants,labour:vLabour,faculties:vFaculties,programs:vPrograms,categories:vCategories,scenarios:vScenarios,guide:vGuide})[tab](v);
  const gl=$('guideLink'); if(gl){ gl.hidden = tab==='guide' || !GUIDE_SEC[tab]; gl.textContent='How to read this tab →'; }
  decorateStories(v);
  v.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>goTab(b.dataset.goto));
}

/* ---------- tooltip ---------- */
const tip = $('tip');
let pinned=null;
function showStory(el, anchor){ const html=storyHTML(el.dataset.story, el.dataset.part); if(!html) return; tip.innerHTML=html; tip.classList.add('story'); tip.hidden=false; if(anchor){ const r=el.getBoundingClientRect(); const w=tip.offsetWidth,h=tip.offsetHeight; let x=Math.min(r.left, innerWidth-w-8), y=r.bottom+8; if(y+h>innerHeight-8) y=Math.max(8,r.top-h-8); tip.style.left=Math.max(8,x)+'px'; tip.style.top=y+'px'; } }
document.addEventListener('focusin', e => { const s=e.target.closest('[data-story]'); if(s){ pinned=s; showStory(s,true); } });
document.addEventListener('focusout', e => { if(pinned && e.target===pinned){ pinned=null; tip.hidden=true; } });
document.addEventListener('keydown', e => { if(e.key==='Escape'){ tip.hidden=true; pinned=null; } });
document.addEventListener('mouseover', e => {
  const st = e.target.closest('[data-story]');
  if(st && !e.target.closest('[data-t],[data-id],button,select,input')){ showStory(st,false); return; }
  tip.classList.remove('story');
  const t = e.target.closest('[data-t],[data-id]'); if(!t){ if(!pinned) tip.hidden=true; return; }
  let html = t.dataset.t ? TIPS.get(t.dataset.t) : null;
  if(!html && t.dataset.id){ const r=ALL.find(x=>x.id==t.dataset.id); if(r) html=progTip(r); }
  if(!html){ tip.hidden=true; return; }
  tip.innerHTML = html; tip.hidden=false;
});
document.addEventListener('mousemove', e => { if(tip.hidden) return; const w=tip.offsetWidth,h=tip.offsetHeight; let x=e.clientX+14, y=e.clientY+14; if(x+w>innerWidth-8) x=e.clientX-w-14; if(y+h>innerHeight-8) y=e.clientY-h-14; tip.style.left=Math.max(8,x)+'px'; tip.style.top=Math.max(8,y)+'px'; });
document.addEventListener('click', e => { const t=e.target.closest('svg [data-id]'); if(t){ selId=+t.dataset.id; tab='programs'; store.set('tab',tab); document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-selected',x.dataset.tab===tab)); render(); requestAnimationFrame(()=>{ const d=$('detail'); d&&d.scrollIntoView({block:'start',behavior:'smooth'}); }); }});

function kpis(t, base){
  const d = t.e21? t.e24/t.e21-1 : null;
  return `<div class="kpis" data-s="kpi">
  <div class="kpi"><div class="l">Programs</div><div class="v">${t.n}</div><div class="d">${base?`of ${base.n} in portfolio`:''}</div></div>
  <div class="kpi"><div class="l">Enrolment 2024-25</div><div class="v">${fN(t.e24)}</div><div class="d ${d>=0?'pos':'neg'}">${fPs(d)} since 2021-22</div></div>
  <div class="kpi"><div class="l">Program cost</div><div class="v">${f$(t.cost)}</div><div class="d">${fN(t.chp)} credit hours</div></div>
  <div class="kpi"><div class="l">Program revenue</div><div class="v">${f$(t.rev)}</div><div class="d">Net tuition + targeted funding</div></div>
  <div class="kpi"><div class="l">Instructional contribution</div><div class="v ${t.mar>=0?'pos':'neg'}">${f$(t.mar)}</div><div class="d">${fC(t.mpc)} per CHP · before operating grant</div></div>
  <div class="kpi"><div class="l">Tuition coverage</div><div class="v">${fP(t.rec,0)}</div><div class="d">Revenue ÷ costed instruction only</div></div></div>`;
}
function seg(name, opts, val){ return `<div class="seg" data-seg="${name}">${opts.map(([k,l])=>`<button type="button" data-v="${k}" aria-pressed="${k===val}">${l}</button>`).join('')}</div>`; }
function bindSeg(root, name, fn){ const s=root.querySelector(`[data-seg="${name}"]`); if(s) s.onclick=e=>{const b=e.target.closest('button'); if(b) fn(b.dataset.v);}; }
const legendQ = () => `<div class="legend">${QUADS.map(q=>`<span><i style="background:${QC[q]}"></i>${q==='Not charted'?q:q.replace('High','Above line').replace('Low','Below line')}</span>`).join('')}</div>`;
const legendC = () => `<div class="legend">${CATS.map(c=>`<span><i style="background:${CATC[c]}"></i>${c}</span>`).join('')}</div>`;

/* ================= STORY TOOLTIPS ================= */
const FINDINGS = [
 ['R1','r','Tuition covers 84% of the instructional cost the model counts.','The model counts about 47% of operating spending and only net credit tuition as revenue, so the $45.9M gap is a contribution shortfall before the operating grant, not a deficit, and says nothing about the size of the grant. Read every $0 line as "self-funding on tuition", not break-even. See the Costing model tab.','costing'],
 ['R2','r','"High margin" is not the same as "makes money".','The 62 programs in the high-margin / growing quadrant net −$0.2M combined, because the line sits at −$100/CHP (Table 2) or −$1,000/CHP (Table 1, thesis graduate). Only 51 programs have a positive dollar margin. Switch the margin line to $0 to see the difference.','quadrants'],
 ['R3','r','The surplus is concentrated and fragile.','Ten programs produce $23.8M of the $30.9M in positive margin. Three Computer Science programs alone produce $15.1M, and two of them are shrinking on a 3-year basis (BCS −2.1%/yr, MACS −5.9%/yr).','portfolio'],
 ['R4','r','Growth is landing in programs that lose money.','Net enrolment rose by 640 students since 2021-22. 525 of them (82%) went to programs with a negative dollar margin, mostly in Health (+430) and Medicine (+187). The guide (p. 118) names this exact pattern as a portfolio-balance risk.','faculties'],
 ['R5','r','Small programs are numerous but not where the money is.','99 programs (38%) enrol fewer than 10 students, yet they account for only $8.8M of the deficit. The ten largest deficits, all in large professional and health programs, total $28.2M. Closing small programs alone cannot rebalance the portfolio.','portfolio'],
 ['R6','r','Fifty programs have reversed direction.','They grew over 10 years but are declining over the last 3, and they hold 4,529 students. This group is the early-warning list; a 3-yr CAGR alone hides it.','quadrants'],
 ['R7','r','The category mix is front-loaded on Revitalize.','160 programs (62%) are Revitalize, carrying −$25.9M. Rationalize covers 9 programs, 263 students and only −$0.08M, so it barely moves the financial picture. No Change carries −$17.2M (38% of the gap).','categories'],
 ['O1','o','Strong-labour-market programs sit on both sides of the line.','40 programs pair a stronger labour-market signal (LMA 1–2) with a below-line margin (−$27.5M). These are the guide\'s "why is a high-demand program operating at a negative margin?" cases: cost-effectiveness reviews, not rationalization.','quadrants'],
 ['O2','o','Most programs are the only provider in Nova Scotia.','167 programs hold 100% of NS credentials in their CIP. That makes market-share trend uninformative for most of the portfolio, but it is strong evidence of uniqueness and comparative advantage for the guide\'s "only credential in the province" factor.','quadrants'],
 ['O4','o','Enrolment is moving toward labour-market need.','On the LMA signal, programs with the strongest signal grew 12% since 2021-22 (+416 students) and those with a stronger signal 4% (+231). Weaker-signal programs were flat and programs with no signal shrank. This is the story a provincial reviewer will want to see, and it should lead the Template 7 labour-market discussion.','labour'],
 ['R8','r','Growing where demand is costs money.','The 31 programs linked to occupations with a strong COPS shortage risk grew 17% (3,368 to 3,953 students) but carry a −$18.1M instructional contribution. Growth here is what the province wants and what tuition does not pay for: the case for targeted program funding, which the costing model does count as revenue.','labour'],
 ['R9','r','Supply to shortage occupations is falling in a third of cases.','32 of 78 shortage-aligned programs are declining on the 3-year trend (1,785 students), and 23 have decreasing credentials. These are the most exposed programs if the review is read as "are you producing the graduates Nova Scotia needs?".','labour'],
 ['R10','r','Signal gaps sit in large programs.','37 programs (2,372 students, −$16.5M) have no LMA signal, including the Engineering diploma (781 students) and the JD (497), both with a good NS employment outlook. Fifteen Arts programs carry a shortage flag from a single-occupation mapping. Both invite challenge unless the method is documented.','labour'],
 ['O3','o','Growth engines exist outside Computer Science.','Above-line, growing programs with a stronger labour-market signal are the natural Modernize-and-grow set. Filter the Programs view by high opportunity and low risk to list them by faculty.','programs']
];
const CHART = {"kpi": "Portfolio KPIs", "whale": "Cumulative margin curve", "mix": "Quadrant mix", "hist": "Margin per CHP histogram", "bands": "Size bands", "bub1": "Margin × enrolment trend", "lma": "Margin × labour market", "mkt": "Market size × share", "facT": "Faculty scorecard", "strip": "Faculty margin spread", "grow": "Where enrolment growth landed", "ro": "Risk × opportunity map", "weights": "Flag weights", "progT": "Program screen", "detail": "Peer comparison", "cmat": "Category signal matrix", "cmix": "Category mix by faculty", "clist": "Recategorization list", "levers": "Scenario levers", "bridge": "Margin bridge", "facimp": "Faculty impact"};
const FIND = Object.fromEntries(FINDINGS.map(f=>[f[0],f]));
const pctOf = (a,b) => b ? Math.round(a/b*100)+'%' : '–';
const topNames = (a,f,n=3) => a.slice().sort((p,q)=>f(q)-f(p)).slice(0,n).map(r=>esc(r.nm.replace(/^[A-Z]+_/,''))).join(', ');

const STORY = {
 kpi:{h:'Portfolio economics at a glance', tell:'Sets the frame for every other view: how much of program cost is recovered from tuition and targeted funding, and how big the gap is that other income has to fill.', look:['Cost recovery below 100% is the norm here, because the operating grant is not allocated to programs.','Compare enrolment change with the margin: growth that leaves cost recovery flat or falling is growth in low-margin programs.'], links:['R1'],
  read:'Each tile is a total for the programs in the current filter.',
  live:()=>{ const t=totals(VIS); return `Cost recovery is <b>${fP(t.rec,0)}</b>, leaving a gap of <b>${f$(-t.mar)}</b> across ${t.n} programs.`; }},
 whale:{h:'How dependent are we on a few surplus programs?', tell:'A "whale curve". The climb shows how quickly a handful of programs build the surplus; the long slide shows how widely the deficit is spread. A steep early climb means concentration risk: lose one or two programs at the top and the peak drops sharply.', look:['How many programs it takes to reach the peak.','Who the first few programs are, and whether they are growing or shrinking (hover the curve).','Switch to credit hours: if the peak arrives early by CHP too, the surplus comes from a small share of teaching.'], links:['R3','R5'],
  read:'Each step on the curve is one program, added in order of total margin. Hover anywhere to see that program and the running total.',
  live:()=>{ const a=VIS.filter(r=>r.mar>0); const ps=sum(a,r=>r.mar); const t10=a.slice().sort((p,q)=>q.mar-p.mar).slice(0,10); return a.length?`${a.length} programs make money. The top 10 produce <b>${pctOf(sum(t10,r=>r.mar),ps)}</b> of the ${f$(ps)} surplus, led by ${topNames(a,r=>r.mar)}.`:'No program in this filter has a positive margin.'; }},
 mix:{h:'Are students concentrated in the right quadrants?', tell:'The guide\'s portfolio-balance test (p. 118). Counting programs treats a 3-student MA like a 1,000-student BSc. Weighting by students, credit hours and cost shows where the institution\'s activity and money actually sit. If the dark-blue share grows as you move down the rows, large programs are healthier than small ones; if red grows, the scale of the problem is bigger than the program count suggests.', look:['The "Students" row against the "Programs" row.','The combined dollar margin of the two above-line segments (hover): above the line is not the same as positive.','The grey "not charted" share: programs the quadrant analysis cannot see.'], links:['R2','R5'],
  read:'Dark blue: above the margin line and growing. Light blue: above, declining. Red: below the line and growing. Pink: below, declining. Grey: no costing, trend or current enrolment.',
  live:()=>{ const e=sum(VIS,r=>r.e24)||1, b=VIS.filter(r=>r.above===false), hi=VIS.filter(r=>r.above===true); return `<b>${pctOf(b.length,VIS.length)}</b> of programs but <b>${pctOf(sum(b,r=>r.e24),e)}</b> of students are below the line. The above-line programs together net <b>${f$(sum(hi,r=>r.mar))}</b>.`; }},
 hist:{h:'Where does margin per credit hour cluster?', tell:'Shows the shape of financial performance once programs are measured against their own line. A tall stack just either side of zero means many quadrant assignments are fragile: a small change in costing or threshold would move them across. A long left tail identifies structural deficits that enrolment growth alone will not fix.', look:['How many programs sit within $250 of the line (borderline cases).','The left tail beyond −$1,000: these need cost-structure answers, not recruitment.','Switch to CHP or Students weighting: a tail that shrinks when weighted means the worst cases are small programs.'], links:['R2'],
  read:'Red bars are below the margin line, blue at or above it. Bar height is programs, credit hours or students, depending on the toggle.',
  live:()=>{ const a=VIS.filter(r=>r.mrel!=null); const near=a.filter(r=>Math.abs(r.mrel)<250), tail=a.filter(r=>r.mrel<-1000); return `<b>${near.length}</b> of ${a.length} costed programs (${pctOf(near.length,a.length)}) are within $250 of the line. <b>${tail.length}</b> are more than $1,000 below it, carrying ${f$(sum(tail,r=>r.mar))}.`; }},
 bands:{h:'Is the long tail of small programs a cost problem?', tell:'Separates "how many" from "how much". The top panel shows the institution has many small programs; the bottom panel shows whether they are where the money is lost. It tests the common assumption that cutting small programs fixes the budget.', look:['Compare the tallest bars on top (count) with the deepest bars below (deficit).','The 0-enrolment band: teach-out and dormant programs that still carry cost.','Whether any band other than the largest makes money.'], links:['R5'],
  read:'Top: number of programs in each 2024-25 enrolment band. Bottom: combined total margin of those programs (blue positive, red negative).',
  live:()=>{ const neg=sum(VIS.filter(r=>r.mar<0),r=>r.mar); const s=VIS.filter(r=>(r.e24||0)<10); const big=VIS.filter(r=>(r.e24||0)>=50); return `Programs under 10 students: <b>${s.length}</b>, carrying <b>${pctOf(sum(s.filter(r=>r.mar<0),r=>r.mar),neg)}</b> of the deficit. Programs with 50+ students carry <b>${pctOf(sum(big.filter(r=>r.mar<0),r=>r.mar),neg)}</b>.`; }},
 bub1:{h:'Guide analysis 1: margin × enrolment trend', tell:'The core integration chart. Each quadrant suggests a different strategy (guide p. 118): above-line and growing → build on success (Modernize); above-line and declining → protect a valuable program (Revitalize); below-line and growing → check whether scale will fix cost or make it worse; below-line and declining → Revitalize or Rationalize. Bubble size shows what is at stake.', look:['Big bubbles near the axes: large programs whose quadrant could flip.','Big bubbles in the below-line / growing quadrant: growth that deepens the deficit.','Switch the trend basis to 10-year: programs that change sides have reversed direction.','Switch the margin line to $0 to see how many "above line" programs still lose money.'], links:['R2','R4','R6'],
  read:'Colour follows the control in the header. In quadrant mode, blue is above the margin line, red below; darker shades are growing.',
  live:()=>{ const rv=VIS.filter(r=>r.c3!=null&&r.c10!=null&&r.c3<0&&r.c10>=0); const lg=VIS.filter(r=>r.quad==='Low / growing'); return `<b>${rv.length}</b> programs (${fN(sum(rv,r=>r.e24))} students) grew over 10 years but declined over 3. The below-line / growing quadrant holds <b>${fN(sum(lg,r=>r.e24))}</b> students and ${f$(sum(lg,r=>r.mar))}.`; }},
 lma:{h:'Guide analysis 3: margin × labour market', tell:'Links cost-effectiveness to public value (guide p. 120). Above-line programs with a strong labour market are candidates to grow. Below-line programs with a strong labour market are the hardest policy cases: high demand but expensive to deliver, so the answer is cost redesign rather than closure. Below-line programs with weak signals are the "expensive" programs the guide flags for cost reduction or repositioning.', look:['The density of red dots in the two right-hand columns (strong signal, below line).','The "No signal" column: programs whose labour-market case has not been made.','Large bubbles in the weaker columns below the line.'], links:['O1'],
  read:'Columns are LMA signal values (in this file, lower = stronger). Dots are jittered horizontally within a column so they do not overlap; horizontal position inside a column means nothing.',
  live:()=>{ const sb=VIS.filter(r=>r.lmaS==='strong'&&r.above===false), ns=VIS.filter(r=>r.lmaS==='none'); return `<b>${sb.length}</b> programs have a stronger labour-market signal but sit below the line (${f$(sum(sb,r=>r.mar))}). <b>${ns.length}</b> have no signal, carrying ${f$(sum(ns,r=>r.mar))}.`; }},
 mkt:{h:'Guide analysis 2: market size × market share', tell:'Places each program in the provincial market (guide p. 119). Holding share in a shrinking market means a realistic enrolment target is lower than today; rising share in a shrinking market is evidence of competitive strength. Because most programs are sole providers, this view mostly tells a uniqueness story rather than a competition story.', look:['Students in the "shrinking market" row: future enrolment pressure even with stable share.','The few "falling share" cells: programs losing ground to other NS institutions.','Shade intensity: where most students sit.'], links:['O2'],
  read:'Rows: trend in total NS credentials for the field. Columns: trend in this institution\'s share. Darker cells hold more students.',
  live:()=>{ const sh=VIS.filter(r=>r.mkt==='Shrinking market'), e=sum(VIS,r=>r.e24)||1; return `<b>${VIS.filter(r=>r.sole).length}</b> of ${VIS.length} programs are the only NS provider. <b>${pctOf(sum(sh,r=>r.e24),e)}</b> of students are in fields where the provincial market is shrinking.`; }},
 facT:{h:'Which faculties carry the gap?', tell:'Turns program results into accountability units. Cost recovery and margin per CHP show structural economics; enrolment change shows direction; "students below line" shows how much of each faculty\'s teaching is in below-line programs; the category mix shows whether planned actions match the faculty\'s problems.', look:['Faculties with both falling enrolment and low cost recovery.','Faculties where most students are below the line but the mix is mostly "No Change".','The two faculties with a positive margin: they fund the rest.'], links:['R1','R4','R7'],
  read:'Bars show total margin (blue positive, red negative) on a common scale. The mix bar shows the share of programs in each category.',
  live:()=>{ const r=facRows(); if(!r.length) return ''; const w=r.slice().sort((a,b)=>a.mar-b.mar)[0], lo=r.slice().sort((a,b)=>(a.rec??9)-(b.rec??9))[0], p=r.filter(x=>x.mar>0); return `Largest gap: <b>${esc(w.f)}</b> (${f$(w.mar)}). Lowest cost recovery: <b>${esc(lo.f)}</b> (${fP(lo.rec,0)}). Faculties in surplus: ${p.length?p.map(x=>esc(x.f)).join(', '):'none'}.`; }},
 strip:{h:'Do faculty averages hide very different programs?', tell:'A faculty median can look acceptable while it contains both strong surplus programs and deep deficits. The spread tells you whether a faculty problem is broad (everything below the line) or concentrated (one or two outliers), which calls for very different responses.', look:['Faculties with a tight cluster below the line: a structural cost model issue.','Faculties with one large outlier: a single-program decision.','Large blue dots in otherwise red rows: the programs subsidizing that faculty.'], links:['R3','R5'],
  read:'Each dot is a program, coloured by quadrant and sized by the bubble-size setting. The black tick is the faculty median. Faculties are ordered by median.',
  live:()=>{ const r=facRows().map(f=>{const v=f.g.map(p=>p.mrel).filter(x=>x!=null).sort((a,b)=>a-b); return {f:f.f,iqr:v.length>3?v[Math.floor(v.length*.75)]-v[Math.floor(v.length*.25)]:null};}).filter(x=>x.iqr!=null).sort((a,b)=>b.iqr-a.iqr); return r.length?`Widest middle-50% spread: <b>${esc(r[0].f)}</b> (${fC(r[0].iqr)} per CHP). Narrowest: <b>${esc(r[r.length-1].f)}</b> (${fC(r[r.length-1].iqr)}).`:''; }},
 grow:{h:'Is growth helping or hurting the balance?', tell:'The guide\'s warning scenario (p. 118): stable total enrolment can hide a shift of students from programs that make money into programs that lose it. This view shows where the net change in students landed, split by the dollar margin of the programs that gained or lost them.', look:['Long red bars to the right: growth in loss-making programs.','Blue bars to the left: shrinking surplus programs.','The net line under the chart: share of growth going to negative-margin programs.'], links:['R4','R3'],
  read:'Bars to the right are student gains since 2021-22, to the left losses. Blue: programs with a positive dollar margin. Red: programs with a negative dollar margin.',
  live:()=>{ const r=facRows(); const a=sum(r,x=>x.dAbove), b=sum(r,x=>x.dBelow), top=r.slice().sort((x,y)=>y.dAbs-x.dAbs)[0]; return `Net change <b>${a+b>0?'+':''}${a+b}</b> students: ${b>0?'+':''}${b} in negative-margin programs, ${a>0?'+':''}${a} in positive-margin ones. Biggest gain: ${top?esc(top.f)+' ('+(top.dAbs>0?'+':'')+top.dAbs+')':'–'}.`; }},
 ro:{h:'Which programs combine risk and opportunity?', tell:'Condenses every signal into two scores so you can triage. Top-left (high risk, low opportunity) is where rationalization review belongs. Top-right (high risk, high opportunity) is where investment to fix is justified. Bottom-right is where to grow. Colour shows whether the agreed category matches the position.', look:['Blue (Revitalize) dots in the top-left: is revitalization realistic?','Orange (Rationalize) dots outside the top-left: check the rationale.','Bottom-right programs by faculty: the growth pipeline.'], links:['O3','R7'],
  read:'Dots are jittered slightly so equal scores do not overlap. Dashed lines mark the midpoint of each score range. Colour is the (possibly reassigned) category.',
  live:()=>{ const rmax=sum(RISK,([k])=>W[k])/2, omax=sum(OPP,([k])=>W[k])/2; const tl=VIS.filter(r=>r.risk>rmax&&r.opp<=omax), br=VIS.filter(r=>r.risk<=rmax&&r.opp>omax); return `<b>${tl.length}</b> programs are high risk / low opportunity (${tl.filter(r=>r.cat==='Rationalize').length} agreed Rationalize). <b>${br.length}</b> are low risk / high opportunity, with ${fN(sum(br,r=>r.e24))} students.`; }},
 weights:{h:'Make the scoring assumptions explicit', tell:'The scores are only as good as the weights behind them. Changing a weight and watching programs move is a sensitivity test: programs that stay in the same corner under any reasonable weighting are robust findings; programs that jump around are judgement calls that need qualitative evidence.', look:['Set "Below margin line" to 0 and see who leaves the high-risk zone: their risk is financial only.','Raise "Stronger labour market" to 3 to see the public-value view.'], links:['O3'], read:'Each slider is a multiplier on one flag. 0 turns the flag off.', live:()=>''},
 progT:{h:'The program-level screen', tell:'Every program with the flags that drive its scores, so a reviewer can see why a program ranks where it does, not just its rank.', look:['Sort by risk, then read the flags: repeated combinations point to common causes.','Sort by total margin to see whether high-risk programs are also financially material.'], links:['R5','R6'], read:'Red chips are risk flags, blue chips opportunity flags.', live:()=>''},
 detail:{h:'Where does this program sit among its peers?', tell:'Turns portfolio distributions into a program-level verdict. The guide recommends quartile benchmarking (p. 63): the middle 50% is the "typical" range, and programs outside it on several measures are where the review should dig.', look:['Measures where the program sits outside the shaded band.','Whether same-faculty peers (blue dots) cluster with it: a faculty-wide pattern or a program-specific one.','Switch peer group: a program can look typical in its faculty but an outlier at its level.'], links:['R2','R6'], read:'Shaded band: middle 50% of the comparison group. Tick: median. Large dot: this program. Enrolment and credentials use a log scale.',
  live:()=>{ const r=ALL.find(x=>x.id===selId); if(!r||r.mrel==null) return ''; const v=ALL.filter(p=>p.lv===r.lv&&p.mrel!=null).map(p=>p.mrel); const pr=v.filter(x=>x<r.mrel).length/v.length; return `On margin vs line, ${esc(r.nm)} is in the <b>${pr<.25?'bottom quartile':pr>=.75?'top quartile':'middle 50%'}</b> of ${r.lv} programs.`; }},
 cmat:{h:'Do the agreed categories match the evidence?', tell:'A consistency check for Workstream D synthesis (guide p. 121: "review program categorizations… identify any that should be reconsidered"). The diagonal is where the agreed category and the quantitative signal agree. Off-diagonal cells are where qualitative factors (mission, uniqueness, recent reviews) must carry the argument, so they need the strongest written rationale.', look:['Large off-diagonal cells, especially agreed Revitalize / implied Rationalize.','Agreed No Change programs with a Revitalize or Modernize signal.','The "Insufficient data" column: categories made without quantitative support.'], links:['R7'], read:'Rows are agreed categories, columns the signal-implied category. Shaded cells are agreement. Click a cell to list its programs.',
  live:()=>{ const off={}; VIS.forEach(r=>{ if(r.icat!=='Insufficient data'&&r.icat!==r.cat){ const k=r.cat+' → '+r.icat; off[k]=(off[k]||0)+1; }}); const top=Object.entries(off).sort((a,b)=>b[1]-a[1])[0]; return `<b>${VIS.filter(r=>r.icat===r.cat).length}</b> of ${VIS.length} programs agree with the signal. Largest disagreement: ${top?`<b>${top[0]}</b> (${top[1]} programs)`:'none'}.`; }},
 cmix:{h:'Is each faculty\'s action plan proportionate?', tell:'Shows whether categories are spread sensibly. A faculty that is almost entirely Revitalize has more improvement plans than it can resource; the guide asks institutions to prioritize by benefit, risk and cost to implement (p. 122). Switching to students shows how much teaching each category actually touches.', look:['Faculties above the portfolio bar on Revitalize share.','Faculties with no Modernize programs despite above-line, growing programs.','How the mix changes when weighted by students.'], links:['R7'], read:'Each bar is one faculty\'s category mix; the bottom bar is the whole portfolio. Includes your reassignments.',
  live:()=>{ const a=ALL.filter(r=>F.teach||!r.teach); const r=FACS.map(f=>{const g=a.filter(x=>x.fac===f);return {f,s:g.length?g.filter(x=>x.cat==='Revitalize').length/g.length:0,n:g.length}}).filter(x=>x.n>=5).sort((x,y)=>y.s-x.s); return r.length?`Highest Revitalize share: <b>${esc(r[0].f)}</b> (${fP(r[0].s,0)} of its programs) vs ${fP(a.filter(x=>x.cat==='Revitalize').length/a.length,0)} portfolio-wide.`:''; }},
 clist:{h:'Test a recategorization', tell:'Lets you try the alternative category the evidence suggests and see the effect on the faculty mix and on the scenario model before taking it to a decision meeting.', look:['Programs with large enrolment or margin where the signal disagrees: they matter most.'], links:['R7'], read:'Changed categories are highlighted and show what they were.', live:()=>`${Object.keys(OV).length} reassignments in this browser.`},
 levers:{h:'What would success actually be worth?', tell:'Puts numbers on the plans. Revitalization targets, phase-outs and efficiency gains each contribute to the margin, and the levers expose the assumptions behind them: how much cost really varies with enrolment, and how much cost really leaves when a program closes.', look:['Set Rationalize cost removal below ~95%: phasing out loss-making programs can make the margin worse, because the revenue leaves with the students but much of the shared teaching cost stays.','Lower the variable-cost share: growth then improves margins faster, because more cost is fixed.','How large a Revitalize enrolment gain is needed to move the total meaningfully.'], links:['R7','R5'], read:'Each slider is an assumption. Values apply when you release the slider.', live:()=>''},
 bridge:{h:'Where does the change come from?', tell:'Decomposes the scenario into contributions from each category, so you can see which plans carry the financial weight. It usually shows that the outcome depends on Revitalize and No Change programs, not on Rationalize.', look:['The size of the Rationalize step relative to the others.','Whether removing teach-out programs (a mechanical change) is larger than any planned action.'], links:['R7','R1'], read:'Grey bars are totals; blue steps improve the margin, red steps worsen it.',
  live:()=>{ const sc=VIS.map(r=>({r,s:scen(r)})); const g=sc.filter(x=>x.r.cat==='Rationalize'&&!(S.dropTeach&&x.r.teach)); const d=sum(g,x=>x.s.mar-(x.r.mar||0)); return `Rationalize contributes <b>${d>=0?'+':''}${f$(d)}</b> under current assumptions.`; }},
 facimp:{h:'Who gains and who carries the risk?', tell:'Translates the scenario into faculty terms, which is where resource conversations happen. A faculty can improve in total while its plans depend on growth targets that are not yet proven.', look:['Faculties that worsen under the scenario: usually growth in below-line programs or stranded cost from phase-outs.'], links:['R4'], read:'Margin now, under the scenario, and the change.', live:()=>''}
};
function storyHTML(k, part){
  const s=STORY[k]; if(!s) return null;
  let live=''; try{ live=s.live?s.live():''; }catch(e){ live=''; }
  const liveBox = live?`<div class="st-live"><span>In the current view</span>${live}</div>`:'';
  if(part==='legend') return `<div class="st"><div class="st-k">How to read it</div><p>${s.read}</p>${liveBox}${s.m&&s.m.length?`<div class="st-k">Method caveats</div><p>${s.m.join(', ')}: see Costing model.</p>`:''}</div>`;
  return `<div class="st"><div class="st-k">The story</div><b>${s.h}</b><p>${s.tell}</p><div class="st-k">Look for</div><ul>${s.look.map(x=>`<li>${x}</li>`).join('')}</ul>${liveBox}${(s.m&&s.m.length&&typeof SKEWBY!=='undefined')?`<div class="st-k">Method caveats</div>${s.m.map(id=>{const k=SKEWBY[id];return `<div class="st-f"><span class="tag m">${id}</span>${esc(k.t)} <span style="color:${DIR[k.dir][1]}">(${DIR[k.dir][0].toLowerCase()})</span></div>`}).join('')}`:''}${s.links.length?`<div class="st-k">Briefing points</div>${s.links.map(id=>{const f=FIND[id];return `<div class="st-f"><span class="tag ${f[1]}">${id}</span>${f[2]}</div>`}).join('')}`:''}</div>`;
}
function decorateStories(root){
  root.querySelectorAll('[data-s]').forEach(sec=>{
    const k=sec.dataset.s;
    sec.querySelectorAll('h2, .q').forEach(el=>{ if(el.closest('[data-s]')!==sec) return; el.dataset.story=k; el.dataset.part='main'; });
    const h=sec.querySelector('h2'); if(h && h.closest('[data-s]')===sec && !h.querySelector('.st-badge')){ h.tabIndex=0; h.insertAdjacentHTML('beforeend',' <span class="st-badge" aria-hidden="true">story</span>'); h.setAttribute('aria-describedby','tip'); }
    sec.querySelectorAll('.legend, .kpi .l').forEach(el=>{ if(el.closest('[data-s]')!==sec) return; el.dataset.story=k; el.dataset.part= el.classList.contains('l')?'main':'legend'; });
  });
}

/* ================= BRIEF ================= */
function vBrief(v){
  v.innerHTML = `
  <div class="brief">
   <section class="panel readfirst" style="grid-column:1/-1">
    <h2>Read first: what "margin" means here</h2>
    <p class="sub" style="max-width:100ch">Program costing counts about ${FI?fP(MODEL.cost/(FI.dal.go*1e6),0):'half'} of Dalhousie's operating spending and only net credit tuition as revenue. The operating grant, physical plant, IT, student services and all research funds sit outside it. Every margin in this tool is an <b>instructional contribution before the operating grant and institutional costs</b>: use it to compare programs with each other, never to size a grant or a deficit. Method caveats M1–M8 mark where the method skews Dalhousie's results, and they are tagged wherever those skews show up. <button type="button" class="linkbtn" data-goto="costing">Open Costing model →</button></p>
   </section>
   <section class="panel" style="grid-column:1/-1">
    <h2>What the distributions show</h2>
    <p class="sub">Whole portfolio, file defaults (margin measured against the costing-table threshold, 3-year enrolment trend). Tags mark risk (R) or opportunity (O). Each finding lists the charts that show it; in every other tab, hover a chart's title, subtitle or legend to read the story it tells and the briefing points it supports.</p>
    <div style="margin-top:10px;columns:2 460px;column-gap:28px">
    ${FINDINGS.map(([t,c,h,b,tb])=>{ const views=Object.entries(STORY).filter(([k,v])=>v.links.includes(t)).map(([k,v])=>CHART[k]); return `<div class="finding" style="break-inside:avoid"><span class="tag ${c}">${t}</span><div><p><strong>${h}</strong> ${b}</p><p class="st-views">Shown in: ${views.map(x=>esc(x)).join(' · ')} <button type="button" class="linkbtn" data-goto="${tb}">Open ${TABS.find(x=>x[0]===tb)[1]} →</button></p></div></div>`; }).join('')}
    </div>
   </section>

   <section class="panel">
    <h2>Parameters that should shape every distribution</h2>
    <ol>
     <li><strong>Weight before you count.</strong> Show each distribution by programs, students, credit hours and dollars. The quadrant view by program count looks balanced; by students, 38% sit in above-line growing programs and 34% below the line.</li>
     <li><strong>Choose the margin line on purpose.</strong> Use the costing-table thresholds (−$100 and −$1,000 per CHP) for categorization signals and $0 for financial-sustainability statements. Never compare Table 1 and Table 2 programs on raw margin per CHP.</li>
     <li><strong>Compare like with like.</strong> Distribute within level (UG, Masters, Doctoral) and costing table first, then within faculty. The guide recommends quartile bucketing (top 25%, middle 50%, bottom 25%) for internal benchmarking (p. 63).</li>
     <li><strong>Read two trend windows.</strong> The 3-yr CAGR starts in 2021-22, a pandemic-affected base year the guide warns against (p. 65). Use the 10-yr CAGR for direction and the 3-yr CAGR for recent momentum, and treat sign disagreement as a signal of its own.</li>
     <li><strong>Discount small-n trends.</strong> A program going from 3 to 1 student shows a −31%/yr CAGR. Set a minimum 10-year average enrolment before a trend counts.</li>
     <li><strong>Define subscale by level.</strong> An 8-student doctoral program and an 8-student BA are different problems. The defaults are fewer than 25 for undergraduate and diploma and fewer than 8 for graduate programs; both are adjustable.</li>
     <li><strong>Mind the labour-market coding.</strong> In this file a lower LMA signal is stronger (1 = strongest). 0 means no signal: 37 programs carrying −$16.5M have no usable labour-market evidence.</li>
     <li><strong>Separate teach-out programs.</strong> Terminated and suspended programs, including Dental Hygiene (−$4.3M), belong in the current-state view but not in forward scenarios.</li>
    </ol>
   </section>

   <section class="panel">
    <h2>Which view answers which question</h2>
    <div class="tblwrap" style="max-height:none;margin-top:8px"><table>
     <thead><tr><th>Level</th><th>Question</th><th>View</th></tr></thead>
     <tbody>
      ${[
       ['Portfolio','How dependent are we on a few surplus programs?','Portfolio · cumulative margin'],
       ['Portfolio','Are students concentrated in high- or low-margin programs?','Portfolio · weighted quadrant mix'],
       ['Portfolio','Where does margin per CHP cluster?','Portfolio · margin histogram'],
       ['Portfolio','Is the long tail of small programs a cost problem?','Portfolio · size bands'],
       ['Portfolio / Program','The guide\'s three bubble charts','Quadrants'],
       ['Faculty','Which faculties carry the gap, and is growth helping?','Faculties · table and enrolment change'],
       ['Faculty','How wide is each faculty\'s spread?','Faculties · margin strip plot'],
       ['Program','Where does a program sit against its peers?','Programs · click any program'],
       ['Program','Which programs combine risk and opportunity?','Programs · risk × opportunity'],
       ['All','Do agreed categories match the evidence?','Categories · signal matrix'],
       ['All','What happens if plans succeed?','Scenarios']
      ].map(r=>`<tr><td>${r[0]}</td><td style="white-space:normal">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
     </tbody></table></div>
    <h3 style="margin-top:16px">Data issues to resolve before Template 7</h3>
    <ul style="font-size:.86rem">
     <li>20 programs show negative total revenue (largest: PhD Computer Science, −$0.85M), likely funding or scholarship netting. Their margin per CHP is overstated as a deficit.</li>
     <li>Periodontics reports 0 enrolment in 2024-25 but −$3.1M margin (−$3,781/CHP).</li>
     <li>PhD Microbiology & Immunology is labelled "Higher relative to threshold" at −$1,210/CHP against a −$1,000 line. Its quadrant is correct; the label is not.</li>
     <li>Status and category labels have spelling variants (merged here). The Employment prospects column is empty.</li>
     <li>Curriculum Trend Signal (0–4) has no legend in the file, so it is not used in scoring here.</li>
    </ul>
   </section>
  </div>`;
}

/* ================= PORTFOLIO ================= */
function vPortfolio(v){
  const base = totals(ALL.filter(r=>F.teach||!r.teach)), t = totals(VIS);
  v.innerHTML = scopeBanner() + kpis(t, base) + `
  <div class="grid g2">
   <section data-s="whale" class="panel" style="grid-column:1/-1"><header><div><h2>Cumulative margin curve</h2><p class="q">Programs ranked from largest surplus to largest deficit. The peak is the total surplus that funds everything to its right; the drop from the peak to the end point is the deficit it must absorb.</p></div>${seg('wc',[['n','By program count'],['chp','By credit hours']],wcWeight)}</header><div id="whale"></div></section>
   <section data-s="mix" class="panel"><header><div><h2>Quadrant mix, weighted four ways</h2><p class="q">The same programs, measured by count, students, credit hours and cost. A mix that shifts as you move down the rows means size and margin are correlated.</p></div></header><div id="mix"></div>${legendQ()}</section>
   <section data-s="hist" class="panel"><header><div><h2>Margin per CHP against the line</h2><p class="q">Distance from each program's margin line (${P.marg==='thr'?'its costing-table threshold':'$0'}). Bars right of zero are above the line.</p></div>${seg('hw',[['n','Programs'],['chp','CHP'],['e24','Students']],histW)}</header><div id="hist"></div><div class="legend"><span><i style="background:var(--lo)"></i>Below line</span><span><i style="background:var(--hi)"></i>At or above line</span></div></section>
   <section data-s="lmmix" class="panel" style="grid-column:1/-1"><header><div><h2>Quadrant mix by labour-market group</h2><p class="q">The same quadrant split, one row per ${esc(LENS[P.lm].name)} group (change the lens in Analysis parameters or on the Labour market tab). It shows whether labour-market priority programs are also the financially strong or growing ones.</p></div>${seg('lmw',[['n','Programs'],['e24','Students']],lmW)}</header><div id="lmMix"></div>${legendQ()}</section>
   <section data-s="bands" class="panel" style="grid-column:1/-1"><header><div><h2>Size bands: how many programs, and what they cost</h2><p class="q">Programs by 2024-25 enrolment band (top) and the combined dollar margin of each band (bottom).</p></div></header><div id="bands"></div></section>
  </div>`;
  bindSeg(v,'wc',x=>{wcWeight=x;render()}); bindSeg(v,'hw',x=>{histW=x;render()});
  bindSeg(v,'lmw',x=>{lmW=x;render()});
  drawLMMix($('lmMix'));
  drawWhale($('whale')); drawMix($('mix'),VIS); drawHist($('hist')); drawBands($('bands'));
}
function drawWhale(el){
  const a = VIS.filter(r=>r.mar!=null).sort((x,y)=>y.mar-x.mar);
  if(!a.length){el.innerHTML='<p class="empty">No programs with costing data in this filter.</p>';return;}
  const W_=1000,H=320,m={l:64,r:20,t:20,b:36};
  const wsum = wcWeight==='chp'? sum(a,r=>r.chp) : a.length;
  let cx=0, cy=0; const pts=[[0,0]]; const segs=[];
  a.forEach(r=>{ const w = wcWeight==='chp'?(r.chp||0):1; const x0=cx; cx+=w; cy+=r.mar; pts.push([cx,cy]); segs.push([x0,cx,cy,r]); });
  const ymax=Math.max(...pts.map(p=>p[1])), ymin=Math.min(0,...pts.map(p=>p[1]));
  const yt=nice(ymin,ymax,5), x=lin(0,wsum,m.l,W_-m.r), y=lin(Math.min(ymin,yt[0]),Math.max(ymax,yt[yt.length-1]),H-m.b,m.t);
  const peak = pts.reduce((b,p)=>p[1]>b[1]?p:b,[0,-1e18]); const end=pts[pts.length-1];
  const npos = a.filter(r=>r.mar>0).length;
  const xt = nice(0,wsum,6);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Cumulative margin curve">`;
  s+=`<g class="grid">${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=yt.map(t=>`<text x="${m.l-8}" y="${y(t)+4}" text-anchor="end">${f$(t)}</text>`).join('');
  s+=xt.map(t=>`<text x="${x(t)}" y="${H-m.b+18}" text-anchor="middle">${wcWeight==='chp'?fN(t/1000)+'K':fN(t)}</text>`).join('');
  s+=`<text x="${(m.l+W_-m.r)/2}" y="${H-4}" text-anchor="middle" class="mut">${wcWeight==='chp'?'Cumulative credit hours':'Programs, ranked by total margin'}</text>`;
  s+=`<line class="ax" x1="${m.l}" x2="${W_-m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  const path = pts.map((p,i)=>(i?'L':'M')+x(p[0]).toFixed(1)+','+y(p[1]).toFixed(1)).join('');
  s+=`<path d="${path}L${x(end[0])},${y(0)}L${x(0)},${y(0)}Z" style="fill:var(--accent);opacity:.08"/>`;
  s+=`<path d="${path}" fill="none" style="stroke:var(--accent)" stroke-width="2"/>`;
  s+=`<circle cx="${x(peak[0])}" cy="${y(peak[1])}" r="4.5" style="fill:var(--hi);stroke:var(--panel)" stroke-width="2"/>`;
  s+=`<text x="${x(peak[0])+8}" y="${y(peak[1])-8}" class="ink" style="font-weight:600">Peak ${f$(peak[1])} after ${npos} programs</text>`;
  s+=`<circle cx="${x(end[0])}" cy="${y(end[1])}" r="4.5" style="fill:var(--lo);stroke:var(--panel)" stroke-width="2"/>`;
  s+=`<text x="${x(end[0])-8}" y="${y(end[1])-10}" text-anchor="end" class="ink" style="font-weight:600">Portfolio ${f$(end[1])}</text>`;
  s+=segs.map(([x0,x1,c,r])=>`<rect class="hit" data-id="${r.id}" ${tipAttr(progTip(r,`<span>Cumulative</span><span>${f$(c)}</span>`))} x="${x(x0)}" y="${m.t}" width="${Math.max(1,x(x1)-x(x0))}" height="${H-m.b-m.t}" fill="transparent"/>`).join('');
  el.innerHTML = s+'</svg>';
}
function drawMix(el, a){
  const rows=[['Programs',r=>1],['Students',r=>r.e24],['Credit hours',r=>r.chp],['Cost',r=>r.cost]];
  const W_=560,rh=34,m={l:92,r:10,t:6}; const H=m.t+rows.length*(rh+10)+4;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Quadrant mix">`;
  rows.forEach(([lab,f],i)=>{
    const tot=sum(a,f)||1; let x0=m.l; const yy=m.t+i*(rh+10);
    s+=`<text x="${m.l-8}" y="${yy+rh/2+4}" text-anchor="end" class="ink">${lab}</text>`;
    QUADS.forEach(q=>{ const g=a.filter(r=>r.quad===q); const val=sum(g,f); const w=val/tot*(W_-m.l-m.r); if(w<=0) return;
      const tt=`<b>${q==='Not charted'?q:q.replace('High','Above line').replace('Low','Below line')}</b><div class="kv"><span>${lab}</span><span>${lab==='Cost'?f$(val):fN(val)} (${fP(val/tot)})</span><span>Programs</span><span>${g.length}</span><span>Total margin</span><span>${f$(sum(g,r=>r.mar))}</span></div>`;
      s+=`<rect ${tipAttr(tt)} x="${x0+1}" y="${yy}" width="${Math.max(0,w-2)}" height="${rh}" rx="3" style="fill:${QC[q]}"/>`;
      if(w>34) s+=`<text x="${x0+w/2}" y="${yy+rh/2+4}" text-anchor="middle" style="fill:${q.includes('growing')?'#fff':'var(--ink)'};font-weight:600;pointer-events:none">${Math.round(val/tot*100)}%</text>`;
      x0+=w; });
  });
  el.innerHTML = s+'</svg>';
}
function drawHist(el){
  const a=VIS.filter(r=>r.mrel!=null); const step=250, lo=-3000, hi=1500;
  const nb=(hi-lo)/step; const bins=Array.from({length:nb},(_,i)=>({x0:lo+i*step,n:0,list:[]}));
  const wf = r => histW==='n'?1:(r[histW]||0);
  a.forEach(r=>{ let i=Math.floor((Math.min(hi-1,Math.max(lo,r.mrel))-lo)/step); bins[i].n+=wf(r); bins[i].list.push(r); });
  const W_=560,H=260,m={l:48,r:10,t:10,b:40}; const ymax=Math.max(1,...bins.map(b=>b.n)); const yt=nice(0,ymax,4);
  const x=lin(lo,hi,m.l,W_-m.r), y=lin(0,yt[yt.length-1],H-m.b,m.t);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Margin histogram">`;
  s+=`<g class="grid">${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=yt.map(t=>`<text x="${m.l-6}" y="${y(t)+4}" text-anchor="end">${histW==='chp'?fN(t/1000)+'K':fN(t)}</text>`).join('');
  bins.forEach(b=>{ if(!b.n) return; const bw=x(b.x0+step)-x(b.x0)-2; const tt=`<b>${fC(b.x0)} to ${fC(b.x0+step)} vs line</b><div class="kv"><span>Programs</span><span>${b.list.length}</span><span>Students</span><span>${fN(sum(b.list,r=>r.e24))}</span><span>Total margin</span><span>${f$(sum(b.list,r=>r.mar))}</span></div><div style="margin-top:4px;color:var(--muted)">${b.list.slice().sort((p,q)=>(q.e24||0)-(p.e24||0)).slice(0,4).map(r=>esc(r.nm)).join('<br>')}</div>`;
    const top=y(b.n), h=H-m.b-top; s+=`<path ${tipAttr(tt)} d="M${x(b.x0)+1},${H-m.b}V${top+Math.min(4,h)}q0,-4 4,-4h${bw-8}q4,0 4,4V${H-m.b}Z" style="fill:${b.x0>=0?'var(--hi)':'var(--lo)'}"/>`; });
  s+=`<line class="ref" x1="${x(0)}" x2="${x(0)}" y1="${m.t}" y2="${H-m.b}"/><text x="${x(0)+4}" y="${m.t+10}" class="ink">line</text>`;
  s+=[-3000,-2000,-1000,0,1000].map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${t<=lo?'≤':''}${fC(t)}</text>`).join('');
  s+=`<text x="${(m.l+W_)/2}" y="${H-4}" text-anchor="middle" class="mut">Margin per CHP minus line</text>`;
  const md=median(a.map(r=>r.mrel));
  el.innerHTML = s+'</svg>'+`<p class="note">Median ${fC(md)} vs line · ${a.filter(r=>r.mrel<0).length} of ${a.length} costed programs below · ends clamped at ${fC(lo)} and ${fC(hi)}.</p>`;
}
const BANDS=[[0,0,'0'],[1,4,'1–4'],[5,9,'5–9'],[10,19,'10–19'],[20,49,'20–49'],[50,99,'50–99'],[100,249,'100–249'],[250,499,'250–499'],[500,1e9,'500+']];
function drawBands(el){
  const b=BANDS.map(([a,z,l])=>{const g=VIS.filter(r=>(r.e24||0)>=a&&(r.e24||0)<=z);return {l,g,n:g.length,mar:sum(g,r=>r.mar),cost:sum(g,r=>r.cost),e:sum(g,r=>r.e24)}});
  const W_=1000,H=380,m={l:64,r:16,t:20,b:24},split=160; const cw=(W_-m.l-m.r)/b.length;
  const nmax=Math.max(1,...b.map(x=>x.n)), nt=nice(0,nmax,3), yn=lin(0,nt[nt.length-1],split-10,m.t+6);
  const mlo=Math.min(0,...b.map(x=>x.mar)), mhi=Math.max(0,...b.map(x=>x.mar)); const mt=nice(mlo,mhi,4); const y2=lin(Math.min(mlo,mt[0]),Math.max(mhi,mt[mt.length-1]),H-m.b,split+46);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Size bands">`;
  s+=`<g class="grid">${nt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${yn(t)}" y2="${yn(t)}"/>`).join('')}${mt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y2(t)}" y2="${y2(t)}"/>`).join('')}</g>`;
  s+=nt.map(t=>`<text x="${m.l-8}" y="${yn(t)+4}" text-anchor="end">${t}</text>`).join('')+mt.map(t=>`<text x="${m.l-8}" y="${y2(t)+4}" text-anchor="end">${f$(t)}</text>`).join('');
  s+=`<text x="${m.l}" y="${m.t-2}" class="mut">Programs</text><text x="${m.l}" y="${split+38}" class="mut">Total margin</text>`;
  s+=`<line class="ax" x1="${m.l}" x2="${W_-m.r}" y1="${y2(0)}" y2="${y2(0)}"/>`;
  b.forEach((d,i)=>{ const x0=m.l+i*cw+cw*.18, w=cw*.64;
    const tt=`<b>Enrolment ${d.l}</b><div class="kv"><span>Programs</span><span>${d.n}</span><span>Students</span><span>${fN(d.e)}</span><span>Cost</span><span>${f$(d.cost)}</span><span>Total margin</span><span>${f$(d.mar)}</span></div>`;
    if(d.n) s+=`<rect ${tipAttr(tt)} x="${x0}" y="${yn(d.n)}" width="${w}" height="${split-10-yn(d.n)}" rx="3" style="fill:var(--accent)"/>`;
    s+=`<text x="${x0+w/2}" y="${yn(d.n)-5}" text-anchor="middle" class="ink">${d.n}</text>`;
    const yy=y2(Math.max(0,d.mar)), hh=Math.abs(y2(d.mar)-y2(0));
    if(d.mar) s+=`<rect ${tipAttr(tt)} x="${x0}" y="${yy}" width="${w}" height="${Math.max(1,hh)}" rx="3" style="fill:${d.mar>=0?'var(--hi)':'var(--lo)'}"/>`;
    s+=`<text x="${x0+w/2}" y="${d.mar<0?y2(d.mar)+13:y2(d.mar)-5}" text-anchor="middle" class="ink" style="font-size:10px">${d.mar?f$(d.mar):''}</text>`;
    s+=`<text x="${x0+w/2}" y="${split+8}" text-anchor="middle" class="ink" style="font-weight:600">${d.l}</text>`;
  });
  el.innerHTML=s+'</svg>';
}

/* ================= QUADRANTS ================= */
let qColor='quad';
function vQuadrants(v){
  v.innerHTML = `
  <div class="grid g2">
   <section data-s="bub1" class="panel" style="grid-column:1/-1"><header><div><h2>Program margin × enrolment trend</h2><p class="q">Guide analysis 1 (p. 117). X: ${P.trend==='c3'?'3-year':'10-year'} enrolment CAGR. Y: margin per CHP relative to ${P.marg==='thr'?'the costing-table threshold':'$0'}. Bubble: ${$('pSize').selectedOptions[0].text.toLowerCase()}. Click a bubble to open the program.</p></div>
    <div class="row">${seg('qc',[['quad','Colour: quadrant'],['cat','Colour: category'],['lm','Colour: labour market'],['fac','Highlight faculty']],qColor)}</div></header>
    <div id="bub1"></div><div id="leg1"></div></section>
   <section data-s="lma" class="panel"><header><div><h2>Program margin × labour market</h2><p class="q">Guide analysis 3 (p. 120). Columns run from weaker to stronger labour-market signal; programs with no signal sit apart on the right.</p></div></header><div id="bub2"></div></section>
   <section data-s="mkt" class="panel"><header><div><h2>Market size trend × market share trend</h2><p class="q">Guide analysis 2 (p. 119). The file has categorical trends only, so this is a matrix: cell shade = students; each cell lists programs, students and total margin.</p></div></header><div id="mkt"></div></section>
  </div>`;
  bindSeg(v,'qc',x=>{qColor=x;render()});
  drawBubble($('bub1')); drawLMA($('bub2')); drawMarket($('mkt'));
  $('leg1').innerHTML = qColor==='cat'?legendC(): qColor==='lm'?legendLM(): qColor==='fac'? `<div class="legend"><span><i style="background:var(--accent)"></i>${F.fac==='All'?'Pick a faculty in the filter bar to highlight it':esc(F.fac)}</span><span><i style="background:var(--nc)"></i>Other programs</span></div>` : legendQ();
}
function colorOf(r){ if(qColor==='cat') return CATC[r.cat]; if(qColor==='lm') return LMC[r.lmg]; if(qColor==='fac') return 'var(--nc)'; return QC[r.quad]; }
function drawBubble(el){
  const pool = qColor==='fac' ? ALL.filter(r=>(F.teach||!r.teach)&&(F.lv==='All'||r.lv===F.lv)) : VIS;
  const a = pool.filter(r=>r.quad!=='Not charted').sort((p,q)=>sizeVal(q)-sizeVal(p));
  const nc = VIS.filter(r=>r.quad==='Not charted');
  const W_=1000,H=520,m={l:70,r:20,t:24,b:44};
  const xl=-50, xh=50, yl=P.marg==='thr'?-3000:-4000, yh=P.marg==='thr'?1800:1000;
  const x=lin(xl,xh,m.l,W_-m.r), y=lin(yl,yh,H-m.b,m.t), cut=P.grow;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Margin by enrolment trend">`;
  const xt=[-50,-40,-30,-20,-10,0,10,20,30,40,50], yt=nice(yl,yh,7);
  s+=`<g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=xt.map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${t===xl?'≤':t===xh?'≥':''}${t>0?'+':''}${t}%</text>`).join('');
  s+=yt.map(t=>`<text x="${m.l-8}" y="${y(t)+4}" text-anchor="end">${t>0?'+':''}${fC(t)}</text>`).join('');
  s+=`<text x="${(m.l+W_)/2}" y="${H-6}" text-anchor="middle" class="mut">Enrolment CAGR (${P.trend==='c3'?'2021-22 to 2024-25':'10-year'})</text>`;
  s+=`<text transform="translate(14,${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle" class="mut">Margin per CHP vs line</text>`;
  s+=`<line class="ax" x1="${x(cut)}" x2="${x(cut)}" y1="${m.t}" y2="${H-m.b}"/><line class="ax" x1="${m.l}" x2="${W_-m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  // quadrant summaries from VIS
  const qs={'High / declining':[m.l+8,m.t+14,'start'],'High / growing':[W_-m.r-8,m.t+14,'end'],'Low / declining':[m.l+8,H-m.b-26,'start'],'Low / growing':[W_-m.r-8,H-m.b-26,'end']};
  Object.entries(qs).forEach(([q,[qx,qy,an]])=>{ const g=VIS.filter(r=>r.quad===q);
    s+=`<text x="${qx}" y="${qy}" text-anchor="${an}" class="ink" style="font-weight:700;font-family:var(--f-display)">${q.replace('High','Above line').replace('Low','Below line')}</text>`;
    s+=`<text x="${qx}" y="${qy+15}" text-anchor="${an}">${g.length} programs · ${fN(sum(g,r=>r.e24))} students · ${f$(sum(g,r=>r.mar))}</text>`; });
  a.forEach(r=>{ const cx=x(Math.max(xl,Math.min(xh,r.tr*100))), cy=y(Math.max(yl,Math.min(yh,r.mrel))); const hl = qColor==='fac' && r.fac===F.fac;
    const fill = qColor==='fac' ? (hl?'var(--accent)':'var(--nc)') : colorOf(r);
    s+=`<circle class="hit" data-id="${r.id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad(r,26).toFixed(1)}" style="fill:${fill};fill-opacity:${qColor==='fac'&&!hl?.35:.78};stroke:var(--panel)" stroke-width="1.2"/>`; });
  // label top 6 by size
  const placed=[]; a.slice(0,10).forEach(r=>{ const cx=x(Math.max(xl,Math.min(xh,r.tr*100))), cy=y(Math.max(yl,Math.min(yh,r.mrel))); const ly=cy-rad(r,26)-4; if(placed.some(([px,py])=>Math.abs(px-cx)<150&&Math.abs(py-ly)<14)) return; placed.push([cx,ly]); s+=`<text x="${cx}" y="${cy-rad(r,26)-4}" text-anchor="middle" class="ink" style="font-size:10px;pointer-events:none">${esc(r.nm.replace(/^[A-Z]+_([A-Z|\s]+_)?/,'').slice(0,26))}</text>`; });
  el.innerHTML = s+'</svg>'+`<p class="note">${nc.length} programs not charted (no costing, no trend, or no 2024-25 enrolment) hold ${fN(sum(nc,r=>r.e24))} students and ${f$(sum(nc,r=>r.mar))}. Points beyond the axis ranges are pinned to the edge.</p>`;
}
function drawLMA(el){
  const cols=[[4,'4 · weakest'],[3,'3 · weaker'],[2,'2 · stronger'],[1,'1 · strongest'],[0,'No signal']];
  const a=VIS.filter(r=>r.mrel!=null).sort((p,q)=>sizeVal(q)-sizeVal(p));
  const W_=560,H=420,m={l:62,r:10,t:30,b:40}; const cw=(W_-m.l-m.r-20)/5;
  const yl=P.marg==='thr'?-3000:-4000, yh=P.marg==='thr'?1800:1000; const y=lin(yl,yh,H-m.b,m.t);
  const cx = i => m.l + i*cw + cw/2 + (i===4?20:0);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Margin by labour market">`;
  const yt=nice(yl,yh,6);
  s+=`<g class="grid">${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=yt.map(t=>`<text x="${m.l-6}" y="${y(t)+4}" text-anchor="end">${t>0?'+':''}${fC(t)}</text>`).join('');
  s+=`<line class="ax" x1="${m.l}" x2="${W_-m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  s+=`<line class="ref" x1="${m.l+4*cw+10}" x2="${m.l+4*cw+10}" y1="${m.t}" y2="${H-m.b}"/>`;
  cols.forEach(([k,l],i)=>{ const g=a.filter(r=>(r.lma??0)===k);
    s+=`<text x="${cx(i)}" y="${H-m.b+16}" text-anchor="middle" class="ink">${l}</text><text x="${cx(i)}" y="${H-m.b+30}" text-anchor="middle">${g.length} · ${f$(sum(g,r=>r.mar))}</text>`;
    g.forEach(r=>{ const jx=cx(i)+(hash(r.id)-.5)*cw*.78; const cy=y(Math.max(yl,Math.min(yh,r.mrel)));
      s+=`<circle class="hit" data-id="${r.id}" cx="${jx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad(r,14).toFixed(1)}" style="fill:${qColor==='fac'?(r.fac===F.fac?'var(--accent)':'var(--nc)'):colorOf(r)};fill-opacity:.78;stroke:var(--panel)" stroke-width="1"/>`; }); });
  s+=`<text x="${m.l+4}" y="${m.t-12}" class="ink" style="font-weight:600">Higher margin</text><text x="${m.l+4}" y="${H-m.b-6}" class="ink" style="font-weight:600">Lower margin</text>`;
  const strongBelow = VIS.filter(r=>r.lmaS==='strong'&&r.above===false);
  el.innerHTML=s+'</svg>'+`<p class="note">${strongBelow.length} programs pair a stronger labour-market signal with a below-line margin (${fN(sum(strongBelow,r=>r.e24))} students, ${f$(sum(strongBelow,r=>r.mar))}). Colour follows the quadrant control above.</p>`;
}
function drawMarket(el){
  const rows=['Growing market','Stable market','Shrinking market','Insufficient data'], cols=['Falling share','Stable share','Rising share','Insufficient data'];
  const cell=(mk,sh)=>VIS.filter(r=>r.mkt===mk&&r.mst===sh);
  const emax=Math.max(1,...rows.flatMap(mk=>cols.map(sh=>sum(cell(mk,sh),r=>r.e24))));
  let h=`<div class="tblwrap" style="max-height:none"><table class="matrix"><thead><tr><th></th>${cols.map(c=>`<th>${c.replace(' share','')}<br><span style="text-transform:none;font-weight:400">share</span></th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(mk=>{ h+=`<tr><th style="text-align:left;position:static">${mk.replace(' market','')}${mk.includes('market')?'<br><span style="text-transform:none;font-weight:400">market</span>':''}</th>`;
    cols.forEach(sh=>{ const g=cell(mk,sh), e=sum(g,r=>r.e24), mar=sum(g,r=>r.mar); const pct=Math.round(e/emax*55);
      const tt=`<b>${sh} in a ${mk.toLowerCase()}</b><div style="margin-top:4px">${g.slice().sort((p,q)=>(q.e24||0)-(p.e24||0)).slice(0,8).map(r=>esc(r.nm)+' · '+fN(r.e24)).join('<br>')}${g.length>8?'<br>…':''}</div>`;
      h+= g.length? `<td ${tipAttr(tt)} style="background:color-mix(in srgb, var(--hi) ${pct}%, var(--panel));white-space:normal;line-height:1.25"><b style="font-size:.95rem">${g.length}</b><br><span style="font-size:.72rem">${fN(e)} st.<br>${f$(mar)}</span></td>` : `<td class="mut" style="color:var(--muted)">–</td>`; });
    h+='</tr>'; });
  const sole=VIS.filter(r=>r.sole);
  el.innerHTML=h+`</tbody></table></div><p class="note">${sole.length} of ${VIS.length} programs are the only NS provider (100% share), so most share trends read "stable" by construction. Treat sole provision as a uniqueness signal rather than a competitive one.</p>`;
}

/* ================= FACULTIES ================= */
function facRows(){
  const a = ALL.filter(r=>(F.lv==='All'||r.lv===F.lv)&&(F.cat==='All'||r.cat===F.cat)&&(F.teach||!r.teach));
  return FACS.map(f=>{ const g=a.filter(r=>r.fac===f); const t=totals(g); const below=g.filter(r=>r.above===false);
    const dAbove=sum(g.filter(r=>r.mar>0),r=>r.e24-r.e21), dBelow=sum(g.filter(r=>!(r.mar>0)),r=>r.e24-r.e21);
    return {f,g,...t,d:t.e21?t.e24/t.e21-1:null,dAbs:t.e24-t.e21,dAbove,dBelow,belowSh:t.e24?sum(below,r=>r.e24)/t.e24:0,smallSh:g.length?g.filter(r=>r.small).length/g.length:0,
      mix:CATS.map(c=>g.filter(r=>r.cat===c).length), medrel:median(g.map(r=>r.mrel))}; }).filter(r=>r.n);
}
function vFaculties(v){
  const rows=facRows(); const k=facSort.k, d=facSort.d;
  rows.sort((a,b)=>((a[k]??-1e18)>(b[k]??-1e18)?1:-1)*d);
  const mmax=Math.max(...rows.map(r=>Math.abs(r.mar)));
  const th=(key,l,n)=>`<th class="${n?'n':''}" data-k="${key}">${l}${facSort.k===key?(facSort.d>0?' ↑':' ↓'):''}</th>`;
  v.innerHTML = `
  <div class="grid">
   <section data-s="facT" class="panel"><header><div><h2>Faculty scorecard</h2><p class="q">Totals use the level, category and teach-out filters but ignore the faculty filter, so every faculty stays comparable. Click a column to sort.</p></div></header>
   <div class="tblwrap" style="max-height:none"><table id="facT"><thead><tr>${th('f','Faculty')}${th('n','Programs',1)}${th('e24','Students',1)}${th('d','Enrol. Δ 3-yr',1)}${th('rec','Tuition coverage',1)}${th('mpc','Margin/CHP',1)}${th('mar','Contribution',1)}${th('belowSh','Students below line',1)}${th('smallSh','Programs subscale',1)}<th>Category mix (programs)</th></tr></thead><tbody>
   ${rows.map(r=>`<tr${r.f===F.fac?' class="sel"':''}><td><b>${esc(r.f)}</b> ${SKEW.filter(x=>['M5','M6','M8'].includes(x.id)&&x.pred({fac:r.f})).map(mchip).join('')}</td><td class="n">${r.n}</td><td class="n">${fN(r.e24)}</td><td class="n ${r.d>=0?'pos':'neg'}">${fPs(r.d)}</td><td class="n">${fP(r.rec,0)}</td><td class="n">${fC(r.mpc)}</td>
   <td class="n"><svg viewBox="0 0 180 14" style="width:180px;display:inline-block;vertical-align:middle"><line x1="90" x2="90" y1="0" y2="14" class="ax"/><rect x="${r.mar<0?90-Math.abs(r.mar)/mmax*86:90}" y="2" width="${Math.max(1,Math.abs(r.mar)/mmax*86)}" height="10" rx="2" style="fill:${r.mar<0?'var(--lo)':'var(--hi)'}"/></svg> ${f$(r.mar)}</td>
   <td class="n">${fP(r.belowSh,0)}</td><td class="n">${fP(r.smallSh,0)}</td>
   <td><svg viewBox="0 0 120 12" style="width:120px">${(()=>{let x0=0;return r.mix.map((c,i)=>{const w=c/r.n*120;const o=w>0?`<rect ${tipAttr(`<b>${esc(r.f)}</b><br>${CATS[i]}: ${c} programs`)} x="${x0}" y="0" width="${Math.max(0,w-1)}" height="12" rx="2" style="fill:${CATC[CATS[i]]}"/>`:'';x0+=w;return o;}).join('')})()}</svg></td></tr>`).join('')}
   </tbody></table></div>${legendC()}</section>
   <div class="grid g2" style="margin-top:0">
    <section data-s="strip" class="panel"><header><div><h2>Spread of margin within each faculty</h2><p class="q">Each dot is a program (size: ${$('pSize').selectedOptions[0].text.toLowerCase()}); the tick is the faculty median. Wide spreads mean faculty averages hide very different programs.</p></div></header><div id="strip"></div>${legendQ()}</section>
    <section data-s="grow" class="panel"><header><div><h2>Where enrolment growth landed</h2><p class="q">Change in students, 2021-22 to 2024-25, split by whether each program has a positive or negative dollar margin.</p></div></header><div id="grow"></div><div class="legend"><span><i style="background:var(--hi)"></i>Programs with positive $ margin</span><span><i style="background:var(--lo)"></i>Programs with negative $ margin</span></div></section>
   </div>
  </div>`;
  $('facT').querySelector('thead').onclick=e=>{const t=e.target.closest('[data-k]'); if(!t) return; facSort = {k:t.dataset.k, d: facSort.k===t.dataset.k? -facSort.d : (t.dataset.k==='f'?1:-1)}; render();};
  drawStrip($('strip'), rows); drawGrow($('grow'), rows);
}
function drawStrip(el, rows){
  rows = rows.slice().sort((a,b)=>(a.medrel??0)-(b.medrel??0));
  const W_=560,rh=30,m={l:150,r:14,t:10,b:34},H=m.t+rows.length*rh+m.b;
  const xl=P.marg==='thr'?-3000:-4000, xh=P.marg==='thr'?1500:1000; const x=lin(xl,xh,m.l,W_-m.r); const xt=nice(xl,xh,5);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Faculty margin spread"><g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}</g>`;
  s+=xt.map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${t>0?'+':''}${fC(t)}</text>`).join('')+`<text x="${(m.l+W_)/2}" y="${H-4}" text-anchor="middle" class="mut">Margin per CHP vs line</text>`;
  s+=`<line class="ref" x1="${x(0)}" x2="${x(0)}" y1="${m.t}" y2="${H-m.b}"/>`;
  rows.forEach((r,i)=>{ const cy=m.t+i*rh+rh/2; s+=`<text x="${m.l-8}" y="${cy+4}" text-anchor="end" class="ink" style="${r.f===F.fac?'font-weight:700':''}">${esc(r.f)}</text>`;
    r.g.filter(p=>p.mrel!=null).sort((p,q)=>sizeVal(q)-sizeVal(p)).forEach(p=>{ s+=`<circle class="hit" data-id="${p.id}" cx="${x(Math.max(xl,Math.min(xh,p.mrel))).toFixed(1)}" cy="${(cy+(hash(p.id)-.5)*rh*.5).toFixed(1)}" r="${rad(p,11).toFixed(1)}" style="fill:${QC[p.quad]};fill-opacity:.8;stroke:var(--panel)" stroke-width="1"/>`; });
    if(r.medrel!=null) s+=`<line x1="${x(r.medrel)}" x2="${x(r.medrel)}" y1="${cy-rh*.42}" y2="${cy+rh*.42}" style="stroke:var(--ink)" stroke-width="2.5"/>`; });
  el.innerHTML=s+'</svg>';
}
function drawGrow(el, rows){
  rows = rows.slice().sort((a,b)=>b.dAbs-a.dAbs);
  const W_=560,rh=28,m={l:150,r:50,t:10,b:30},H=m.t+rows.length*rh+m.b;
  const mx=Math.max(10,...rows.map(r=>Math.max(Math.max(0,r.dAbove)+Math.max(0,r.dBelow), -Math.min(0,r.dAbove)-Math.min(0,r.dBelow))));
  const xt=nice(-mx,mx,6); const x=lin(xt[0],xt[xt.length-1],m.l,W_-m.r);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Enrolment change by faculty"><g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}</g>`;
  s+=xt.map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${t>0?'+':''}${t}</text>`).join('')+`<line class="ax" x1="${x(0)}" x2="${x(0)}" y1="${m.t}" y2="${H-m.b}"/>`;
  rows.forEach((r,i)=>{ const yy=m.t+i*rh+5, h=rh-10; s+=`<text x="${m.l-8}" y="${yy+h/2+4}" text-anchor="end" class="ink">${esc(r.f)}</text>`;
    let pos=0,neg=0; [['dAbove','var(--hi)','positive'],['dBelow','var(--lo)','negative']].forEach(([k,c,lab])=>{ const val=r[k]; if(!val) return; let x0,x1; if(val>0){x0=x(pos);pos+=val;x1=x(pos);} else {x1=x(neg);neg+=val;x0=x(neg);}
      s+=`<rect ${tipAttr(`<b>${esc(r.f)}</b><br>${val>0?'+':''}${val} students in programs with ${lab} $ margin`)} x="${x0+.5}" y="${yy}" width="${Math.max(1,x1-x0-1)}" height="${h}" rx="2" style="fill:${c}"/>`; });
    s+=`<text x="${x(pos)+5}" y="${yy+h/2+4}" class="ink" style="font-size:10px">${r.dAbs>0?'+':''}${r.dAbs}</text>`; });
  const tA=sum(rows,r=>r.dAbove), tB=sum(rows,r=>r.dBelow);
  el.innerHTML=s+'</svg>'+`<p class="note">Net change ${tA+tB>0?'+':''}${tA+tB} students: ${tA>0?'+':''}${tA} in positive-margin programs, ${tB>0?'+':''}${tB} in negative-margin programs.</p>`;
}

/* ================= PROGRAMS ================= */
let progQ='';
function vPrograms(v){
  const a=VIS.slice(); const k=progSort.k, d=progSort.d;
  const val = (r) => k==='nm'||k==='fac'||k==='cat'? r[k] : (r[k]??-1e18);
  a.sort((p,q)=>(val(p)>val(q)?1:val(p)<val(q)?-1:0)*d);
  const shown = a.filter(r=>(!progQ || (r.nm+' '+r.full+' '+r.fac).toLowerCase().includes(progQ.toLowerCase())) && (!mFilter || (SKEWBY[mFilter].pred&&SKEWBY[mFilter].pred(r))));
  const th=(key,l,n)=>`<th class="${n?'n':''}" data-k="${key}">${l}${progSort.k===key?(progSort.d>0?' ↑':' ↓'):''}</th>`;
  v.innerHTML = `
  <div class="grid g2">
   <section data-s="ro" class="panel"><header><div><h2>Risk × opportunity map</h2><p class="q">Scores add the weights of each flag a program trips. Weights are yours to set; the map and table re-rank as you move them.</p></div></header><div id="ro"></div>${legendC()}</section>
   <section data-s="weights" class="panel"><header><div><h2>Flag weights</h2><p class="q">0 turns a flag off. Thresholds behind each flag come from the analysis parameters above.</p></div><button class="btn" id="wReset" type="button">Reset weights</button></header>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 24px">
     <div><h3 style="color:var(--lo)">Risk flags</h3>${RISK.map(([k,l])=>wSlider(k,l)).join('')}</div>
     <div><h3 style="color:var(--hi)">Opportunity flags</h3>${OPP.map(([k,l])=>wSlider(k,l)).join('')}</div>
    </div></section>
   <section data-s="progT" class="panel" style="grid-column:1/-1"><header><div><h2>Program screen</h2><p class="q">${shown.length} programs${mFilter?` with method caveat <b>${mFilter}</b> (${esc(SKEWBY[mFilter].t)})`:''}. Click a row for its peer comparison. Violet chips are method caveats (see Costing model).</p></div><div class="row"><label class="ctl" for="mf">Method caveat<select id="mf"><option value="">Any</option>${SKEW.filter(x=>x.pred).map(x=>`<option value="${x.id}"${x.id===mFilter?' selected':''}>${x.id} · ${esc(x.t)}</option>`).join('')}</select></label><label class="ctl" for="pq">Search<input id="pq" type="search" value="${esc(progQ)}" placeholder="Program or faculty" style="font:inherit;font-size:.85rem;padding:4px 8px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);min-width:200px"></label></div></header>
    <div class="tblwrap"><table id="progT"><thead><tr>${th('nm','Program')}${th('fac','Faculty')}${th('cat','Category')}${th('e24','Students',1)}${th('tr','Trend',1)}${th('mrel','Margin/CHP vs line',1)}${th('mar','Total margin',1)}${th('lma','LMA',1)}${th('risk','Risk',1)}${th('opp','Opp.',1)}<th>Flags</th></tr></thead><tbody>
    ${shown.map(r=>`<tr data-row="${r.id}"${r.id===selId?' class="sel"':''} style="cursor:pointer"><td title="${esc(r.full)}">${esc(r.nm)}${r.teach?' <span class="chip">'+esc(r.st)+'</span>':''}</td><td>${esc(r.fac)}</td><td><span class="cat"><i style="background:${CATC[r.cat]}"></i>${r.cat}</span></td><td class="n">${fN(r.e24)}</td><td class="n">${fPs(r.tr)}</td><td class="n ${r.mrel==null?'':r.mrel>=0?'pos':'neg'}">${r.mrel==null?'–':(r.mrel>0?'+':'')+fC(r.mrel)}</td><td class="n">${f$(r.mar)}</td><td class="n">${r.lma??'–'}</td><td class="n"><b>${r.risk}</b></td><td class="n"><b>${r.opp}</b></td>
    <td>${skewsFor(r).map(mchip).join('')}${RISK.filter(([k])=>r.R[k]&&W[k]).map(([k,l])=>`<span class="chip r">${l}</span>`).join('')}${OPP.filter(([k])=>r.O[k]&&W[k]).map(([k,l])=>`<span class="chip o">${l}</span>`).join('')}</td></tr>`).join('')}
    </tbody></table></div></section>
   <section data-s="detail" class="panel" id="detail" style="grid-column:1/-1"></section>
  </div>`;
  v.querySelectorAll('input[data-w]').forEach(i=>{ i.oninput=()=>{ i.previousElementSibling.textContent='×'+i.value; }; i.onchange=()=>{W[i.dataset.w]=+i.value; store.set('W',W); render(); const n=$('w_'+i.dataset.w); n&&n.focus({preventScroll:true});}; });
  $('wReset').onclick=()=>{W={...DEF_W};store.set('W',W);render();};
  $('progT').querySelector('thead').onclick=e=>{const t=e.target.closest('[data-k]'); if(!t) return; progSort={k:t.dataset.k,d:progSort.k===t.dataset.k?-progSort.d:(['nm','fac','cat'].includes(t.dataset.k)?1:-1)}; render();};
  $('progT').querySelector('tbody').onclick=e=>{const t=e.target.closest('[data-row]'); if(!t) return; selId=+t.dataset.row; render(); requestAnimationFrame(()=>$('detail').scrollIntoView({block:'start',behavior:'smooth'}));};
  $('mf').onchange=e=>{mFilter=e.target.value; render();};
  $('pq').oninput=e=>{progQ=e.target.value; const pos=e.target.selectionStart; render(); const n=$('pq'); n.focus(); n.setSelectionRange(pos,pos);};
  drawRO($('ro')); drawDetail($('detail'));
}
function wSlider(k,l){ return `<div class="lever"><span class="lab">${l}</span><span class="val">×${W[k]}</span><input type="range" min="0" max="3" step="1" value="${W[k]}" data-w="${k}" id="w_${k}" aria-label="${l} weight"></div>`; }
function drawRO(el){
  const a=VIS.slice().sort((p,q)=>sizeVal(q)-sizeVal(p));
  const rmax=Math.max(1,sum(RISK,([k])=>W[k])), omax=Math.max(1,sum(OPP,([k])=>W[k]));
  const W_=560,H=400,m={l:44,r:14,t:24,b:40}; const x=lin(-.5,omax+.5,m.l,W_-m.r), y=lin(-.5,rmax+.5,H-m.b,m.t);
  const mr=rmax/2, mo=omax/2;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Risk by opportunity">`;
  const xt=nice(0,omax,Math.min(omax,8)), yt=nice(0,rmax,Math.min(rmax,8));
  s+=`<g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=xt.map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${t}</text>`).join('')+yt.map(t=>`<text x="${m.l-8}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('');
  s+=`<text x="${(m.l+W_)/2}" y="${H-4}" text-anchor="middle" class="mut">Opportunity score</text><text transform="translate(12,${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle" class="mut">Risk score</text>`;
  s+=`<line class="ref" x1="${x(mo)}" x2="${x(mo)}" y1="${m.t}" y2="${H-m.b}"/><line class="ref" x1="${m.l}" x2="${W_-m.r}" y1="${y(mr)}" y2="${y(mr)}"/>`;
  const lab=[[m.l+6,m.t-8,'start','Rationalization review'],[W_-m.r-6,m.t-8,'end','Invest to fix'],[W_-m.r-6,H-m.b-6,'end','Grow']];
  lab.forEach(([lx,ly,an,t])=>s+=`<text x="${lx}" y="${ly}" text-anchor="${an}" class="ink" style="font-size:10px;font-weight:600">${t}</text>`);
  a.forEach(r=>{ const cx=x(r.opp+(hash(r.id)-.5)*.7), cy=y(r.risk+(hash(r.id*7+3)-.5)*.7); s+=`<circle class="hit" data-id="${r.id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad(r,14).toFixed(1)}" style="fill:${CATC[r.cat]};fill-opacity:.75;stroke:${r.id===selId?'var(--ink)':'var(--panel)'}" stroke-width="${r.id===selId?2.5:1}"/>`; });
  el.innerHTML=s+'</svg>';
}
function drawDetail(el){
  const r = ALL.find(x=>x.id===selId);
  if(!r){ el.innerHTML='<h2>Peer comparison</h2><p class="empty">Click a program in the table or any chart to see where it sits in each distribution.</p>'; return; }
  const peers = ALL.filter(p=> cmpGroup==='lv'? p.lv===r.lv : cmpGroup==='fac'? p.fac===r.fac : true);
  const mets=[['e24','2024-25 enrolment',fN,true],['c3','3-yr CAGR',fPs],['c10','10-yr CAGR',fPs],['mrel','Margin/CHP vs line',v=>(v>0?'+':'')+fC(v)],['mar','Total margin',f$],['costRec','Tuition coverage',v=>fP(v,0)],['cr10','Credentials, 10-yr',fN,true]];
  const W_=1000,rh=40,m={l:170,r:110,t:8},H=m.t+mets.length*rh+6;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Peer distribution strips">`;
  mets.forEach(([k,l,fmt,log],i)=>{ const vals=peers.map(p=>p[k]).filter(v=>v!=null&&!isNaN(v)).sort((a,b)=>a-b); const cy=m.t+i*rh+rh/2; if(!vals.length) return;
    const q=p=>vals[Math.min(vals.length-1,Math.floor(p*(vals.length-1)))]; let lo=q(.02), hi=q(.98); if(r[k]!=null){lo=Math.min(lo,r[k]);hi=Math.max(hi,r[k]);}
    const tf = log? v=>Math.log10(Math.max(0,v)+1) : v=>v; const x=lin(tf(lo),tf(hi),m.l,W_-m.r); const X=v=>x(tf(Math.max(lo,Math.min(hi,v))));
    s+=`<text x="${m.l-10}" y="${cy+4}" text-anchor="end" class="ink">${l}</text>`;
    s+=`<rect x="${X(q(.25))}" y="${cy-9}" width="${Math.max(1,X(q(.75))-X(q(.25)))}" height="18" rx="3" style="fill:var(--mid)"/>`;
    s+=`<line x1="${m.l}" x2="${W_-m.r}" y1="${cy}" y2="${cy}" class="ax"/>`;
    peers.forEach(p=>{ if(p[k]==null||p.id===r.id) return; s+=`<circle data-id="${p.id}" class="hit" cx="${X(p[k]).toFixed(1)}" cy="${(cy+(hash(p.id)-.5)*12).toFixed(1)}" r="2.6" style="fill:${p.fac===r.fac&&cmpGroup!=='fac'?'var(--accent)':'var(--nc)'};fill-opacity:.85"/>`; });
    s+=`<line x1="${X(q(.5))}" x2="${X(q(.5))}" y1="${cy-10}" y2="${cy+10}" style="stroke:var(--ink-2)" stroke-width="1.5"/>`;
    if(r[k]!=null){ const pr = vals.filter(v=>v<r[k]).length/vals.length; s+=`<circle cx="${X(r[k])}" cy="${cy}" r="7" style="fill:${(k==='mrel'||k==='mar')?(r[k]>=0?'var(--hi)':'var(--lo)'):'var(--ink)'};stroke:var(--panel)" stroke-width="2"/>`;
      s+=`<text x="${W_-m.r+10}" y="${cy}" class="ink" style="font-weight:600">${fmt(r[k])}</text><text x="${W_-m.r+10}" y="${cy+13}" style="font-size:10px">${Math.round(pr*100)}th pct</text>`; }
    else s+=`<text x="${W_-m.r+10}" y="${cy+4}" class="mut">no data</text>`; });
  el.innerHTML = `<header><div><h2>${esc(r.nm)}</h2><p class="q">${esc(r.full)}</p></div>${seg('cmp',[['lv','vs same level'],['fac','vs same faculty'],['all','vs all programs']],cmpGroup)}</header>
  <div class="detail"><div class="meta"><span><b>${esc(r.fac)}</b> · ${esc(r.dept)}</span><span>${r.lv} · ${r.cred} · ${esc(r.th)}</span><span>Status: ${esc(r.st)}</span><span><span class="cat"><i style="background:${CATC[r.cat]}"></i>Agreed: ${r.cat}</span></span><span>Signal-implied: ${r.icat}</span><span>Quadrant: ${r.quad}</span><span>LMA ${r.lma??'–'} · ${esc(r.emp)} · ${esc(r.pv)}</span><span>NS share ${fP(r.ms,0)} · ${esc(r.mst)} · ${esc(r.mkt)}</span><span>Credentials: ${esc(r.grad)}</span>${r.res?'<span>Research-priority aligned</span>':''}</div>
  <div style="overflow-x:auto">${s}</svg></div>
  ${(()=>{ const sk=skewsFor(r); return sk.length?`<div class="caveats"><div class="st-k">Method caveats that apply to this program</div>${sk.map(x=>`<div class="cv">${mchip(x)}<div><b>${esc(x.t)}</b> <span class="dir" style="color:${DIR[x.dir][1]};border-color:${DIR[x.dir][1]}">${DIR[x.dir][0]}</span><br><span style="color:var(--ink-2)">${esc(x.where)}</span></div></div>`).join('')}<div class="cv"><span class="chip m">M4</span><div><b>${esc(SKEWBY.M4.t)}</b> applies to every program; <b>M7</b> applies to every cost figure.</div></div></div>`:`<div class="caveats"><div class="st-k">Method caveats</div>Portfolio-wide caveats M4 and M7 apply. No program-specific caveat is flagged.</div>`; })()}
  <p class="note">Shaded band: middle 50% of the comparison group; vertical tick: median; ${cmpGroup!=='fac'?'blue dots: same-faculty programs; ':''}large dot: this program. Enrolment and credentials use a log scale.</p></div>`;
  bindSeg(el,'cmp',x=>{cmpGroup=x;render();});
}

/* ================= CATEGORIES ================= */
function vCategories(v){
  const ic=['Modernize','Revitalize','Rationalize','No Change','Insufficient data'];
  const a=VIS; const nOv=Object.keys(OV).length;
  const mism=a.filter(r=>r.icat!=='Insufficient data'&&r.icat!==r.cat);
  let list = matrixSel? a.filter(r=>r.cat===matrixSel[0]&&r.icat===matrixSel[1]) : mism;
  list = list.slice().sort((p,q)=>(q.e24||0)-(p.e24||0));
  v.innerHTML = `
  <div class="grid g2">
   <section data-s="cmat" class="panel"><header><div><h2>Agreed category × signal-implied category</h2><p class="q">The signal-implied category is a mechanical reading of the guide's quadrant logic: above-line and growing → Modernize (stronger labour market) or No Change; below-line and growing → Modernize; above-line and declining → Revitalize; below-line and declining → Rationalize if subscale without a strong labour-market signal, otherwise Revitalize. Teach-out programs → No Change. It is a prompt for review, not a recommendation.</p></div></header>
    <div class="tblwrap" style="max-height:none"><table class="matrix"><thead><tr><th style="text-align:left">Agreed ↓ · Signal →</th>${ic.map(c=>`<th>${c}</th>`).join('')}<th>Total</th></tr></thead><tbody>
    ${CATS.map(c=>{ const row=a.filter(r=>r.cat===c); return `<tr><th style="text-align:left;position:static"><span class="cat"><i style="background:${CATC[c]}"></i>${c}</span></th>${ic.map(k=>{const n=row.filter(r=>r.icat===k).length; const on=matrixSel&&matrixSel[0]===c&&matrixSel[1]===k; const diag=c===k; return `<td class="cell" data-c="${c}" data-k="${k}" style="${diag?'background:var(--accent-wash);':''}${on?'outline:2px solid var(--accent);outline-offset:-2px;':''}color:${n?'var(--ink)':'var(--muted)'}">${n||'·'}</td>`}).join('')}<td class="n"><b>${row.length}</b></td></tr>`;}).join('')}
    </tbody></table></div>
    <p class="note">${a.filter(r=>r.icat===r.cat).length} programs agree with the signal; ${mism.length} differ; ${a.filter(r=>r.icat==='Insufficient data').length} lack the data to say. Click a cell to list its programs.</p></section>
   <section data-s="cmix" class="panel"><header><div><h2>Category mix by faculty</h2><p class="q">Includes your reassignments. Shares by ${mixW==='n'?'program count':'2024-25 students'}.</p></div>${seg('mw',[['n','Programs'],['e24','Students']],mixW)}</header><div id="catmix"></div>${legendC()}</section>
   <section data-s="clist" class="panel" style="grid-column:1/-1"><header><div><h2>${matrixSel?`${esc(matrixSel[0])} agreed, ${esc(matrixSel[1])} implied`:'Programs where the agreed category differs from the signal'}</h2><p class="q">${list.length} programs, largest first. Reassign a category to test it; changes stay in this browser and feed the Scenarios tab.</p></div>
    <div class="row">${matrixSel?'<button class="btn" id="clrSel" type="button">Show all mismatches</button>':''}<span class="scope">${nOv} reassigned</span><button class="btn" id="cpy" type="button" ${nOv?'':'disabled'}>Copy changes as CSV</button><button class="btn" id="ovReset" type="button" ${nOv?'':'disabled'}>Undo all reassignments</button></div></header>
    <textarea id="cpyBox" hidden readonly style="width:100%;height:90px;font-family:var(--f-mono);font-size:.75rem;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px"></textarea>
    <div class="tblwrap"><table><thead><tr><th>Program</th><th>Faculty</th><th class="n">Students</th><th class="n">Trend</th><th class="n">Margin/CHP vs line</th><th class="n">Total margin</th><th class="n">LMA</th><th>Signal</th><th>Category</th></tr></thead><tbody>
    ${list.map(r=>`<tr><td><span data-id="${r.id}" style="cursor:help">${esc(r.nm)}</span></td><td>${esc(r.fac)}</td><td class="n">${fN(r.e24)}</td><td class="n">${fPs(r.tr)}</td><td class="n">${r.mrel==null?'–':(r.mrel>0?'+':'')+fC(r.mrel)}</td><td class="n">${f$(r.mar)}</td><td class="n">${r.lma??'–'}</td><td>${r.icat}</td>
    <td><select data-ov="${r.id}" aria-label="Category for ${esc(r.nm)}" style="${OV[r.id]?'border-color:var(--accent);font-weight:600':''}">${CATS.map(c=>`<option${c===r.cat?' selected':''}>${c}</option>`).join('')}</select>${OV[r.id]?` <span class="mono" style="color:var(--muted)">was ${RAW.find(x=>x.id===r.id).cat}</span>`:''}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">No programs in this cell.</td></tr>'}
    </tbody></table></div></section>
  </div>`;
  v.querySelectorAll('td.cell').forEach(td=>td.onclick=()=>{ matrixSel=[td.dataset.c,td.dataset.k]; render(); });
  const cs=$('clrSel'); if(cs) cs.onclick=()=>{matrixSel=null;render();};
  bindSeg(v,'mw',x=>{mixW=x;render();});
  v.querySelectorAll('select[data-ov]').forEach(s=>s.onchange=()=>{ const id=+s.dataset.ov, orig=RAW.find(x=>x.id===id).cat; if(s.value===orig) delete OV[id]; else OV[id]=s.value; store.set('OV',OV); render(); });
  $('ovReset').onclick=()=>{OV={};store.set('OV',OV);render();};
  $('cpy').onclick=async()=>{ const lines=['APR Program ID,Program,Faculty,Original category,New category',...Object.entries(OV).map(([id,c])=>{const r=RAW.find(x=>x.id==id);return [id,'"'+r.nm+'"','"'+r.fac+'"',r.cat,c].join(',')})].join('\n');
    const b=$('cpy'); try{ await navigator.clipboard.writeText(lines); b.textContent='Copied'; }catch(e){ const t=$('cpyBox'); t.hidden=false; t.value=lines; t.select(); b.textContent='Select and copy the text below'; } };
  drawCatMix($('catmix'));
}
function drawCatMix(el){
  const a=ALL.filter(r=>(F.lv==='All'||r.lv===F.lv)&&(F.teach||!r.teach));
  const rows=FACS.map(f=>({f,g:a.filter(r=>r.fac===f)})).filter(r=>r.g.length);
  rows.push({f:'Portfolio',g:a});
  const W_=560,rh=24,m={l:150,r:40,t:4},H=m.t+rows.length*rh+8; const wf=r=>mixW==='n'?1:(r.e24||0);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Category mix by faculty">`;
  rows.forEach((r,i)=>{ const yy=m.t+i*rh+(r.f==='Portfolio'?6:0); const tot=sum(r.g,wf)||1; let x0=m.l; s+=`<text x="${m.l-8}" y="${yy+14}" text-anchor="end" class="ink" style="${r.f==='Portfolio'||r.f===F.fac?'font-weight:700':''}">${esc(r.f)}</text>`;
    CATS.forEach(c=>{ const g=r.g.filter(p=>p.cat===c); const val=sum(g,wf); const w=val/tot*(W_-m.l-m.r); if(w<=0) return;
      s+=`<rect ${tipAttr(`<b>${esc(r.f)} · ${c}</b><div class="kv"><span>Programs</span><span>${g.length}</span><span>Students</span><span>${fN(sum(g,p=>p.e24))}</span><span>Total margin</span><span>${f$(sum(g,p=>p.mar))}</span></div>`)} x="${x0+1}" y="${yy}" width="${Math.max(0,w-2)}" height="${rh-6}" rx="2" style="fill:${CATC[c]}"/>`; x0+=w; });
    s+=`<text x="${W_-m.r+6}" y="${yy+14}">${mixW==='n'?r.g.length:fN(sum(r.g,p=>p.e24))}</text>`; });
  el.innerHTML=s+'</svg>';
}

/* ================= SCENARIOS ================= */
function scen(r){
  if(S.dropTeach && r.teach) return {e:0,rev:0,cost:0,mar:0,chp:0,dropped:true};
  const pct = {Revitalize:S.rev,Modernize:S.mod,'No Change':S.nc,Rationalize:S.rat}[r.cat]/100;
  const g = Math.max(0,1+pct), v=S.vc/100, rev=r.rev||0, cost=r.cost||0;
  let c2, r2;
  if(r.cat==='Rationalize' && pct<=-1){ r2=0; c2=cost*(1-S.ratRec/100); }
  else { r2=rev*g; c2=cost*(1-v)+cost*v*g; if(r.cat==='Revitalize' && r.above===false) c2*=1-S.eff/100; }
  return {e:(r.e24||0)*g, rev:r2, cost:c2, mar:r2-c2, chp:(r.chp||0)*g};
}
/* ---------- reading guide ---------- */
const GUIDE = window.GUIDE || null;
const GUIDE_SEC = {};
if(GUIDE) GUIDE.toc.forEach(s=>{ if(s.tab) GUIDE_SEC[s.tab]=s.id; });
function guideScroll(id, smooth){
  const el=document.getElementById(id); if(!el) return;
  const deck=document.querySelector('.deck'); const off=(deck?deck.offsetHeight:0)+12;
  window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - off, behavior: smooth?'smooth':'auto'});
}
function vGuide(v){
  if(!GUIDE){ v.innerHTML='<p class="empty">The reading guide is not loaded. Run scripts/build_guide.py to generate data/guide.js.</p>'; return; }
  const toc = GUIDE.toc.map(s=>`<li><a href="#${s.id}" data-g="${s.id}">${esc(s.t)}</a>${s.sub.length?`<ul>${s.sub.map(x=>`<li><a href="#${x.id}" data-g="${x.id}">${esc(x.t)}</a></li>`).join('')}</ul>`:''}</li>`).join('');
  v.innerHTML = `<div class="guide">
   <nav class="g-toc" aria-label="Reading guide contents">
    <details open id="gTocBox"><summary>Contents</summary><ol>${toc}</ol></details>
   </nav>
   <article class="g-body panel">
    <header class="g-head"><h1>Reading guide</h1><p class="sub">How each tab and chart represents the data, what the calculations are, and what the patterns mean as APR signals.${GUIDE.updated?` Last updated ${esc(GUIDE.updated)}.`:''}</p></header>
    ${GUIDE.html}
   </article></div>`;
  { const d=document.querySelector('.deck'); if(d) document.documentElement.style.setProperty('--deck-h',(d.offsetHeight+12)+'px'); }
  const box=$('gTocBox'); if(box && matchMedia('(max-width: 900px)').matches) box.open=false;
  v.querySelectorAll('[data-g]').forEach(a=>a.onclick=e=>{ e.preventDefault(); if(box && matchMedia('(max-width: 900px)').matches) box.open=false; guideScroll(a.dataset.g, true); });
  // highlight the section being read
  const links=[...v.querySelectorAll('.g-toc a')], heads=[...v.querySelectorAll('.g-body h2[id], .g-body h3[id]')];
  const deck=document.querySelector('.deck');
  const spy=()=>{ if(tab!=='guide') return; const lim=(deck?deck.offsetHeight:0)+24; let cur=heads[0]; for(const h of heads){ if(h.getBoundingClientRect().top<=lim) cur=h; else break; }
    links.forEach(a=>a.classList.toggle('on', cur && a.dataset.g===cur.id));
    const on=v.querySelector('.g-toc a.on'), tc=v.querySelector('.g-toc'); if(on&&tc&&tc.scrollHeight>tc.clientHeight){ const t=on.getBoundingClientRect().top-tc.getBoundingClientRect().top+tc.scrollTop; if(t<tc.scrollTop+20||t>tc.scrollTop+tc.clientHeight-40) tc.scrollTop=t-tc.clientHeight/3; } };
  window.removeEventListener('scroll', window.__gSpy||(()=>{})); window.__gSpy=spy; window.addEventListener('scroll', spy, {passive:true}); spy();
}

function vScenarios(v){
  const a=VIS; const base=totals(a);
  const sc=a.map(r=>({r,s:scen(r)}));
  const st={e:sum(sc,x=>x.s.e),rev:sum(sc,x=>x.s.rev),cost:sum(sc,x=>x.s.cost),mar:sum(sc,x=>x.s.mar)};
  const steps=[]; let running=base.mar;
  if(S.dropTeach){ const g=sc.filter(x=>x.r.teach); const d=-sum(g,x=>x.r.mar||0); steps.push(['Remove teach-out',d]); }
  CATS.forEach(c=>{ const g=sc.filter(x=>x.r.cat===c&&!(S.dropTeach&&x.r.teach)); const d=sum(g,x=>x.s.mar-(x.r.mar||0)); steps.push([c,d]); });
  const lever=(k,l,min,max,step,unit,hint)=>`<div class="lever"><label class="lab" for="s_${k}">${l}</label><span class="val">${S[k]>0&&unit==='%Δ'?'+':''}${S[k]}${unit==='%Δ'?'%':unit}</span><input type="range" id="s_${k}" data-s="${k}" min="${min}" max="${max}" step="${step}" value="${S[k]}">${hint?`<span class="hint">${hint}</span>`:''}</div>`;
  v.innerHTML = `
  <div class="grid g2">
   <section data-s="levers" class="panel"><header><div><h2>Scenario levers</h2><p class="q">A steady-state view of the current filter after plans take effect. Revenue per student holds constant; a share of cost moves with enrolment. Uses your category reassignments.</p></div><button class="btn" id="sReset" type="button">Reset levers</button></header>
    ${lever('rev','Revitalize: enrolment change',-30,50,1,'%Δ')}
    ${lever('mod','Modernize: enrolment change',-30,50,1,'%Δ')}
    ${lever('nc','No Change: enrolment change',-30,30,1,'%Δ')}
    ${lever('rat','Rationalize: enrolment change',-100,0,5,'%Δ','−100% phases the program out entirely.')}
    ${lever('ratRec','Cost removed when a program phases out',0,100,5,'%','The remainder is stranded (shared courses, faculty redeployed rather than released).')}
    ${lever('vc','Cost that varies with enrolment',0,100,5,'%','Low values mean most cost is fixed, so growth improves margin per CHP.')}
    ${lever('eff','Cost reduction in below-line Revitalize programs',0,30,1,'%','Delivery changes such as section size, instructor mix or modality.')}
    <label class="chk" for="s_drop" style="margin-top:8px"><input type="checkbox" id="s_drop" ${S.dropTeach?'checked':''}> Remove terminated and suspended programs</label>
   </section>
   <section data-s="bridge" class="panel"><header><div><h2>Result</h2><p class="q">${base.n} programs in scope.</p></div></header>
    <div class="kpis" style="margin-top:0">
     <div class="kpi"><div class="l">Instructional contribution</div><div class="v ${st.mar>=0?'pos':'neg'}">${f$(st.mar)}</div><div class="d">from ${f$(base.mar)} · <b class="${st.mar-base.mar>=0?'pos':'neg'}">${st.mar-base.mar>=0?'+':''}${f$(st.mar-base.mar)}</b></div></div>
     <div class="kpi"><div class="l">Cost recovery</div><div class="v">${fP(st.cost?st.rev/st.cost:null,0)}</div><div class="d">from ${fP(base.rec,0)}</div></div>
     <div class="kpi"><div class="l">Students</div><div class="v">${fN(st.e)}</div><div class="d">from ${fN(base.e24)}</div></div>
    </div>
    <h3 style="margin-top:14px">Margin bridge</h3><div id="bridge"></div>
   </section>
   <section data-s="facimp" class="panel" style="grid-column:1/-1"><header><div><h2>Faculty impact</h2><p class="q">Margin now and under the scenario, faculties ordered by change.</p></div></header><div id="facimp"></div></section>
  </div>`;
  v.querySelectorAll('input[data-s]').forEach(i=>{ i.oninput=()=>{ const k=i.dataset.s; i.previousElementSibling.textContent=(['rev','mod','nc','rat'].includes(k)&&+i.value>0?'+':'')+i.value+'%'; }; i.onchange=()=>{S[i.dataset.s]=+i.value;store.set('S',S);render(); const n=$('s_'+i.dataset.s); n&&n.focus({preventScroll:true});}; });
  $('s_drop').onchange=e=>{S.dropTeach=e.target.checked;store.set('S',S);render();};
  $('sReset').onclick=()=>{S={...DEF_S};store.set('S',S);render();};
  drawBridge($('bridge'),base.mar,steps,st.mar);
  const fr=FACS.map(f=>{const g=sc.filter(x=>x.r.fac===f); return {f,n:g.length,now:sum(g,x=>x.r.mar||0),sc:sum(g,x=>x.s.mar)}}).filter(x=>x.n).sort((p,q)=>(q.sc-q.now)-(p.sc-p.now));
  $('facimp').innerHTML=`<div class="tblwrap" style="max-height:none"><table><thead><tr><th>Faculty</th><th class="n">Programs</th><th class="n">Margin now</th><th class="n">Scenario</th><th class="n">Change</th></tr></thead><tbody>${fr.map(x=>`<tr><td>${esc(x.f)}</td><td class="n">${x.n}</td><td class="n">${f$(x.now)}</td><td class="n">${f$(x.sc)}</td><td class="n ${x.sc-x.now>=0?'pos':'neg'}">${x.sc-x.now>=0?'+':''}${f$(x.sc-x.now)}</td></tr>`).join('')}</tbody></table></div>`;
}
function drawBridge(el,start,steps,end){
  const items=[['Current',start,'total'],...steps.map(s=>[s[0],s[1],'step']),['Scenario',end,'total']];
  let run=0; const bars=items.map(([l,v,t])=>{ if(t==='total'){ run=v; return {l,y0:0,y1:v,t,v}; } const y0=run; run+=v; return {l,y0,y1:run,t,v}; });
  const lo=Math.min(0,...bars.flatMap(b=>[b.y0,b.y1])), hi=Math.max(0,...bars.flatMap(b=>[b.y0,b.y1]));
  const W_=560,H=280,m={l:60,r:10,t:16,b:44}; const yt=nice(lo,hi,5); const y=lin(Math.min(lo,yt[0]),Math.max(hi,yt[yt.length-1]),H-m.b,m.t); const cw=(W_-m.l-m.r)/bars.length;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Margin bridge"><g class="grid">${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=yt.map(t=>`<text x="${m.l-6}" y="${y(t)+4}" text-anchor="end">${f$(t)}</text>`).join('')+`<line class="ax" x1="${m.l}" x2="${W_-m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  bars.forEach((b,i)=>{ const x0=m.l+i*cw+cw*.16, w=cw*.68; const top=y(Math.max(b.y0,b.y1)), h=Math.max(1.5,Math.abs(y(b.y0)-y(b.y1)));
    const fill=b.t==='total'?'var(--ink-2)':b.v>=0?'var(--hi)':'var(--lo)';
    s+=`<rect ${tipAttr(`<b>${b.l}</b><br>${b.t==='total'?f$(b.v):(b.v>=0?'+':'')+f$(b.v)}`)} x="${x0}" y="${top}" width="${w}" height="${h}" rx="2" style="fill:${fill}"/>`;
    s+=`<text x="${x0+w/2}" y="${top-5}" text-anchor="middle" class="ink" style="font-size:10px">${b.t==='total'?f$(b.v):(b.v>=0?'+':'')+f$(b.v)}</text>`;
    s+=`<text x="${x0+w/2}" y="${H-m.b+15}" text-anchor="middle" style="font-size:10px">${b.l.split(' ')[0]}</text>${b.l.includes(' ')?`<text x="${x0+w/2}" y="${H-m.b+27}" text-anchor="middle" style="font-size:10px">${b.l.split(' ').slice(1).join(' ')}</text>`:''}`;
    if(i<bars.length-1){ s+=`<line x1="${x0+w}" x2="${x0+cw}" y1="${y(b.y1)}" y2="${y(b.y1)}" class="ref"/>`; } });
  el.innerHTML=s+'</svg>';
}

/* ================= COSTING MODEL (scope, peers, method skews) ================= */
const FI = window.FIUC_DATA || null;
const MODEL = {cost:284636896, rev:238756465}; // whole-portfolio program costing totals from the workbook (2024-25)
const SKEW = [
 {id:'M1', dir:'against', t:'Research effort is charged to teaching',
  mech:'Only the teaching share of faculty salary is a direct cost. The step that builds the department overhead pool subtracts only that share (Guide Step 4l), so research and service time stays in department overhead and is spread over course sections. The more research-intensive the department, the more of its cost lands on the programs its courses serve.',
  ev:()=>`Sponsored research spending is <b>${fP(FI.med.Dalhousie.ri,0)}</b> of Dal's operating spending vs <b>${fP(FI.med['Nova Scotia'].ri,0)}</b> for the NS median. Academic-rank salaries are only <b>${fP(FI.med.Dalhousie.acad_c01,0)}</b> of Dal's instruction & non-sponsored research function vs <b>${fP(FI.med['Nova Scotia'].acad_c01,0)}</b> for NS peers: the rest is research, technical and support staff that the model treats as teaching overhead.`,
  where:'Thesis-based graduate programs and Medicine. Shows up as the deep negative tail in the margin histogram and the high threshold for costing Table 1.',
  pred:r=>r.th==='Thesis Required'||r.fac==='Medicine'},
 {id:'M2', dir:'against', t:'Overhead is split equally per section',
  mech:'Department, faculty and university overhead pools are divided by the number of sections, not by students or credit hours (Step 4k–s). A 6-student seminar carries the same overhead as a 300-student lecture, so small sections look expensive per credit hour.',
  ev:()=>`${RAW.filter(r=>['Masters','Doctoral'].includes(r.lv)).length} of Dal's ${RAW.length} programs (${fP(RAW.filter(r=>['Masters','Doctoral'].includes(r.lv)).length/RAW.length,0)}) are graduate programs, which run small sections. Primarily undergraduate NS peers have far fewer.`,
  where:'Small graduate programs. Shows up in the size-band chart and the left tail of the margin histogram.',
  pred:r=>r.isGrad&&(r.e24||0)<20},
 {id:'M3', dir:'against', t:'Unfunded graduate awards reduce revenue',
  mech:'Net tuition = tuition + program and course fees − unfunded scholarships and bursaries (Step 6c). Graduate funding packages paid from operating budgets can exceed the tuition they offset, producing low or negative program revenue.',
  ev:()=>`Scholarships and bursaries are <b>${fP(FI.med.Dalhousie.schol_sh,1)}</b> of Dal's operating spending vs <b>${fP(FI.med['Nova Scotia'].schol_sh,1)}</b> NS median and <b>${fP(FI.med.U15.schol_sh,1)}</b> U15 median. ${RAW.filter(r=>r.rev<0).length} Dal programs report negative revenue.`,
  where:'Research graduate programs; most visible where revenue is negative or under 20% of cost. Check the funded/unfunded split (Template 2.3 S6.1).',
  pred:r=>(r.rev!=null&&r.rev<0)||(r.isGrad&&r.cost>0&&r.rev/r.cost<0.2)},
 {id:'M4', dir:'against', t:'Only credit tuition counts as revenue',
  mech:'Program revenue is net credit tuition plus targeted program grants (Step 6). The provincial operating grant, non-credit tuition, endowment income and sales of services are all excluded, although they fund the same operations.',
  ev:()=>`Credit tuition is <b>${fP(FI.med.Dalhousie.tuit_sh,0)}</b> of Dal's operating revenue vs <b>${fP(FI.med['Nova Scotia'].tuit_sh,0)}</b> for the NS median, so the model sees a smaller share of Dal's income. Sales of services (${fP(FI.med.Dalhousie.sales_sh,1)} vs ${fP(FI.med['Nova Scotia'].sales_sh,1)}), endowment and investment (${fP(FI.med.Dalhousie.endow_sh,1)} vs ${fP(FI.med['Nova Scotia'].endow_sh,1)}) and non-credit tuition (${fP(FI.med.Dalhousie.nct_sh,1)} vs ${fP(FI.med['Nova Scotia'].nct_sh,1)}) are all larger at Dal.`,
  where:'Every margin and the tuition-coverage figure. It is a portfolio-level effect, so no program chip.',
  pred:null},
 {id:'M5', dir:'against', t:'Clinical and professional revenue sits outside the model',
  mech:'Clinic fees and other service revenue earned alongside teaching are "sales of services", not tuition, so they never reach the program. Clinic staff and supplies in faculty or department budgets can still flow into overhead.',
  ev:()=>`Sales of services are <b>${f$(FI.dal.sales*1e6)}</b> (${fP(FI.med.Dalhousie.sales_sh,1)} of Dal's operating revenue) vs ${fP(FI.med['Nova Scotia'].sales_sh,1)} for the NS median.`,
  where:'Dentistry (including Dental Hygiene and Periodontics) and Medicine. Shows up in the Faculties scorecard.',
  pred:r=>r.fac==='Dentistry'||r.fac==='Medicine'},
 {id:'M6', dir:'flatters', t:'Space, utilities and IT are excluded',
  mech:'Physical plant, computing and communications, student services and external relations are excluded (Step 4g). Programs that use a lot of labs, clinics, studios or research computing look cheaper than they are.',
  ev:()=>`Physical plant is ${fP(FI.med.Dalhousie.plant_sh,1)} of Dal's operating spending, close to the NS median (${fP(FI.med['Nova Scotia'].plant_sh,1)}), so this mostly shifts cost between Dal programs rather than against Dal as a whole.`,
  where:'Assumed space-intensive faculties: Agriculture, Architecture and Planning, Dentistry, Engineering, Medicine. Their true cost is higher than shown.',
  pred:r=>['Agriculture','Architecture and Planning','Dentistry','Engineering','Medicine'].includes(r.fac)},
 {id:'M7', dir:'unknown', t:'Included spending does not reconcile to program cost',
  mech:'The functions the model includes total far more than the program cost reported. Possible reasons: the year gap (FIUC 2023-24 vs costing 2024-25), Dal\'s optional unbundling of administration, research salary removed rather than pooled, or sections taken by students with no program of record.',
  ev:()=>{ const inc=FI.dal.instr+FI.dal.library+FI.dal.admin; return `Included functions: <b>${f$(inc*1e6)}</b> (FIUC 2023-24). Program cost: <b>${f$(MODEL.cost)}</b> (2024-25). Gap: <b>${f$(inc*1e6-MODEL.cost)}</b>, ${fP((inc*1e6-MODEL.cost)/(inc*1e6),0)} of included spending.`; },
  where:'Every cost figure. The Template 2.2 reconciliation (Step 8) should explain it; until it does, treat absolute levels with caution.',
  pred:null},
 {id:'M8', dir:'within', t:'A whole campus becomes faculty overhead',
  mech:'Faculty-level overhead is pooled and split across that faculty\'s sections. Where a faculty runs a separate campus, campus-level administration and operations that are not plant can land in a pool spread over relatively few sections.',
  ev:()=>{ const a=RAW.filter(r=>r.fac==='Agriculture'); return `Agriculture recovers ${fP(sum(a,r=>r.rev)/sum(a,r=>r.cost),0)} of costed instruction (${fC(sum(a,r=>r.mar)/sum(a,r=>r.chp))} per CHP), the lowest of any faculty. Hypothesis to verify against the faculty overhead pool.`; },
  where:'Agricultural Campus programs.',
  pred:r=>r.fac==='Agriculture'}
];
const SKEWBY = Object.fromEntries(SKEW.map(s=>[s.id,s]));
const DIR = {against:['Disadvantages Dal vs NS peers','var(--lo)'], within:['Shifts cost between Dal programs','var(--warn)'], flatters:['Understates cost','var(--hi)'], unknown:['Direction unknown','var(--muted)']};
const skewsFor = r => SKEW.filter(s=>s.pred&&s.pred(r));
const mchip = s => `<span class="chip m" title="${esc(s.t)}">${s.id}</span>`;
function scopeBanner(){
  if(!FI) return '';
  return `<div class="scope-banner" data-s="kpi"><b>Scope.</b> The costing model counts <b>${f$(MODEL.cost)}</b> of cost: <b>${fP(MODEL.cost/(FI.dal.go*1e6),0)}</b> of Dalhousie's ${f$(FI.dal.go*1e6)} operating spending and <b>${fP(MODEL.cost/(FI.dal.allfunds*1e6),0)}</b> of all-funds spending (FIUC ${FI.dal.year}). Its revenue is net credit tuition, about <b>${fP(MODEL.rev/(FI.dal.rev_go*1e6),0)}</b> of operating revenue. Contributions here are <b>before</b> the operating grant and the costs the model leaves out. <button type="button" class="linkbtn" data-goto="costing">How the model works →</button></div>`;
}

function vCosting(v){
  if(!FI){ v.innerHTML='<p class="empty">FIUC comparison data not loaded.</p>'; return; }
  const D=FI.dal, inc=D.instr+D.library+D.admin;
  v.innerHTML = `
  <div class="grid">
   <section class="panel" data-s="cscope"><header><div><h2>What the costing model can and cannot tell you</h2><p class="q">Program costing (APR Guide, Workstream B) measures the instructional slice of the university and charges it to programs through the courses their students take. It is built for comparing programs with each other. It is not a full cost of the university, and its "margin" is not a surplus or deficit.</p></div></header>
    <div class="kpis" style="margin-top:4px">
     <div class="kpi"><div class="l">Cost the model counts</div><div class="v">${fP(MODEL.cost/(D.go*1e6),0)}</div><div class="d">of operating spending · ${fP(MODEL.cost/(D.allfunds*1e6),0)} of all funds</div></div>
     <div class="kpi"><div class="l">Revenue the model counts</div><div class="v">${fP(MODEL.rev/(D.rev_go*1e6),0)}</div><div class="d">of operating revenue (net credit tuition)</div></div>
     <div class="kpi"><div class="l">Operating grant in the model</div><div class="v">$0</div><div class="d">${f$(D.prov*1e6)} provincial revenue excluded</div></div>
     <div class="kpi"><div class="l">Unreconciled included spend</div><div class="v">${f$(inc*1e6-MODEL.cost)}</div><div class="d">included functions not reaching programs (M7)</div></div>
    </div>
    <div class="grid g3" style="margin-top:14px">
     <div><h3 style="color:var(--good)">Use it for</h3><ul class="tight"><li>Ranking and grouping programs within Dalhousie</li><li>Finding outliers and patterns in cost per credit hour</li><li>Asking why a program's cost structure differs from its peers</li><li>Testing the direction of change under scenarios</li></ul></div>
     <div><h3 style="color:var(--crit)">Do not use it for</h3><ul class="tight"><li>Sizing the operating grant, or any share of it</li><li>Adding program margins and calling the total the institutional deficit</li><li>Comparing margins with another university without its Template 2.3 choices</li><li>Treating a negative margin as money a closure would save</li></ul></div>
     <div><h3>How to cite it</h3><ul class="tight"><li>Call margin an <b>instructional contribution</b> before the operating grant and institutional costs</li><li>State the scope figures above alongside any total</li><li>Name the method caveats (M1–M8) that apply to the program</li></ul></div>
    </div></section>

   <section class="panel" data-s="csees"><header><div><h2>What the model sees, in dollars</h2><p class="q">Dalhousie's spending and revenue from the CAUBO FIUC return (${D.year}, $M), coloured by how program costing treats each piece. Markers show the program totals the model actually produced (2024-25).</p></div></header>
    <div id="seesChart"></div>
    <div class="legend"><span><i style="background:var(--hi)"></i>Included in program cost or revenue</span><span><i style="background:var(--m)"></i>Netted against tuition (unfunded share)</span><span><i style="background:var(--nc)"></i>Excluded</span><span><i style="background:var(--line);border:1px dashed var(--muted)"></i>Outside the operating fund</span></div></section>

   <div class="grid g2" style="margin-top:0">
    <section class="panel" data-s="cpeer"><header><div><h2>Dalhousie's cost structure is a U15 structure</h2><p class="q">Each dot is a Canadian university with operating spending over $30M (${FI.n} in ${D.year}). X: sponsored-research spending as a share of operating spending. Y: share of operating spending in the functions program costing includes.</p></div></header><div id="peerScatter"></div>
     <div class="legend"><span><i style="background:var(--accent)"></i>Dalhousie</span><span><i style="background:var(--c-rat)"></i>Other Nova Scotia</span><span><i style="background:var(--hi)"></i>U15</span><span><i style="background:var(--nc)"></i>Other Canadian</span></div></section>
    <section class="panel" data-s="cprox"><header><div><h2>The same method, applied to each university's FIUC</h2><p class="q">A like-for-like proxy: credit tuition ÷ spending in the included functions. It shows how program costing would read at each NS university before any allocation choices.</p></div></header><div id="proxyBars"></div></section>
    <section class="panel" data-s="cfunc"><header><div><h2>Where the excluded spending sits</h2><p class="q">Share of operating spending by FIUC function: Dalhousie against the Nova Scotia and U15 medians.</p></div></header><div id="funcDots"></div>
     <div class="legend"><span><i style="background:var(--accent)"></i>Dalhousie</span><span><i style="background:var(--c-rat)"></i>NS median</span><span><i style="background:var(--hi)"></i>U15 median</span></div></section>
    <section class="panel" data-s="ctrend"><header><div><h2>Not a one-year effect</h2><p class="q">Proxy tuition coverage (credit tuition ÷ included-function spending), ${FI.ts.Dalhousie.years[0]} to ${FI.dal.year}. Dal has risen toward the NS median but has been below it in every year.</p></div></header><div id="trendLines"></div>
     <div class="legend"><span><i style="background:var(--accent)"></i>Dalhousie</span><span><i style="background:var(--c-rat)"></i>NS median</span><span><i style="background:var(--hi)"></i>U15 median</span></div></section>
   </div>

   <section class="panel" data-s="cskew"><header><div><h2>Method caveats: where the method can skew Dalhousie's results</h2><p class="q">Each caveat names the mechanism, the evidence, and where it shows up. Codes appear as chips on the Programs tab and in the chart story tooltips, so a skew can be attributed wherever it surfaces. Counts reflect the current filter.</p></div></header>
    <div class="skews">${SKEW.map(s=>{ const hit=s.pred?VIS.filter(s.pred):null; const [dl,dc]=DIR[s.dir]; return `<article class="skew" id="skew-${s.id}">
      <div class="skew-h"><span class="chip m">${s.id}</span><h3>${s.t}</h3><span class="dir" style="color:${dc};border-color:${dc}">${dl}</span></div>
      <p>${s.mech}</p><p class="ev"><span>Evidence</span>${s.ev()}</p><p class="ev"><span>Where it shows up</span>${s.where}</p>
      ${hit?`<p class="hit">${hit.length} programs in view · ${fN(sum(hit,r=>r.e24))} students · ${f$(sum(hit,r=>r.mar))} combined contribution <button type="button" class="linkbtn" data-mfilter="${s.id}">List programs →</button></p>`:'<p class="hit">Portfolio-wide effect: applies to every figure.</p>'}
     </article>`; }).join('')}</div></section>

   <section class="panel" data-s="ctable"><header><div><h2>Inclusion reference</h2><p class="q">How each part of Dalhousie's finances is treated, with the guide reference and what it means when reading the results.</p></div></header>
    <div class="tblwrap" style="max-height:none"><table class="wrap"><thead><tr><th>Item (FIUC)</th><th class="n">Dal ${D.year}</th><th>Treatment</th><th>Guide</th><th>Reading the results</th></tr></thead><tbody>
    ${[
     ['Instruction & non-sponsored research',D.instr,'in','Step 3–4','Teaching salaries are direct cost; research and service salary stays in department overhead (M1).'],
     ['Library',D.library,'in','Step 4g','Spread across all sections.'],
     ['Administration & academic support',D.admin,'in','Step 4g, p. 39','Included by default; president, finance and HR may be unbundled out (Template 2.2A).'],
     ['Scholarships, bursaries & prizes',D.schol,'net','Step 6c','Unfunded share is subtracted from tuition, not counted as cost (M3).'],
     ['Physical plant',D.plant,'out','Step 4g','Space-intensive programs look cheaper (M6).'],
     ['Computing & communications',D.computing,'out','Step 4g, p. 40','Academic IT may be moved into academic support.'],
     ['Student services (excl. awards)',D.studserv_ex,'out','Step 4g, p. 40','Career and accessibility services may be included.'],
     ['External relations',D.extrel,'out','Step 4g','Fundraising and communications.'],
     ['Non-credit instruction',D.noncredit,'out','Step 4g','Its revenue is also excluded.'],
     ['Sponsored research fund',D.sr,'fund','Step 4f','Outside the operating fund entirely.'],
     ['Ancillary, capital, special purpose',D.anc+D.cap+D.spt,'fund','Step 4f','Outside the operating fund entirely.'],
     ['Credit course tuition',D.tuit,'in','Step 6','Net of unfunded awards; assigned to the student\'s primary program.'],
     ['Provincial operating grant',D.prov,'out','Step 6d','Explicitly excluded (M4). Targeted program grants are included.'],
     ['Sales of services',D.sales,'out','Step 6','Clinic and service revenue never reaches the program (M5).'],
     ['Endowment & investment income',D.endow,'out','Step 6','Excluded (M4).'],
     ['Non-credit tuition',D.nct,'out','Step 6','Excluded with its cost.']
    ].map(([a,b,t,g,c])=>`<tr><td>${a}</td><td class="n">${f$(b*1e6)}</td><td><span class="treat ${t}">${{in:'Included',net:'Netted from revenue',out:'Excluded',fund:'Outside operating fund'}[t]}</span></td><td class="mono">${g}</td><td style="white-space:normal;min-width:240px">${c}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="note">Source: CAUBO Financial Information of Universities and Colleges (FIUC), ${D.year}, Dalhousie University; General Operating fund (Table 4), all-funds expenditure (Table 2) and revenue (Table 1). Program totals: Workstream D workbook, 2024-25. FIUC and costing years differ by one year.</p></section>
  </div>`;
  v.querySelectorAll('[data-mfilter]').forEach(b=>b.onclick=()=>{ mFilter=b.dataset.mfilter; tab='programs'; store.set('tab',tab); document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-selected',x.dataset.tab===tab)); render(); window.scrollTo({top:0}); });
  drawSees($('seesChart')); drawPeer($('peerScatter')); drawProxy($('proxyBars')); drawFunc($('funcDots')); drawTrend($('trendLines'));
}
function drawSees(el){
  const D=FI.dal, W_=1000, m={l:150,r:20,t:26}, rh=40, gap=40; const max=D.allfunds; const x=lin(0,max,m.l,W_-m.r);
  const rows=[
   ['All-funds spending',[['Operating fund',D.go,'go'],['Sponsored research',D.sr,'fund'],['Ancillary',D.anc,'fund'],['Capital',D.cap,'fund'],['Special purpose & trust',D.spt,'fund']],null],
   ['Operating spending',[['Instruction & non-sponsored research',D.instr,'in'],['Library',D.library,'in'],['Admin & academic support',D.admin,'in'],['Scholarships & bursaries',D.schol,'net'],['Physical plant',D.plant,'out'],['Computing',D.computing,'out'],['Student services',D.studserv_ex,'out'],['External relations',D.extrel,'out'],['Non-credit instruction',D.noncredit,'out']],[MODEL.cost/1e6,'Program cost in model']],
   ['Operating revenue',[['Credit tuition',D.tuit,'in'],['Provincial operating grant',D.prov,'out'],['Sales of services',D.sales,'out'],['Endowment & investment',D.endow,'out'],['Non-credit tuition',D.nct,'out'],['Other',D.rev_other,'out']],[MODEL.rev/1e6,'Program revenue in model']]
  ];
  const H=m.t+rows.length*(rh+gap)+10; const fill={in:'var(--hi)',net:'var(--m)',out:'var(--nc)',fund:'var(--line)',go:'var(--accent-wash)'};
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="What the costing model includes">`;
  const xt=[0,200,400,600,800]; s+=`<g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t-6}" y2="${H-10}"/>`).join('')}</g>`+xt.map(t=>`<text x="${x(t)}" y="${m.t-10}" text-anchor="middle">$${t}M</text>`).join('');
  rows.forEach(([lab,segs,mk],i)=>{ const y0=m.t+i*(rh+gap); let x0=0; const tot=sum(segs,q=>q[1]);
    s+=`<text x="${m.l-10}" y="${y0+rh/2+4}" text-anchor="end" class="ink" style="font-weight:600">${lab}</text><text x="${m.l-10}" y="${y0+rh/2+18}" text-anchor="end" style="font-size:10px">${f$(tot*1e6)}</text>`;
    segs.forEach(([n,val,t])=>{ const w=x(x0+val)-x(x0); const tt=`<b>${n}</b><div class="kv"><span>Amount</span><span>${f$(val*1e6)}</span><span>Share of row</span><span>${fP(val/tot,1)}</span><span>Treatment</span><span>${{in:'Included',net:'Netted against tuition',out:'Excluded',fund:'Outside operating fund',go:'Operating fund (broken down below)'}[t]}</span></div>`;
      s+=`<rect ${tipAttr(tt)} x="${x(x0)+1}" y="${y0}" width="${Math.max(0,w-2)}" height="${rh}" rx="3" style="fill:${fill[t]};${t==='fund'?'stroke:var(--muted);stroke-dasharray:3 3;':''}${t==='go'?'stroke:var(--accent);':''}"/>`;
      if(w>70) s+=`<text x="${x(x0)+6}" y="${y0+rh/2-2}" style="fill:${t==='in'||t==='net'?'#fff':'var(--ink)'};font-size:10.5px;font-weight:600;pointer-events:none">${esc(n.length*5.6>w-10?n.split(' ')[0]:n)}</text><text x="${x(x0)+6}" y="${y0+rh/2+11}" style="fill:${t==='in'||t==='net'?'#fff':'var(--ink-2)'};font-size:10px;pointer-events:none">${f$(val*1e6)}</text>`;
      x0+=val; });
    if(mk){ const mx=x(mk[0]); s+=`<line x1="${mx}" x2="${mx}" y1="${y0-6}" y2="${y0+rh+6}" style="stroke:var(--ink)" stroke-width="2.5"/><text x="${mx+6}" y="${y0+rh+18}" class="ink" style="font-weight:700;font-size:11px">▲ ${mk[1]}: ${f$(mk[0]*1e6)} (${fP(mk[0]/tot,0)})</text>`; }
  });
  el.innerHTML=s+'</svg>';
}
function drawPeer(el){
  const P_=FI.peers, W_=560,H=400,m={l:52,r:14,t:14,b:42}; const x=lin(0,0.8,m.l,W_-m.r), y=lin(0.55,0.85,H-m.b,m.t);
  const col=g=>g==='Dalhousie'?'var(--accent)':g==='Nova Scotia'?'var(--c-rat)':g==='U15'?'var(--hi)':'var(--nc)';
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Research intensity vs included share">`;
  const xt=[0,.2,.4,.6,.8], yt=[.55,.6,.65,.7,.75,.8,.85];
  s+=`<g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s+=xt.map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${Math.round(t*100)}%</text>`).join('')+yt.map(t=>`<text x="${m.l-6}" y="${y(t)+4}" text-anchor="end">${Math.round(t*100)}%</text>`).join('');
  s+=`<text x="${(m.l+W_)/2}" y="${H-6}" text-anchor="middle" class="mut">Sponsored research ÷ operating spending</text><text transform="translate(12,${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle" class="mut">Included-function share</text>`;
  const order=['Other Canada','Atlantic','U15','Nova Scotia','Dalhousie']; const placed=[];
  P_.slice().sort((a,b)=>order.indexOf(a.g)-order.indexOf(b.g)).forEach(p=>{ if(p.ri==null||p.incl==null) return; const cx=x(Math.min(.8,p.ri)), cy=y(Math.max(.55,Math.min(.85,p.incl))); const big=p.g==='Dalhousie';
    s+=`<circle ${tipAttr(`<b>${esc(p.n)}</b><div class="kv"><span>Operating spending</span><span>${f$(p.go*1e6)}</span><span>Research intensity</span><span>${fP(p.ri,0)}</span><span>Included share</span><span>${fP(p.incl,1)}</span><span>Proxy tuition coverage</span><span>${fP(p.prox,0)}</span></div>`)} cx="${cx}" cy="${cy}" r="${big?8:5}" style="fill:${p.g==='Atlantic'?'var(--nc)':col(p.g)};fill-opacity:${p.g==='Other Canada'||p.g==='Atlantic'?.6:.9};stroke:var(--panel)" stroke-width="1.5"/>`;
    let ly=cy+4; if(p.g==='Dalhousie'||p.g==='Nova Scotia'){ while(placed.some(([px,py])=>Math.abs(px-cx)<90&&Math.abs(py-ly)<12)) ly+=12; placed.push([cx,ly]); }
    if(p.g==='Dalhousie'||p.g==='Nova Scotia') s+=`<text x="${cx+(big?11:7)}" y="${ly}" class="ink" style="font-size:${big?12:10}px;font-weight:${big?700:400};pointer-events:none">${esc(p.n.replace(' University','').replace('University of ',''))}</text>`; });
  el.innerHTML=s+'</svg>'+`<p class="note">Dal: ${fP(FI.med.Dalhousie.incl_sh,1)} included vs NS median ${fP(FI.med['Nova Scotia'].incl_sh,1)} and U15 median ${fP(FI.med.U15.incl_sh,1)}. A higher included share means more of the operating budget is loaded onto programs. Points beyond 80% research intensity are pinned to the edge.</p>`;
}
function drawProxy(el){
  const rows=FI.peers.filter(p=>p.g==='Dalhousie'||p.g==='Nova Scotia').map(p=>({n:p.n.replace(' University','').replace('University ',''),v:p.prox,g:p.g}));
  rows.push({n:'NS median',v:FI.med['Nova Scotia'].proxy_rec,g:'med'},{n:'U15 median',v:FI.med.U15.proxy_rec,g:'u15'});
  rows.sort((a,b)=>b.v-a.v);
  const W_=560,rh=28,m={l:150,r:56,t:6,b:24},H=m.t+rows.length*rh+m.b; const xmax=Math.max(1,Math.ceil(Math.max(...rows.map(r=>r.v))*4)/4); const x=lin(0,xmax,m.l,W_-m.r); const ticks=[];for(let t=0;t<=xmax+1e-9;t+=.25)ticks.push(+t.toFixed(2));
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Proxy tuition coverage">`;
  s+=`<g class="grid">${ticks.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}</g><line x1="${x(1)}" x2="${x(1)}" y1="${m.t}" y2="${H-m.b}" class="ref"/>`+ticks.map(t=>`<text x="${x(t)}" y="${H-6}" text-anchor="middle">${Math.round(t*100)}%</text>`).join('');
  rows.forEach((r,i)=>{ const y0=m.t+i*rh+5; const c=r.g==='Dalhousie'?'var(--accent)':r.g==='Nova Scotia'?'var(--c-rat)':r.g==='u15'?'var(--hi)':'var(--ink-2)';
    s+=`<text x="${m.l-8}" y="${y0+13}" text-anchor="end" class="ink" style="${r.g==='Dalhousie'||r.g==='med'||r.g==='u15'?'font-weight:700':''}">${esc(r.n)}</text>`;
    s+=`<rect ${tipAttr(`<b>${esc(r.n)}</b><br>Credit tuition ÷ included-function spending: ${fP(r.v,1)}`)} x="${x(0)}" y="${y0}" width="${x(r.v)-x(0)}" height="${rh-10}" rx="3" style="fill:${c};${r.g==='med'||r.g==='u15'?'fill-opacity:.55':''}"/>`;
    s+=`<text x="${x(r.v)+5}" y="${y0+13}" class="ink" style="font-size:10.5px">${fP(r.v,0)}</text>`; });
  el.innerHTML=s+'</svg>'+`<p class="note">On this proxy Dal reads <b>${Math.round((FI.med['Nova Scotia'].proxy_rec-FI.med.Dalhousie.proxy_rec)*100)} points</b> below the NS median and ${Math.round((FI.med.Dalhousie.proxy_rec-FI.med.U15.proxy_rec)*100)} above the U15 median. Dal's actual model output (84%) is higher than its proxy because only ${f$(MODEL.cost)} of the ${f$((FI.dal.instr+FI.dal.library+FI.dal.admin)*1e6)} included spending reached programs (M7).</p>`;
}
function drawFunc(el){
  const R=[['Instruction & NSR','instr_sh','in'],['Library','library_sh','in'],['Admin & acad. support','admin_sh','in'],['Scholarships','schol_sh','net'],['Physical plant','plant_sh','out'],['Student services','studserv_ex_sh','out'],['Computing','computing_sh','out'],['External relations','extrel_sh','out'],['Non-credit instruction','noncredit_sh','out']];
  const W_=560,rh=30,m={l:170,r:20,t:8,b:26},H=m.t+R.length*rh+m.b; const x=lin(0,.16,m.l,W_-m.r);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Function shares">`;
  const xt=[0,.04,.08,.12,.16]; s+=`<g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}</g>`+xt.map(t=>`<text x="${x(t)}" y="${H-8}" text-anchor="middle">${t*100}%</text>`).join('');
  R.forEach(([n,k,t],i)=>{ const cy=m.t+i*rh+rh/2; const d=FI.med.Dalhousie[k], ns=FI.med['Nova Scotia'][k], u=FI.med.U15[k];
    s+=`<text x="${m.l-10}" y="${cy+4}" text-anchor="end" class="ink">${n}</text><text x="${8}" y="${cy+4}" style="font-size:9.5px;fill:${t==='in'?'var(--hi)':t==='net'?'var(--m)':'var(--muted)'};font-weight:700">${t==='in'?'IN':t==='net'?'NET':'OUT'}</text>`;
    const vals=[d,ns,u]; const big=Math.max(...vals)>.16;
    const X=v=>x(Math.min(.16,v)); s+=`<line x1="${X(Math.min(...vals))}" x2="${X(Math.max(...vals))}" y1="${cy}" y2="${cy}" style="stroke:var(--axis)" stroke-width="2"/>`;
    [[u,'var(--hi)','U15 median'],[ns,'var(--c-rat)','NS median'],[d,'var(--accent)','Dalhousie']].forEach(([vv,c,l])=>s+=`<circle ${tipAttr(`<b>${n}</b><br>${l}: ${fP(vv,1)} of operating spending`)} cx="${X(vv)}" cy="${cy}" r="${l==='Dalhousie'?7:5.5}" style="fill:${c};stroke:var(--panel)" stroke-width="1.5"/>`);
    if(big) s+=`<text x="${W_-m.r}" y="${cy-8}" text-anchor="end" style="font-size:10px">→ ${fP(d,0)} / ${fP(ns,0)} / ${fP(u,0)}</text>`; });
  el.innerHTML=s+'</svg>'+`<p class="note">Instruction & NSR is off the scale (Dal ${fP(FI.med.Dalhousie.instr_sh,0)}, NS ${fP(FI.med['Nova Scotia'].instr_sh,0)}, U15 ${fP(FI.med.U15.instr_sh,0)}). Dal spends less of its budget on administration and student services, both excluded or partly excluded, and more on instruction & research, which is included.</p>`;
}
function drawTrend(el){
  const T=FI.ts, yrs=T.Dalhousie.years; const W_=560,H=260,m={l:44,r:70,t:14,b:30}; const x=lin(0,yrs.length-1,m.l,W_-m.r), y=lin(.3,.9,H-m.b,m.t);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Proxy coverage trend">`; const yt=[.3,.45,.6,.75,.9];
  s+=`<g class="grid">${yt.map(t=>`<line x1="${m.l}" x2="${W_-m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`+yt.map(t=>`<text x="${m.l-6}" y="${y(t)+4}" text-anchor="end">${Math.round(t*100)}%</text>`).join('');
  yrs.forEach((yy,i)=>{ if(i%4===0||i===yrs.length-1) s+=`<text x="${x(i)}" y="${H-10}" text-anchor="middle">${yy.slice(2,4)}-${yy.slice(-2)}</text>`; });
  [['U15','var(--hi)'],['Nova Scotia','var(--c-rat)'],['Dalhousie','var(--accent)']].forEach(([k,c])=>{ const ser=T[k]; const pts=yrs.map((yy,i)=>{const j=ser.years.indexOf(yy); return j<0||ser.prox[j]==null?null:[x(i),y(ser.prox[j]),ser.prox[j],yy]}).filter(Boolean);
    s+=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join('')}" fill="none" style="stroke:${c}" stroke-width="${k==='Dalhousie'?2.5:2}"/>`;
    pts.forEach(p=>s+=`<circle ${tipAttr(`<b>${k==='Nova Scotia'?'NS median':k==='U15'?'U15 median':'Dalhousie'}, ${p[3]}</b><br>Proxy tuition coverage ${fP(p[2],1)}`)} cx="${p[0]}" cy="${p[1]}" r="6" fill="transparent"/>`);
    const last=pts[pts.length-1]; s+=`<circle cx="${last[0]}" cy="${last[1]}" r="3.5" style="fill:${c}"/><text x="${last[0]+7}" y="${last[1]+4}" class="ink" style="font-size:10.5px">${k==='Nova Scotia'?'NS':k==='U15'?'U15':'Dal'} ${fP(last[2],0)}</text>`; });
  el.innerHTML=s+'</svg>';
}


/* story additions for the costing model and method caveats */
Object.assign(STORY,{
 cscope:{h:'State the limits before the numbers',tell:'Program costing captures the instructional slice of the university and only tuition revenue. These four figures set the frame every other number in this tool must be read in, and they are the answer to anyone who treats the program "deficit" as the size of the grant need.',look:['The share of operating spending the model counts.','That the operating grant contributes $0 to any program.','The unreconciled gap (M7): included spending that never reached a program.'],links:['R1'],m:['M4','M7'],read:'Shares use FIUC 2023-24 for Dalhousie and the 2024-25 program costing totals.',live:()=>''},
 csees:{h:'What is inside and outside the model',tell:'Three bars on one dollar scale. The top bar is all of Dalhousie\'s spending; research, ancillary and capital funds never enter program costing. The middle bar breaks the operating fund into functions; only the blue ones feed program cost, and even they do not fully arrive (the marker). The bottom bar shows that only credit tuition counts as program revenue; the operating grant is about as large and is excluded.',look:['The distance between the end of the blue segments and the program-cost marker (M7).','The size of the grey provincial grant segment next to blue tuition.','The violet scholarships segment: counted against revenue, not cost (M3).'],links:['R1'],m:['M3','M4','M6','M7'],read:'Blue: included. Violet: netted against tuition. Grey: excluded. Dashed: outside the operating fund. Black markers: program totals the model produced.',live:()=>''},
 cpeer:{h:'Is Dal\'s cost base comparable to its NS peers?',tell:'Program costing loads the included functions onto programs. If a university puts more of its budget into those functions, its programs carry more cost under the same method. Dal\'s profile matches the U15, not the rest of Nova Scotia: research-intensive, with more of its operating budget in instruction and research and less in administration and student services.',look:['Dal\'s position against the orange NS dots: further right (research) and higher (more included).','That U15 universities cluster around the same included share as Dal.'],links:[],m:['M1','M2'],read:'Each dot is a university. Orange: other NS universities. Blue: U15. Grey: other Canadian.',live:()=>`Dal: ${fP(FI.med.Dalhousie.ri,0)} research intensity, ${fP(FI.med.Dalhousie.incl_sh,1)} included. NS median: ${fP(FI.med['Nova Scotia'].ri,0)}, ${fP(FI.med['Nova Scotia'].incl_sh,1)}.`},
 cprox:{h:'How would every NS university look under this method?',tell:'A proxy that applies the model\'s scope rules to each university\'s FIUC return: credit tuition divided by spending in the included functions. It strips out institution-specific allocation choices, so it is the fairest available like-for-like comparison. It shows Dal starting well behind its NS peers before a single program is costed.',look:['The gap between Dal and the NS median.','That Dal sits close to the U15 median: the method treats research universities alike.'],links:['R1'],m:['M1','M4'],read:'Bars: credit tuition ÷ (instruction & non-sponsored research + library + administration & academic support).',live:()=>`Dal ${fP(FI.med.Dalhousie.proxy_rec,0)} vs NS median ${fP(FI.med['Nova Scotia'].proxy_rec,0)} and U15 median ${fP(FI.med.U15.proxy_rec,0)}.`},
 cfunc:{h:'Which exclusions matter for Dal?',tell:'Shows where Dal\'s spending differs from peers in functions the model treats differently. Dal spends relatively more on included instruction and research and relatively less on excluded or partly excluded administration and student services. Under program costing that difference turns into higher program cost for Dal, with no change in actual efficiency.',look:['Rows marked IN where Dal is right of the NS median: more cost loaded onto programs.','Rows marked OUT where Dal is left of the NS median: less cost removed.','Scholarships (NET): Dal\'s higher share lowers program revenue (M3).'],links:[],m:['M1','M3','M6'],read:'Dots show each function\'s share of operating spending. IN = included, NET = netted from tuition, OUT = excluded.',live:()=>''},
 ctrend:{h:'Is the gap structural?',tell:'If Dal\'s lower coverage were a one-year anomaly it could be dismissed. Over 24 years of FIUC data it is persistent, so it reflects Dal\'s structure (research, graduate and professional education), not a recent cost problem.',look:['Dal below the NS median in every year.','Dal tracking the U15 median.'],links:['R1'],m:['M1','M4'],read:'Lines: proxy tuition coverage by year. NS and U15 lines are medians.',live:()=>''},
 cskew:{h:'Attribute skews where they show up',tell:'Each caveat ties a feature of the method to the programs and charts it affects, with a direction. Use the codes when presenting a result: "Dentistry\'s contribution is affected by M5 and M6" tells the reader which way the number is biased and why.',look:['Caveats marked "Disadvantages Dal vs NS peers": cite these whenever Dal is compared with other universities.','Caveats that shift cost between Dal programs: cite these in faculty and program comparisons.','"List programs" opens the Programs tab filtered to that caveat.'],links:[],m:[],read:'Coloured pills give the direction of each skew.',live:()=>''},
 ctable:{h:'Line-by-line treatment',tell:'A reference for anyone checking a figure: every major FIUC line, how program costing treats it, and where the guide says so.',look:['Large excluded lines that relate directly to teaching (plant, academic IT).'],links:[],m:[],read:'Amounts are Dalhousie FIUC 2023-24.',live:()=>''}
});
Object.assign(CHART,{cscope:'Costing model scope',csees:'What the model sees',cpeer:'Peer cost structure',cprox:'Proxy tuition coverage',cfunc:'Function shares',ctrend:'Coverage trend',cskew:'Method caveats',ctable:'Inclusion reference'});
const SM={kpi:['M4','M7'],whale:['M4','M5','M7'],mix:['M1','M2'],hist:['M1','M2','M3'],bands:['M2'],bub1:['M1','M2','M3'],lma:['M1','M4'],facT:['M4','M5','M6','M8'],strip:['M1','M8'],grow:['M4'],ro:['M1','M3'],progT:['M1','M2','M3','M5','M6','M8'],bridge:['M6','M7'],levers:['M6','M7'],facimp:['M6','M8']};
Object.entries(SM).forEach(([k,v])=>{ if(STORY[k]) STORY[k].m=v; });
STORY.kpi.h='Instructional economics at a glance';
STORY.kpi.tell='Sets the frame for every other view: how much of the cost the model counts is covered by net credit tuition, and how large the contribution shortfall is before the operating grant. It is not the university\'s financial position: the model counts roughly half of operating spending and none of the grant.';
STORY.kpi.look=['Tuition coverage below 100% is expected: the operating grant is not allocated to programs.','Never read the contribution figure as the grant requirement or the institutional deficit.','Compare enrolment change with contribution: growth that leaves coverage flat or falling is growth in low-contribution programs.'];
STORY.detail.m=[];

/* ================= LABOUR MARKET ================= */
const LENS = {
 lma:{name:'LMA signal', src:'institutional composite (column AD)', groups:['LMA 1 · strongest','LMA 2 · stronger','LMA 3–4 · weaker','No signal (0)'],
  g:r=>r.lma===1?0:r.lma===2?1:(r.lma===3||r.lma===4)?2:3},
 emp:{name:'NS employment outlook', src:'ESDC 3-year employment prospects (column AE)', groups:['Very good','Good','Moderate or limited','Undetermined / no data'],
  g:r=>r.emp==='Very good'?0:r.emp==='Good'?1:(r.emp==='Moderate'||r.emp==='Limited')?2:3},
 cops:{name:'COPS workforce outlook', src:'COPS 2024-33 shortage / surplus (column AF)', groups:['Strong shortage risk','Moderate shortage risk','Insufficient signal','Surplus / no data'],
  g:r=>/Strong risk of Shortage/.test(r.pv)?0:/Moderate risk of Shortage/.test(r.pv)?1:r.pv==='Insufficient signal'?2:3}
};
const LMC = ['var(--hi)','var(--hi-lt)','var(--c-rat)','var(--nc)'];
const lmStrong = r => { const g=LENS[P.lm].g(r); return P.lm==='cops' ? (g<=1?'strong':/Surplus/.test(r.pv)?'weak':'none') : (g<=1?'strong':g===2?'weak':'none'); };
const legendLM = () => `<div class="legend">${LENS[P.lm].groups.map((g,i)=>`<span><i style="background:${LMC[i]}"></i>${g}</span>`).join('')}</div>`;
let lmW='e24', lmTblF='all', lmDim=null;

function drawLMMix(el){
  const L=LENS[P.lm]; const wf=r=>lmW==='n'?1:(r.e24||0);
  const rows=[...L.groups.map((g,i)=>({lab:g,a:VIS.filter(r=>r.lmg===i),c:LMC[i]})),{lab:'All programs',a:VIS,c:'var(--ink)'}];
  const W_=1000,rh=30,m={l:190,r:250,t:6},H=m.t+rows.length*(rh+10)+6;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Quadrant mix by labour-market group">`;
  rows.forEach((row,i)=>{ const yy=m.t+i*(rh+10)+(i===rows.length-1?6:0); const tot=sum(row.a,wf)||1; let x0=m.l;
    s+=`<rect x="${m.l-178}" y="${yy+rh/2-5}" width="10" height="10" rx="2" style="fill:${row.c}"/><text x="${m.l-162}" y="${yy+rh/2+4}" class="ink" style="${i===rows.length-1?'font-weight:700':''}">${esc(row.lab)}</text>`;
    QUADS.forEach(q=>{ const g=row.a.filter(r=>r.quad===q); const val=sum(g,wf); const w=val/tot*(W_-m.l-m.r); if(w<=0) return;
      s+=`<rect ${tipAttr(`<b>${esc(row.lab)} · ${q==='Not charted'?q:q.replace('High','Above line').replace('Low','Below line')}</b><div class="kv"><span>Programs</span><span>${g.length}</span><span>Students</span><span>${fN(sum(g,r=>r.e24))}</span><span>Share of row</span><span>${fP(val/tot)}</span><span>Contribution</span><span>${f$(sum(g,r=>r.mar))}</span></div>`)} x="${x0+1}" y="${yy}" width="${Math.max(0,w-2)}" height="${rh}" rx="3" style="fill:${QC[q]}"/>`;
      if(w>34) s+=`<text x="${x0+w/2}" y="${yy+rh/2+4}" text-anchor="middle" style="fill:${q.includes('growing')?'#fff':'var(--ink)'};font-weight:600;font-size:10.5px;pointer-events:none">${Math.round(val/tot*100)}%</text>`;
      x0+=w; });
    const e21=sum(row.a,r=>r.e21), e24=sum(row.a,r=>r.e24), ch=e21?e24/e21-1:null;
    s+=`<text x="${W_-m.r+12}" y="${yy+rh/2-2}" class="ink" style="font-size:11px">${row.a.length} programs · ${fN(e24)} students</text><text x="${W_-m.r+12}" y="${yy+rh/2+12}" style="font-size:10.5px;fill:${ch>=0?'var(--good)':'var(--crit)'}">${fPs(ch)} since 21-22 · <tspan style="fill:var(--ink-2)">${f$(sum(row.a,r=>r.mar))}</tspan></text>`; });
  el.innerHTML=s+'</svg>';
}

// Dal share of NS credentials. The workbook repeats the Dal and NS credential counts on every Dal program
// that shares a program type and CIP code, so count each (type, CIP) market once.
function credShare(rows){const m=new Map();rows.forEach(r=>{const k=r.lv+'|'+r.cip;if(r.ns24!=null&&!m.has(k))m.set(k,[r.cred24||0,r.ns24||0]);});let a=0,b=0;m.forEach(([x,y])=>{a+=x;b+=y;});return b?a/b:null;}
function vLabour(v){
  const L=LENS[P.lm], a=VIS; const e24=sum(a,r=>r.e24)||1;
  const st=a.filter(r=>r.lmaS==='strong'), none=a.filter(r=>r.lmaS==='none'), sh=a.filter(r=>/Shortage/.test(r.pv));
  const ch=g=>{const x=sum(g,r=>r.e21);return x?sum(g,r=>r.e24)/x-1:null;};
  v.innerHTML = `
  <div class="lens-bar"><span>Labour-market lens</span>${seg('lens',[['lma','LMA signal'],['emp','NS employment outlook'],['cops','COPS shortage / surplus']],P.lm)}<span class="scope">${esc(L.src)}. The lens also sets what "stronger labour market" means in risk scores, the signal-implied category and the filter bar.</span></div>
  <div class="kpis" data-s="lmkpi">
   <div class="kpi"><div class="l">Students in stronger-signal programs</div><div class="v">${fP(sum(st,r=>r.e24)/e24,0)}</div><div class="d ${ch(st)>=0?'pos':'neg'}">${fPs(ch(st))} since 2021-22 · ${st.length} programs</div></div>
   <div class="kpi"><div class="l">Students in shortage-aligned programs</div><div class="v">${fP(sum(sh,r=>r.e24)/e24,0)}</div><div class="d ${ch(sh)>=0?'pos':'neg'}">${fPs(ch(sh))} since 2021-22 · COPS</div></div>
   <div class="kpi"><div class="l">Shortage programs with falling enrolment</div><div class="v">${sh.filter(r=>r.c3!=null&&r.c3<0).length}<span style="font-size:.9rem;color:var(--muted)"> of ${sh.length}</span></div><div class="d">${fN(sum(sh.filter(r=>r.c3<0),r=>r.e24))} students · 3-yr CAGR &lt; 0</div></div>
   <div class="kpi"><div class="l">Students with no usable signal</div><div class="v">${fP(sum(none,r=>r.e24)/e24,0)}</div><div class="d">${none.length} programs · ${f$(sum(none,r=>r.mar))}</div></div>
   <div class="kpi"><div class="l">Dal share of NS credentials</div><div class="v">${fP(credShare(st),0)}</div><div class="d">in stronger-signal fields, 2024</div></div>
  </div>
  <div class="grid g2">
   <section data-s="lmshift" class="panel"><header><div><h2>Is enrolment moving toward labour-market need?</h2><p class="q">Students by ${esc(L.name)} group, 2021-22 to 2024-25. Each row shows the start, the end and the change.</p></div></header><div id="lmShift"></div>${legendLM()}</section>
   <section data-s="lmcost" class="panel"><header><div><h2>The cost of growing where demand is</h2><p class="q">Instructional contribution per credit hour and total, by group. Where the labour market is strongest, programs are often the most expensive to deliver.</p></div></header><div id="lmCost"></div></section>
   <section data-s="lmsupply" class="panel" style="grid-column:1/-1"><header><div><h2>Supply response: enrolment trend against labour-market signal</h2><p class="q">Each dot is a program, placed by its ${P.trend==='c3'?'3-year':'10-year'} enrolment CAGR within its ${esc(L.name)} group. Size: students. Colour: above or below the margin line. Shaded zones mark where supply is moving against the signal.</p></div></header><div id="lmSupply"></div><div class="legend"><span><i style="background:var(--hi)"></i>At or above margin line</span><span><i style="background:var(--lo)"></i>Below margin line</span><span><i style="background:var(--nc)"></i>No costing</span><span><i style="background:color-mix(in srgb,var(--c-rat) 22%,var(--panel))"></i>Vulnerability: stronger signal, declining</span><span><i style="background:color-mix(in srgb,var(--warn) 18%,var(--panel))"></i>Watch: weaker signal, growing</span></div></section>
   <section data-s="lmpipe" class="panel" style="grid-column:1/-1"><header><div><h2>Shortage pipeline</h2><p class="q">Programs whose most closely linked occupation has a COPS shortage risk (2024-33), with their supply trend and economics. These are the programs a provincial review will look at first.</p></div>${seg('lmf',[['all','All'],['fall','Supply falling'],['sole','Sole NS provider'],['grow','Expand candidates'],['cost','Costly to grow']],lmTblF)}</header><div id="lmPipe"></div></section>
   <section data-s="lmfac" class="panel"><header><div><h2>Faculty labour-market profile</h2><p class="q">Share of each faculty's 2024-25 students by ${esc(L.name)} group, with the change in stronger-signal students since 2021-22.</p></div></header><div id="lmFac"></div>${legendLM()}</section>
   <section data-s="lmcons" class="panel"><header><div><h2>Do the signals agree?</h2><p class="q">NS employment outlook (rows) against COPS outlook (columns). Each cell: programs, students and the spread of LMA signals. Disagreement between the institutional composite and the raw sources is where a reviewer will push back.</p></div></header><div id="lmCons"></div></section>
   <section data-s="lmread" class="panel" style="grid-column:1/-1"><header><div><h2>Reading the labour-market signals</h2><p class="q">Limits of the evidence, so findings are stated with the right confidence.</p></div></header>
    <div class="skews">${[
     ['L1','One occupation per program','Template 1 asks for the single NOC most strongly aligned with each CIP code. Programs that feed many occupations (arts, science, general degrees) are judged on one of them. That is why History, English and French show a shortage risk: their strongest-linked occupation happens to be in shortage.'],
     ['L2','Most programs have no COPS signal',`${RAW.filter(r=>r.pv==='Insufficient signal').length} of ${RAW.length} programs have "insufficient signal" for COPS shortage or surplus. Absence of a shortage flag is not evidence of weak demand.`],
     ['L3','The LMA signal is a composite','The same outlook pair maps to different LMA values (for example "Good" + "Strong shortage" appears as LMA 0, 1, 2 and 3), so the signal also reflects CIP–NOC link strength. Its construction is not documented in the workbook; record it in the Template 7 method note.'],
     ['L4','Graduate programs share undergraduate mappings','CIP–NOC links are built mostly from bachelor\'s graduates. Research master\'s and PhD outcomes (academia, research roles) are poorly captured, so their signals are weak or missing.'],
     ['L5','Different horizons','NS employment prospects cover 3 years (2024-26); COPS projects 10 years (2024-33). A program can look strong on one and neutral on the other.'],
     ['L6','Missing column',`The "Employment prospects" column (AG) is empty for all programs. If it was meant to hold the weighted employment % or coverage score from the CIP–NOC file, adding it would let link strength be shown directly.`]
    ].map(([id,t,b])=>`<article class="skew"><div class="skew-h"><span class="chip m">${id}</span><h3>${t}</h3></div><p>${b}</p></article>`).join('')}</div></section>
  </div>`;
  bindSeg(v,'lens',x=>{P.lm=x; $('pLm').value=x; F.lmg='All'; store.set('P',P); render();});
  bindSeg(v,'lmf',x=>{lmTblF=x; render();});
  drawLMShift($('lmShift')); drawLMCost($('lmCost')); drawLMSupply($('lmSupply')); drawLMPipe($('lmPipe')); drawLMFac($('lmFac')); drawLMCons($('lmCons'));
}
function drawLMShift(el){
  const L=LENS[P.lm]; const rows=L.groups.map((g,i)=>{const a=VIS.filter(r=>r.lmg===i);return {g,i,a,e21:sum(a,r=>r.e21),e24:sum(a,r=>r.e24)};});
  const W_=560,rh=46,m={l:150,r:118,t:20,b:26},H=m.t+rows.length*rh+m.b; const mx=Math.max(10,...rows.flatMap(r=>[r.e21,r.e24])); const xt=nice(0,mx,4); const x=lin(0,Math.max(mx*1.04,xt[xt.length-1]),m.l,W_-m.r);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Enrolment shift by labour-market group"><g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t-6}" y2="${H-m.b}"/>`).join('')}</g>`+xt.map(t=>`<text x="${x(t)}" y="${H-8}" text-anchor="middle">${fN(t)}</text>`).join('');
  s+=`<text x="${m.l}" y="${m.t-8}" class="mut" style="font-size:10px">○ 2021-22   ● 2024-25</text>`;
  rows.forEach((r,i)=>{ const cy=m.t+i*rh+rh/2; const d=r.e24-r.e21, p=r.e21?d/r.e21:null; const c=LMC[i];
    s+=`<text x="${m.l-10}" y="${cy+4}" text-anchor="end" class="ink">${esc(r.g)}</text><text x="${m.l-10}" y="${cy+17}" text-anchor="end" style="font-size:10px">${r.a.length} programs</text>`;
    s+=`<line x1="${x(r.e21)}" x2="${x(r.e24)}" y1="${cy}" y2="${cy}" style="stroke:${c}" stroke-width="4" stroke-linecap="round"/>`;
    s+=`<circle cx="${x(r.e21)}" cy="${cy}" r="6" style="fill:var(--panel);stroke:${c}" stroke-width="2"/><circle ${tipAttr(`<b>${esc(r.g)}</b><div class="kv"><span>2021-22</span><span>${fN(r.e21)}</span><span>2024-25</span><span>${fN(r.e24)}</span><span>Change</span><span>${d>0?'+':''}${fN(d)} (${fPs(p)})</span><span>Contribution</span><span>${f$(sum(r.a,q=>q.mar))}</span></div>`)} cx="${x(r.e24)}" cy="${cy}" r="7" style="fill:${c};stroke:var(--panel)" stroke-width="2"/>`;
    s+=`<text x="${W_-m.r+10}" y="${cy+4}" class="ink" style="font-weight:700;fill:${d>=0?'var(--good)':'var(--crit)'}">${d>0?'+':''}${fN(d)} (${fPs(p)})</text>`; });
  const tot=sum(VIS,r=>r.e24-r.e21); const top=rows.slice(0,2); const gain=sum(top,r=>r.e24-r.e21);
  el.innerHTML=s+'</svg>'+`<p class="note">Net change ${tot>0?'+':''}${fN(tot)} students; the two stronger groups account for ${gain>0?'+':''}${fN(gain)}.</p>`;
}
function drawLMCost(el){
  const L=LENS[P.lm]; const rows=L.groups.map((g,i)=>{const a=VIS.filter(r=>r.lmg===i);const chp=sum(a,r=>r.chp),mar=sum(a,r=>r.mar);return {g,i,a,mpc:chp?mar/chp:null,mar,rec:sum(a,r=>r.cost)?sum(a,r=>r.rev)/sum(a,r=>r.cost):null};});
  const W_=560,rh=46,m={l:150,r:120,t:14,b:26},H=m.t+rows.length*rh+m.b; const lo=Math.min(-100,...rows.map(r=>r.mpc||0)), hi=Math.max(100,...rows.map(r=>r.mpc||0)); const xt=nice(lo,hi,4); const x=lin(Math.min(lo,xt[0]),Math.max(hi,xt[xt.length-1]),m.l,W_-m.r);
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Contribution by labour-market group"><g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}</g><line class="ax" x1="${x(0)}" x2="${x(0)}" y1="${m.t}" y2="${H-m.b}"/>`+xt.map(t=>`<text x="${x(t)}" y="${H-8}" text-anchor="middle">${fC(t)}</text>`).join('');
  rows.forEach((r,i)=>{ const yy=m.t+i*rh+10, h=rh-20; if(r.mpc==null) return; const x0=Math.min(x(0),x(r.mpc)), w=Math.abs(x(r.mpc)-x(0));
    s+=`<text x="${m.l-10}" y="${yy+h/2+4}" text-anchor="end" class="ink">${esc(r.g)}</text>`;
    s+=`<rect ${tipAttr(`<b>${esc(r.g)}</b><div class="kv"><span>Contribution / CHP</span><span>${fC(r.mpc)}</span><span>Total</span><span>${f$(r.mar)}</span><span>Tuition coverage</span><span>${fP(r.rec,0)}</span></div>`)} x="${x0}" y="${yy}" width="${Math.max(1,w)}" height="${h}" rx="3" style="fill:${r.mpc>=0?'var(--hi)':'var(--lo)'}"/>`;
    s+=`<text x="${W_-m.r+10}" y="${yy+h/2}" class="ink" style="font-size:11px;font-weight:600">${fC(r.mpc)} / CHP</text><text x="${W_-m.r+10}" y="${yy+h/2+13}" style="font-size:10.5px">${f$(r.mar)} · ${fP(r.rec,0)} cov.</text>`; });
  el.innerHTML=s+'</svg>'+`<p class="note">Per credit hour, before the operating grant (see Costing model, M4–M5). Health and professional programs dominate the stronger groups, so their delivery cost and clinical revenue outside the model drive these figures.</p>`;
}
function drawLMSupply(el){
  const L=LENS[P.lm]; const a=VIS.filter(r=>r.tr!=null&&r.e24).sort((p,q)=>sizeVal(q)-sizeVal(p));
  const W_=1000,rh=86,m={l:170,r:20,t:14,b:40},H=m.t+L.groups.length*rh+m.b; const xl=-40,xh=40; const x=lin(xl,xh,m.l,W_-m.r); const cut=P.grow;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Supply response">`;
  L.groups.forEach((g,i)=>{ const y0=m.t+i*rh; if(i<=1) s+=`<rect x="${m.l}" y="${y0}" width="${x(cut)-m.l}" height="${rh}" style="fill:color-mix(in srgb,var(--c-rat) 12%,transparent)"/>`; if(i===2) s+=`<rect x="${x(cut)}" y="${y0}" width="${W_-m.r-x(cut)}" height="${rh}" style="fill:color-mix(in srgb,var(--warn) 10%,transparent)"/>`;
    s+=`<line x1="${m.l}" x2="${W_-m.r}" y1="${y0+rh}" y2="${y0+rh}" style="stroke:var(--line)"/>`;
    const gg=a.filter(r=>r.lmg===i); const dec=gg.filter(r=>r.tr*100<cut), gro=gg.filter(r=>r.tr*100>=cut);
    s+=`<rect x="${m.l-162}" y="${y0+rh/2-14}" width="10" height="10" rx="2" style="fill:${LMC[i]}"/><text x="${m.l-146}" y="${y0+rh/2-5}" class="ink" style="font-weight:600">${esc(g)}</text><text x="${m.l-146}" y="${y0+rh/2+9}" style="font-size:10px">↓ ${dec.length} (${fN(sum(dec,r=>r.e24))} st.)</text><text x="${m.l-146}" y="${y0+rh/2+22}" style="font-size:10px">↑ ${gro.length} (${fN(sum(gro,r=>r.e24))} st.)</text>`; });
  const xt=[-40,-30,-20,-10,0,10,20,30,40]; s+=`<g class="grid">${xt.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}</g>`+xt.map(t=>`<text x="${x(t)}" y="${H-m.b+16}" text-anchor="middle">${t===xl?'≤':t===xh?'≥':''}${t>0?'+':''}${t}%</text>`).join('');
  s+=`<line class="ax" x1="${x(cut)}" x2="${x(cut)}" y1="${m.t}" y2="${H-m.b}"/><text x="${(m.l+W_)/2}" y="${H-6}" text-anchor="middle" class="mut">Enrolment CAGR (${P.trend==='c3'?'3-year':'10-year'})</text>`;
  a.forEach(r=>{ const i=r.lmg; const cy=m.t+i*rh+rh/2+(hash(r.id)-.5)*rh*.72; const cx=x(Math.max(xl,Math.min(xh,r.tr*100)));
    s+=`<circle class="hit" data-id="${r.id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad(r,16).toFixed(1)}" style="fill:${r.above==null?'var(--nc)':r.above?'var(--hi)':'var(--lo)'};fill-opacity:.75;stroke:var(--panel)" stroke-width="1"/>`; });
  const vul=a.filter(r=>r.lmg<=1&&r.tr*100<cut);
  el.innerHTML=s+'</svg>'+`<p class="note"><b>${vul.length}</b> stronger-signal programs are declining (${fN(sum(vul,r=>r.e24))} students), led by ${topNames(vul,r=>r.e24,4)}. Programs without a trend are not shown.</p>`;
}
function drawLMPipe(el){
  let a=VIS.filter(r=>/Shortage/.test(r.pv));
  const flags=r=>{const f=[]; if((r.c3!=null&&r.c3<0)||r.grad==='Decreasing') f.push(['fall','Supply falling','r']); if(r.ms===1) f.push(['sole','Sole NS provider','o']); if(r.growing&&r.above) f.push(['grow','Expand candidate','o']); if(r.above===false) f.push(['cost','Costly to grow','r']); if(r.teach) f.push(['teach',r.st,'']); return f;};
  if(lmTblF!=='all') a=a.filter(r=>flags(r).some(f=>f[0]===lmTblF));
  a=a.slice().sort((p,q)=>(q.e24||0)-(p.e24||0));
  el.innerHTML=`<div class="tblwrap"><table><thead><tr><th>Program</th><th>Faculty</th><th>COPS</th><th>Outlook</th><th class="n">Students</th><th class="n">3-yr</th><th class="n">10-yr</th><th>Credentials</th><th class="n">NS share</th><th>NS market</th><th class="n">Contribution</th><th>Category</th><th>Flags</th></tr></thead><tbody>
  ${a.map(r=>`<tr><td><span data-id="${r.id}" style="cursor:help">${esc(r.nm)}</span></td><td>${esc(r.fac)}</td><td>${/Strong/.test(r.pv)?'<b>Strong</b>':'Moderate'}</td><td>${esc(r.emp)}</td><td class="n">${fN(r.e24)}</td><td class="n ${r.c3==null?'':r.c3>=0?'pos':'neg'}">${fPs(r.c3)}</td><td class="n ${r.c10==null?'':r.c10>=0?'pos':'neg'}">${fPs(r.c10)}</td><td>${esc(r.grad)}</td><td class="n">${fP(r.ms,0)}</td><td>${esc(r.mkt.replace(' market',''))}</td><td class="n">${f$(r.mar)}</td><td><span class="cat"><i style="background:${CATC[r.cat]}"></i>${r.cat}</span></td><td>${flags(r).map(f=>`<span class="chip ${f[2]}">${esc(f[1])}</span>`).join('')}${skewsFor(r).map(mchip).join('')}</td></tr>`).join('')||'<tr><td colspan="13" class="empty">No shortage-aligned programs in this filter.</td></tr>'}
  </tbody></table></div><p class="note">${a.length} programs shown. "Supply falling": 3-yr enrolment CAGR below zero or credentials decreasing. "Expand candidate": growing and at or above the margin line. "Costly to grow": below the margin line, so growth deepens the contribution gap unless targeted funding follows.</p>`;
}
function drawLMFac(el){
  const L=LENS[P.lm]; const pool=ALL.filter(r=>(F.lv==='All'||r.lv===F.lv)&&(F.cat==='All'||r.cat===F.cat)&&(F.teach||!r.teach));
  const rows=FACS.map(f=>{const a=pool.filter(r=>r.fac===f);const s=a.filter(r=>r.lmg<=1);return {f,a,e:sum(a,r=>r.e24),d:sum(s,r=>r.e24-r.e21),sh:sum(a,r=>r.e24)?sum(s,r=>r.e24)/sum(a,r=>r.e24):0};}).filter(r=>r.e).sort((p,q)=>q.sh-p.sh);
  const W_=560,rh=26,m={l:150,r:60,t:4,b:8},H=m.t+rows.length*rh+m.b;
  let s=`<svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Faculty labour-market profile">`;
  rows.forEach((r,i)=>{ const yy=m.t+i*rh; let x0=m.l; s+=`<text x="${m.l-8}" y="${yy+15}" text-anchor="end" class="ink" style="${r.f===F.fac?'font-weight:700':''}">${esc(r.f)}</text>`;
    L.groups.forEach((g,gi)=>{ const a=r.a.filter(p=>p.lmg===gi); const val=sum(a,p=>p.e24); const w=val/r.e*(W_-m.l-m.r); if(w<=0) return;
      s+=`<rect ${tipAttr(`<b>${esc(r.f)} · ${esc(g)}</b><div class="kv"><span>Students</span><span>${fN(val)} (${fP(val/r.e,0)})</span><span>Programs</span><span>${a.length}</span><span>Change since 21-22</span><span>${fN(sum(a,p=>p.e24-p.e21))}</span></div>`)} x="${x0+1}" y="${yy+3}" width="${Math.max(0,w-2)}" height="${rh-8}" rx="2" style="fill:${LMC[gi]}"/>`; x0+=w; });
    s+=`<text x="${W_-m.r+6}" y="${yy+15}" style="font-size:10.5px;fill:${r.d>=0?'var(--good)':'var(--crit)'}">${r.d>0?'+':''}${r.d}</text>`; });
  el.innerHTML=s+'</svg>'+`<p class="note">Right-hand figure: change in students in the two stronger groups since 2021-22. Faculties ordered by stronger-signal share.</p>`;
}
function drawLMCons(el){
  const R=[['Very good',r=>r.emp==='Very good'],['Good',r=>r.emp==='Good'],['Moderate / limited',r=>r.emp==='Moderate'||r.emp==='Limited'],['Undetermined / no data',r=>!['Very good','Good','Moderate','Limited'].includes(r.emp)]];
  const C=[['Strong shortage',r=>/Strong risk of Shortage/.test(r.pv)],['Moderate shortage',r=>/Moderate risk of Shortage/.test(r.pv)],['Insufficient',r=>r.pv==='Insufficient signal'],['Other / none',r=>!/Shortage/.test(r.pv)&&r.pv!=='Insufficient signal']];
  const emax=Math.max(1,...R.flatMap(([,rf])=>C.map(([,cf])=>sum(VIS.filter(r=>rf(r)&&cf(r)),r=>r.e24))));
  let h=`<div class="tblwrap" style="max-height:none"><table class="matrix"><thead><tr><th style="text-align:left">Outlook ↓ · COPS →</th>${C.map(c=>`<th>${c[0]}</th>`).join('')}</tr></thead><tbody>`;
  R.forEach(([rl,rf])=>{ h+=`<tr><th style="text-align:left;position:static">${rl}</th>`; C.forEach(([cl,cf])=>{ const g=VIS.filter(r=>rf(r)&&cf(r)); if(!g.length){h+='<td style="color:var(--muted)">–</td>';return;}
      const e=sum(g,r=>r.e24); const dist=[1,2,3,0].map(k=>g.filter(r=>(k===3?(r.lma===3||r.lma===4):k===0?!(r.lma>=1):r.lma===k)).length);
      const bar=`<svg viewBox="0 0 60 8" style="width:60px;display:block;margin:3px auto 0">${(()=>{let x0=0;return dist.map((n,k)=>{const w=n/g.length*60;const o=w?`<rect x="${x0}" y="0" width="${Math.max(0,w-1)}" height="8" rx="1" style="fill:${LMC[k]}"/>`:'';x0+=w;return o;}).join('')})()}</svg>`;
      h+=`<td ${tipAttr(`<b>${rl} outlook · ${cl}</b><div class="kv"><span>Programs</span><span>${g.length}</span><span>Students</span><span>${fN(e)}</span><span>LMA 1 / 2 / 3–4 / 0</span><span>${dist.join(' / ')}</span></div><div style="margin-top:4px;color:var(--muted)">${g.slice().sort((p,q)=>(q.e24||0)-(p.e24||0)).slice(0,6).map(r=>esc(r.nm)+' · LMA '+(r.lma??'–')).join('<br>')}</div>`)} style="background:color-mix(in srgb,var(--hi) ${Math.round(e/emax*40)}%,var(--panel));line-height:1.2"><b>${g.length}</b><br><span style="font-size:.72rem">${fN(e)} st.</span>${bar}</td>`; }); h+='</tr>'; });
  const odd=VIS.filter(r=>(r.lma===0||r.lma==null)&&(['Very good','Good'].includes(r.emp))&&(r.e24||0)>=50).sort((p,q)=>q.e24-p.e24);
  el.innerHTML=h+`</tbody></table></div><div class="legend"><span>Mini-bars: LMA</span>${['1','2','3–4','0'].map((g,i)=>`<span><i style="background:${LMC[i]}"></i>${g}</span>`).join('')}</div><p class="note"><b>Large programs with a good outlook but no LMA signal:</b> ${odd.length?odd.slice(0,5).map(r=>`${esc(r.nm)} (${fN(r.e24)})`).join(', '):'none in this filter'}. A reviewer reading the raw outlook will see these as well aligned; document why the composite gives no signal.</p>`;
}


Object.assign(STORY,{
 lmmix:{h:'Are labour-market priorities also financially healthy?',tell:'Splits the quadrant mix by labour-market group. If the strongest-signal rows are mostly blue (above the line), labour-market alignment and financial health point the same way and growth is easy to justify. If they are mostly red, the programs government most wants are the ones tuition does not cover, and the case for growth needs targeted funding.',look:['The share of red (below line) in the top two rows.','Whether the "No signal" row is large: activity whose labour-market case is unmade.','The enrolment change at the right of each row.'],links:['O4','R8','R10'],m:['M4','M5'],read:'Rows are labour-market groups under the current lens; segments are quadrants. Right: program and student counts, change since 2021-22, and total contribution.',live:()=>{ const a=VIS.filter(r=>r.lmg<=1); const b=a.filter(r=>r.above===false); return `In the two stronger groups, <b>${pctOf(sum(b,r=>r.e24),sum(a,r=>r.e24))}</b> of students are in below-line programs.`; }},
 lmkpi:{h:'Labour-market alignment at a glance',tell:'The headline indicators a government reviewer is likely to start from: how much of the student body is in programs with strong labour-market evidence, whether that share is growing, and how much activity has no evidence at all.',look:['Growth in stronger-signal programs against total growth.','Shortage programs with falling enrolment: the clearest vulnerability.','The no-signal share: evidence still to be assembled.'],links:['O4','R9','R10'],m:[],read:'Figures follow the lens and filters. Dal share of NS credentials uses 2024 credentials in stronger-signal fields, counting each program type and CIP code once.',live:()=>''},
 lmshift:{h:'Is the portfolio moving toward demand?',tell:'Compares where students were in 2021-22 with where they are now, by labour-market group. Growth concentrated in the stronger groups is evidence the portfolio is already responding to labour-market need; growth in weaker or no-signal groups is a vulnerability.',look:['Which group gained most students in absolute terms.','Whether the no-signal group is shrinking or growing.','Switch lens to COPS: shortage-aligned growth is a sharper test.'],links:['O4'],m:[],read:'Hollow dot: 2021-22. Solid dot: 2024-25. Label: change in students and per cent.',live:()=>''},
 lmcost:{h:'Alignment has a price',tell:'Shows the instructional contribution of each labour-market group. The strongest-demand fields at Dalhousie are largely health and professional programs with high delivery cost and clinical revenue outside the model, so they often show the weakest contribution. The finding is not that these programs are inefficient: it is that labour-market priorities need funding beyond tuition.',look:['Whether contribution per CHP falls as labour-market strength rises.','Total contribution of the strongest group against its growth on the left.'],links:['R8'],m:['M4','M5','M6'],read:'Bars: contribution per credit hour (blue positive, red negative). Right: per-CHP figure, total contribution and tuition coverage.',live:()=>''},
 lmsupply:{h:'Where supply moves against the signal',tell:'The program-level view. Left of the line in the stronger rows (shaded) is the main vulnerability: programs feeding occupations with good prospects or shortages are losing students. Right of the line in the weaker row is the watch zone: growth where labour-market evidence is weak. Colour adds the economics: a red dot in the shaded zone is both under-supplying demand and costly to fix.',look:['Large dots in the shaded zones.','Blue dots in the strongest row right of the line: expand candidates.','The no-signal row: decide whether to build the evidence or accept the risk.'],links:['R9','O4','O3'],m:['M2','M5'],read:'Rows: labour-market groups. X: enrolment CAGR. Size: bubble-size setting. Colour: margin line. Counts at left: declining (↓) and growing (↑) programs and students.',live:()=>{ const v=VIS.filter(r=>r.tr!=null&&r.lmg<=1&&r.tr*100<P.grow); return `<b>${v.length}</b> stronger-signal programs are declining (${fN(sum(v,r=>r.e24))} students).`; }},
 lmpipe:{h:'The shortage pipeline',tell:'Lists every program linked to an occupation with a COPS shortage risk, with its supply trend, provincial position and economics. Flags turn it into a work list: falling supply (vulnerability), sole NS provider (strategic responsibility), expand candidates (opportunity) and costly to grow (needs funding).',look:['"Supply falling" with "Sole NS provider": no other NS institution fills the gap.','"Expand candidate": growing and at or above the margin line.','Arts programs flagged shortage: check the occupation mapping (L1).'],links:['R8','R9','O2'],m:['M5'],read:'Use the flag buttons to filter. Violet chips are costing-method caveats.',live:()=>''},
 lmfac:{h:'Which faculties carry the labour-market case?',tell:'Shows how each faculty\'s students divide across labour-market groups. Faculties with large no-signal shares have the most evidence to build; faculties gaining stronger-signal students are carrying the portfolio\'s alignment story.',look:['Faculties dominated by grey (no signal).','Negative figures at the right: shrinking stronger-signal enrolment.'],links:['O4','R10'],m:[],read:'Bars: share of students by group. Right: change in stronger-signal students since 2021-22.',live:()=>''},
 lmcons:{h:'Is the evidence consistent?',tell:'The LMA signal is an institutional composite. This matrix sets it against the two raw sources a reviewer can check independently. Cells where a good outlook or a shortage flag sits beside LMA 0 or 3 need an explanation; so do strong LMA signals in cells with a moderate outlook and no COPS signal.',look:['Grey (LMA 0) in the top-left cells.','Large programs listed under the table.'],links:['R10'],m:[],read:'Cell shade: students. Mini-bar: spread of LMA signals in the cell.',live:()=>''},
 lmread:{h:'Limits of the labour-market evidence',tell:'States what the signals can and cannot carry, so labour-market findings are presented with the right confidence and are not over-read in either direction.',look:['L1 and L3 before citing a shortage flag for a general degree.'],links:['R10'],m:[],read:'Each card is one limitation.',live:()=>''}
});
Object.assign(CHART,{lmmix:'Quadrant mix by labour market',lmkpi:'Labour-market KPIs',lmshift:'Enrolment shift by signal',lmcost:'Cost of alignment',lmsupply:'Supply response',lmpipe:'Shortage pipeline',lmfac:'Faculty labour-market profile',lmcons:'Signal consistency',lmread:'Reading the signals'});

initControls(); render();
