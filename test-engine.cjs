const assert=require('node:assert/strict');const {allocate,canAssign,runAt}=require('./engine');const real=require('./teachers.json');
const make=(id,busy=[])=>({id,name:id,load:busy.length,schedule:Array.from({length:5},()=>Array.from({length:8},(_,p)=>busy.includes(p)?'x':null))});
const job=p=>({key:'a:'+p,period:p,absent:'absent',class:'5/1'});
const a=make('a',[0,1,3]);assert.equal(canAssign(a,2,2,[]),false,'bridge four lessons');
const b=make('b');let result=allocate([job(2)],[a,b],2,[],['a','b'],[],2);assert.equal(result[0].cover,'b');
// Two individually valid choices must not combine to produce four consecutive lessons.
const c=make('c',[1,2]);result=allocate([job(0),job(3)],[c],2,[],['c'],[],2);assert.equal(result.filter(x=>x.cover).length,1);
// Search must move one choice to a second teacher and preserve full coverage.
result=allocate([job(0),job(3)],[c,b],2,[],['c','b'],[],2);assert.equal(result.filter(x=>x.cover).length,2);for(const x of result)assert(runAt([c,b].find(t=>t.id===x.cover),2,x.period,result)<=3);
result=allocate([job(0),job(3)],[c],2,[],['c'],[],2,[{...job(0),cover:'c',locked:true}]);assert.equal(result.find(x=>x.period===0).cover,'c');assert.equal(result.find(x=>x.period===3).cover,'');
const admin={...make('admin'),role:'admin',active:true,maxDaily:1,maxWeekly:2,availability:Array.from({length:5},()=>Array(8).fill(false))};admin.availability[2][4]=true;admin.availability[2][5]=true;
result=allocate([job(3),job(4),job(5)],[admin],2,[],['admin'],[],2,[],'2026-11-03');assert.equal(result.filter(x=>x.cover).length,1);assert.equal(result.find(x=>x.period===3).cover,'');
const history=[{date:'2026-11-01',assignments:[{cover:'admin'},{cover:'admin'}]}];assert.equal(allocate([job(4)],[admin],2,[],['admin'],history,2,[],'2026-11-03')[0].cover,'');assert.equal(allocate([job(4)],[admin],2,[],['admin'],history,2,[],'2026-11-10')[0].cover,'admin');admin.active=false;assert(!canAssign(admin,2,4,[]));
// Actual school schedules, including Amer and Salman, across all five days.
for(let d=0;d<5;d++)for(let sample=0;sample<8;sample++){
 const absent=real.filter((_,i)=>(i+sample)%9===0).map(t=>t.id),pool=real.map(t=>t.id),tasks=real.filter(t=>absent.includes(t.id)).flatMap(t=>t.schedule[d].flatMap((v,p)=>v?[{key:t.id+':'+p,period:p,absent:t.id,class:v}]:[]));
 const r=allocate(tasks,real,d,absent,pool,[],2),seen=new Set(),count={};assert.equal(r.length,tasks.length);
 for(const x of r){if(!x.cover)continue;const t=real.find(t=>t.id===x.cover);assert(!absent.includes(t.id));assert(!t.schedule[d][x.period]);assert(!seen.has(t.id+':'+x.period));seen.add(t.id+':'+x.period);count[t.id]=(count[t.id]||0)+1;assert(count[t.id]<=2);assert(runAt(t,d,x.period,r)<=3,t.name+' four consecutive');}
}
console.log('PASS: 40 school scenarios; bridge and combined runs; locked assignments; full coverage alternative; admin availability, daily and weekly limits, week reset and pause.');
