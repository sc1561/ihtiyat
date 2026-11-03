(function(root){
// Min-cost maximum flow: cover as many lessons as possible, then balance load.
function solve(tasks,teachers,day,absent,pool,history,cap=2,locked=[],referenceDate="",forbidden=new Set()){
 const staff=new Map(teachers.map(t=>[t.id,t])),poolSet=new Set(pool),absentSet=new Set(absent),used=new Set(),counts={},result=[];
 const jobsByKey=new Map(tasks.map(t=>[t.key,t]));
 for(const a of locked){const job=jobsByKey.get(a.key),t=staff.get(a.cover);if(!job)continue;
  if(a.cover&&(!t||absentSet.has(t.id)||t.schedule[day][job.period]||used.has(t.id+':'+job.period)||!canAssign(t,day,job.period,result,cap,history,referenceDate)))continue;
  result.push({...job,cover:a.cover||'',locked:true,manual:!!a.manual});jobsByKey.delete(a.key);
  if(a.cover){used.add(t.id+':'+job.period);counts[t.id]=(counts[t.id]||0)+1}
 }
 const jobs=[...jobsByKey.values()].sort((a,b)=>a.period-b.period||a.key.localeCompare(b.key)), candidates=teachers.filter(t=>poolSet.has(t.id)&&!absentSet.has(t.id));
 const graph=[];function node(){graph.push([]);return graph.length-1}const source=node(),sink=node();
 function edge(a,b,capacity,cost){const f={to:b,rev:graph[b].length,capacity,cost},r={to:a,rev:graph[a].length,capacity:0,cost:-cost};graph[a].push(f);graph[b].push(r);return f}
 const teacherNodes=new Map(),periodNodes=new Map();
 for(const t of candidates){const tn=node();teacherNodes.set(t.id,tn);for(let k=counts[t.id]||0;k<dailyLimit(t,cap,history,referenceDate);k++)edge(tn,sink,1,k*25);}
 const choices=[];
 for(const job of jobs){const jn=node();edge(source,jn,1,0);const options=[];
  for(const t of candidates){const key=t.id+':'+job.period;if(forbidden.has(t.id+':'+job.key)||!canAssign(t,day,job.period,result,cap,history,referenceDate))continue;
   let pn=periodNodes.get(key);if(pn===undefined){pn=node();periodNodes.set(key,pn);edge(pn,teacherNodes.get(t.id),1,0)}
   const prior=history.reduce((n,h)=>n+h.assignments.filter(a=>a.cover===t.id).length,0),daily=t.schedule[day].filter(Boolean).length;
   const adjacent=[job.period-1,job.period+1].filter(p=>p>=0&&p<8&&t.schedule[day][p]).length;
   const cost=Math.round((t.load*2+prior*6+daily*3+adjacent*18)*100)+Math.max(0,pool.indexOf(t.id));
   // Per-assignment marginal cost is scaled to the same unit as base cost.
   options.push({teacher:t.id,edge:edge(jn,pn,1,cost)});
  }choices.push({job,options});
 }
 // Scale marginal teacher edges after graph creation, including reverse costs.
 for(const tn of teacherNodes.values())for(const e of graph[tn])if(e.to===sink){e.cost*=100;graph[sink][e.rev].cost=-e.cost}
 while(true){const n=graph.length,dist=Array(n).fill(Infinity),prev=Array(n),inq=Array(n).fill(false),queue=[source];dist[source]=0;inq[source]=true;
  for(let head=0;head<queue.length;head++){const u=queue[head];inq[u]=false;for(let i=0;i<graph[u].length;i++){const e=graph[u][i];if(e.capacity>0&&dist[e.to]>dist[u]+e.cost){dist[e.to]=dist[u]+e.cost;prev[e.to]=[u,i];if(!inq[e.to]){queue.push(e.to);inq[e.to]=true}}}}
  if(!Number.isFinite(dist[sink]))break;
  for(let v=sink;v!==source;){const [u,i]=prev[v],e=graph[u][i];e.capacity--;graph[v][e.rev].capacity++;v=u;}
 }
 for(const {job,options} of choices){const chosen=options.find(o=>o.edge.capacity===0);result.push({...job,cover:chosen?.teacher||'',locked:false,manual:false})}
 return result.sort((a,b)=>a.period-b.period||a.key.localeCompare(b.key));
}
function weekCount(t,history,referenceDate){
 if(!referenceDate)return 0;
 const start=new Date(referenceDate+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-start.getUTCDay());const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);
 return history.filter(h=>h.date!==referenceDate&&new Date(h.date+'T12:00:00Z')>=start&&new Date(h.date+'T12:00:00Z')<end).reduce((n,h)=>n+h.assignments.filter(a=>a.cover===t.id).length,0);
}
function dailyLimit(t,cap,history=[],referenceDate=''){
 return t.role==='admin'?Math.max(0,Math.min(cap,t.maxDaily??1,(t.maxWeekly??3)-weekCount(t,history,referenceDate))):cap;
}
function runAt(t,day,period,assignments){
 const busy=Array.from({length:8},(_,p)=>!!t.schedule[day][p]||p===period||assignments.some(a=>a.cover===t.id&&a.period===p));
 let left=period,right=period;while(left>0&&busy[left-1])left--;while(right<7&&busy[right+1])right++;
 return right-left+1;
}
function canAssign(t,day,period,assignments,cap=2,history=[],referenceDate=''){
 return !t.schedule[day]?.[period]&&(t.role!=='admin'||(t.active!==false&&t.availability?.[day]?.[period]===true))&&!assignments.some(a=>a.cover===t.id&&a.period===period)&&assignments.filter(a=>a.cover===t.id).length<dailyLimit(t,cap,history,referenceDate)&&runAt(t,day,period,assignments)<=3;
}
function violation(result,teachers,day){
 for(const t of teachers)for(const a of result.filter(a=>a.cover===t.id))if(runAt(t,day,a.period,result)>3){
  let l=a.period,r=a.period;const busy=p=>!!t.schedule[day][p]||result.some(b=>b.cover===t.id&&b.period===p);
  while(l>0&&busy(l-1))l--;while(r<7&&busy(r+1))r++;
  return result.filter(b=>b.cover===t.id&&b.period>=l&&b.period<=r&&!b.locked);
 }return null;
}
function allocate(tasks,teachers,day,absent,pool,history,cap=2,locked=[],referenceDate=''){
 // Branch over conflicting assignment combinations. Every returned result respects rest constraints.
 const pending=[new Set()],seen=new Set();let best=null,bestCount=-1;
 for(let attempt=0;pending.length&&attempt<400;attempt++){
  const ban=pending.pop(),signature=[...ban].sort().join('|');if(seen.has(signature))continue;seen.add(signature);
  const result=solve(tasks,teachers,day,absent,pool,history,cap,locked,referenceDate,ban),count=result.filter(a=>a.cover).length;
  if(count<=bestCount)continue;
  const conflict=violation(result,teachers,day);
  if(!conflict){best=result;bestCount=count;if(count===tasks.length)return best;continue;}
  // Retain a safe fallback while exploring alternatives that preserve coverage.
  const safe=[];for(const a of [...result].sort((a,b)=>Number(b.locked)-Number(a.locked)||a.period-b.period)){
   const t=teachers.find(t=>t.id===a.cover);safe.push(t&&!canAssign(t,day,a.period,safe,cap,history,referenceDate)?{...a,cover:'',locked:false}:a);
  }
  const safeCount=safe.filter(a=>a.cover).length;if(safeCount>bestCount){best=safe;bestCount=safeCount;}
  for(const a of conflict){const next=new Set(ban);next.add(a.cover+':'+a.key);pending.push(next);}
 }
 return (best||tasks.map(a=>({...a,cover:'',locked:false}))).sort((a,b)=>a.period-b.period||a.key.localeCompare(b.key));
}
root.Ihtiyat={allocate,canAssign,runAt,dailyLimit};if(typeof module!=='undefined')module.exports={allocate,canAssign,runAt,dailyLimit};
})(typeof window!=='undefined'?window:globalThis);

