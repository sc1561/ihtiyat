(function(root){
// Min-cost maximum flow: cover as many lessons as possible, then balance load.
function allocate(tasks,teachers,day,absent,pool,history,cap=2,locked=[]){
 const staff=new Map(teachers.map(t=>[t.id,t])),poolSet=new Set(pool),absentSet=new Set(absent),used=new Set(),counts={},result=[];
 const jobsByKey=new Map(tasks.map(t=>[t.key,t]));
 for(const a of locked){const job=jobsByKey.get(a.key),t=staff.get(a.cover);if(!job)continue;
  if(a.cover&&(!t||absentSet.has(t.id)||t.schedule[day][job.period]||used.has(t.id+':'+job.period)||(counts[t.id]||0)>=cap))continue;
  result.push({...job,cover:a.cover||'',locked:true,manual:!!a.manual});jobsByKey.delete(a.key);
  if(a.cover){used.add(t.id+':'+job.period);counts[t.id]=(counts[t.id]||0)+1}
 }
 const jobs=[...jobsByKey.values()].sort((a,b)=>a.period-b.period||a.key.localeCompare(b.key)), candidates=teachers.filter(t=>poolSet.has(t.id)&&!absentSet.has(t.id));
 const graph=[];function node(){graph.push([]);return graph.length-1}const source=node(),sink=node();
 function edge(a,b,capacity,cost){const f={to:b,rev:graph[b].length,capacity,cost},r={to:a,rev:graph[a].length,capacity:0,cost:-cost};graph[a].push(f);graph[b].push(r);return f}
 const teacherNodes=new Map(),periodNodes=new Map();
 for(const t of candidates){const tn=node();teacherNodes.set(t.id,tn);for(let k=counts[t.id]||0;k<cap;k++)edge(tn,sink,1,k*25);}
 const choices=[];
 for(const job of jobs){const jn=node();edge(source,jn,1,0);const options=[];
  for(const t of candidates){const key=t.id+':'+job.period;if(t.schedule[day][job.period]||used.has(key)||(counts[t.id]||0)>=cap)continue;
   let pn=periodNodes.get(key);if(pn===undefined){pn=node();periodNodes.set(key,pn);edge(pn,teacherNodes.get(t.id),1,0)}
   const prior=history.reduce((n,h)=>n+h.assignments.filter(a=>a.cover===t.id).length,0),daily=t.schedule[day].filter(Boolean).length;
   const adjacent=[job.period-1,job.period+1].filter(p=>p>=0&&p<8&&t.schedule[day][p]).length;
   const cost=Math.round((t.load*2+prior*6+daily*3+adjacent*2)*100)+Math.max(0,pool.indexOf(t.id));
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
root.Ihtiyat={allocate};if(typeof module!=='undefined')module.exports={allocate};
})(typeof window!=='undefined'?window:globalThis);
