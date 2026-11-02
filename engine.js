(function(root){
function allocate(tasks,teachers,day,absent,pool,history,cap=2,locked=[]){
 const counts={},used=new Set(),result=[];for(const a of locked){result.push({...a});if(a.cover){counts[a.cover]=(counts[a.cover]||0)+1;used.add(a.cover+':'+a.period)}}
 const jobs=tasks.filter(t=>!locked.some(l=>l.key===t.key));
 const available=t=>teachers.filter(x=>pool.includes(x.id)&&!absent.includes(x.id)&&!x.schedule[day][t.period]&&!used.has(x.id+':'+t.period)&&(counts[x.id]||0)<cap);
 // Most constrained slots first; choose the teacher with the least future scarcity and total weighted load.
 while(jobs.length){jobs.sort((a,b)=>available(a).length-available(b).length||a.period-b.period);const t=jobs.shift();const options=available(t).sort((a,b)=>score(a,t)-score(b,t)||pool.indexOf(a.id)-pool.indexOf(b.id));
 function score(x,t){const prior=history.reduce((n,h)=>n+h.assignments.filter(a=>a.cover===x.id).length,0);const today=x.schedule[day].filter(Boolean).length;const scarce=jobs.filter(j=>j.period!==t.period&&!x.schedule[day][j.period]&&available(j).length<=2).length;return x.load+prior*3+(counts[x.id]||0)*14+today*1.5+scarce*2}
 const x=options[0];if(x){counts[x.id]=(counts[x.id]||0)+1;used.add(x.id+':'+t.period)}result.push({...t,cover:x?.id||'',locked:false});
 }return result.sort((a,b)=>a.period-b.period||a.key.localeCompare(b.key));
}
root.Ihtiyat={allocate};if(typeof module!=='undefined')module.exports={allocate};
})(typeof window!=='undefined'?window:globalThis);
