export const STORAGE_KEY = 'steven-isc-study-v1';
export const DAY = 86400000;
export function emptyProgress() { return { version:1, records:{}, settings:{sections:['S1','S2','S3','S4'],module:'all',focus:'first',search:''}, session:null }; }
export function record(state,id) { return state.records[id] || {attempts:0,correct:0,misses:0,level:0,due:0,star:false,seen:0,last:0}; }
export function restore(raw, cards) {
  const state=emptyProgress(), ids=new Set(cards.map(c=>c.id));
  if (!raw || raw.version!==1 || typeof raw.records!=='object' || Array.isArray(raw.records)) return state;
  for(const [id,r] of Object.entries(raw.records||{})) {
    if (!ids.has(id)||!r||typeof r!=='object') continue;
    const clean={...record(state,id)};
    for(const k of ['attempts','correct','misses','level','due','seen','last']) clean[k]=Number.isFinite(r[k])?Math.max(0,Math.min(r[k],k==='due'||k==='last'?9e15:1e7)):0;
    clean.level=Math.min(clean.level,4);clean.star=r.star===true; state.records[id]=clean;
  }
  const s=raw.settings;
  if(s && typeof s==='object') {
    if(Array.isArray(s.sections))state.settings.sections=[...new Set(s.sections.filter(v=>['S1','S2','S3','S4'].includes(v)))];
    if(s.module==='all'||cards.some(c=>c.module===s.module))state.settings.module=s.module;
    if(['all','first','memorize','starred','missed','due'].includes(s.focus))state.settings.focus=s.focus;
    if(typeof s.search==='string')state.settings.search=s.search.slice(0,200);
  }
  const ss=raw.session;
  const validEntry=e=>e&&ids.has(e.id)&&[0,1].includes(e.stage)&&Number.isFinite(e.after)&&e.after>=0;
  if(ss && typeof ss==='object' && Array.isArray(ss.queue) && ss.queue.length<=100 && ss.queue.every(validEntry) && (!ss.current||validEntry(ss.current)) && Number.isFinite(ss.turn) && ss.turn>=0 && ss.turn<=100000 && Array.isArray(ss.ids)&&ss.ids.length<=20&&ss.ids.every(id=>ids.has(id)) && Array.isArray(ss.completed)&&ss.completed.every(id=>ss.ids.includes(id))) {
    const entries=[...ss.queue,...(ss.current?[ss.current]:[])];
    const feedback=ss.feedback&&typeof ss.feedback.correct==='boolean'?ss.feedback:null;
    const repeatsCurrent=ss.current&&ss.queue.some(e=>e.id===ss.current.id);
    if(new Set(ss.queue.map(e=>e.id)).size===ss.queue.length && (!repeatsCurrent||feedback) && entries.every(e=>ss.ids.includes(e.id))) {
      state.session={...ss,options:Array.isArray(ss.options)?ss.options.filter(v=>typeof v==='string').slice(0,4):[],feedback:ss.feedback&&typeof ss.feedback.correct==='boolean'?ss.feedback:null,assisted:ss.assisted===true,draft:typeof ss.draft==='string'?ss.draft.slice(0,5000):'',completed:[...new Set(ss.completed)]};
    }
  }
  return state;
}
export function filterCards(cards,state,firstIds,now=Date.now()) {
 const {sections,module,focus,search}=state.settings; const query=search.toLocaleLowerCase().trim();
 return cards.filter(c=>sections.includes(c.section)&&(module==='all'||c.module===module)&&(!query||[c.q,c.a,c.why,c.cue,c.module].join(' ').toLocaleLowerCase().includes(query))).filter(c=>{
 const r=record(state,c.id);
 return focus==='all'||focus==='first'&&firstIds.includes(c.id)||focus==='memorize'&&c.focus||focus==='starred'&&r.star||focus==='missed'&&r.misses>0&&r.level===0||focus==='due'&&r.level>0&&r.due<=now;
 });
}
export function beginSession(pool,state,now=Date.now(),size=10) {
 const rank=c=>{const r=record(state,c.id);return r.level===0&&r.misses>0?0:r.level>0&&r.due<=now?1:r.attempts===0?2:r.level===0?3:4;};
 // Interleave sections for new cards; overdue and missed concepts still come first.
 const groups=['S1','S2','S3','S4'].map(section=>pool.filter(c=>c.section===section));
 const mixed=[];for(let i=0;groups.some(g=>i<g.length);i++)for(const g of groups)if(g[i])mixed.push(g[i]);
 const chosen=mixed.sort((a,b)=>rank(a)-rank(b)||record(state,a.id).last-record(state,b.id).last).slice(0,size);
 return {ids:chosen.map(c=>c.id),queue:chosen.map(c=>({id:c.id,stage:0,after:0})),current:null,turn:0,completed:[],feedback:null,options:[],assisted:false,draft:'',started:now};
}
export function nextQuestion(session) {
 if(session.current)return session.current;
 if(!session.queue.length)return null;
 let i=session.queue.findIndex(e=>e.after<=session.turn);
 if(i<0)i=session.queue.reduce((best,e,j)=>e.after<session.queue[best].after?j:best,0);
 session.current=session.queue.splice(i,1)[0];session.feedback=null;session.options=[];session.assisted=false;session.draft='';return session.current;
}
export function answer(state,correct,now=Date.now()) {
 const s=state.session,e=s?.current;if(!e||s.feedback)return false;
 const r={...record(state,e.id)};r.attempts++;r.last=now;
 if(correct)r.correct++;else {r.misses++;r.level=0;r.due=0;}
 const counted=correct&&!s.assisted;
 if(counted&&e.stage===1) {r.level=Math.min(r.level+1,4);r.due=now+[1,3,7,14][r.level-1]*DAY;s.completed.push(e.id);}
 else s.queue.push({id:e.id,stage:counted?1:0,after:s.turn+3});
 s.turn++;s.feedback={correct,counted,assisted:s.assisted,mastered:counted&&e.stage===1};state.records[e.id]=r;return true;
}
export function advance(session){if(!session.feedback)return;session.current=null;session.feedback=null;nextQuestion(session);}
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function optionsFor(card,cards) {
 const nearby=cards.filter(c=>c.id!==card.id&&c.module===card.module);
 const other=cards.filter(c=>c.id!==card.id&&c.section===card.section&&c.module!==card.module);
 const answers=[...new Set([...shuffle(nearby),...shuffle(other)].map(c=>c.a))].filter(a=>a!==card.a).slice(0,3);
 return shuffle([card.a,...answers]);
}
