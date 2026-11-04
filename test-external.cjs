const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const engine=require('./engine'),source=require('./teachers.json');assert.equal(engine.allocateWithFallback,undefined,'no two-stage allocation');const nodes=new Map(),el=s=>{if(!nodes.has(s))nodes.set(s,{value:'',checked:false,innerHTML:'',style:{},dataset:{},classList:{toggle(){}},querySelectorAll:()=>[]});return nodes.get(s)};let calls=0,lastPool=[];const c={console,document:{querySelector:el,querySelectorAll:()=>[]},localStorage:{setItem(){}},setTimeout(){},Intl,Date,Ihtiyat:{...engine,allocate(...args){calls++;lastPool=args[4];return engine.allocate(...args)}}};vm.createContext(c);vm.runInContext(fs.readFileSync('app.js','utf8').replace('}}init();','}}'),c);c.source=source;vm.runInContext('db={teachers:source,groups:baseGroups,history:[],comp:[],cap:2,fallbackRevision:1};',c);
for(let d=0;d<5;d++){
 el('#date').value='2026-11-0'+(1+d);vm.runInContext('showExternal=false;showExternalTeachers=false;draft=[];absent=[];renderToday()',c);
 assert(el('#content').innerHTML.includes('id="external"'));let pool=vm.runInContext('activePool()',c);assert(!pool.some(id=>source.find(t=>t.id===id)?.role==='admin'));
 el('#external').checked=true;el('#external').onchange();assert(!el('#content').innerHTML.includes('id="externalStaff"'));assert.equal(calls,d*2,'toggle must not distribute automatically');
 const period=source.find(t=>t.id==='46').schedule[d].findIndex(v=>!v);c.period=period;let opts=vm.runInContext('validOptions({key:"test",period},showExternal)',c);assert(!opts.some(t=>t.name==='أحمد العامري'));assert(opts.some(t=>t.name==='ناصر الكندي'));
 vm.runInContext('absent=["1"]',c);el('#distribute').onclick();assert(!lastPool.includes('admin-ahmed-alamri'));assert(lastPool.includes('46'));assert(source.every(t=>t.role==='admin'||vm.runInContext('dayPool()',c).includes(t.id)||!lastPool.includes(t.id)));assert.equal(calls,d*2+1);
 vm.runInContext('draft=[];absent=[]',c);const busy=source.find(t=>t.id==='46').schedule[d].findIndex(Boolean);if(busy>=0){c.period=busy;assert(!vm.runInContext('validOptions({key:"test",period},showExternal)',c).some(t=>t.id==='46'));}
 el('#external').checked=false;el('#external').onchange();assert(!vm.runInContext('validOptions({key:"test",period:0},showExternal)',c).some(t=>t.role==='admin'));
 vm.runInContext('absent=["1"]',c);el('#distribute').onclick();assert(!lastPool.includes('admin-ahmed-alamri'));assert.equal(calls,(d+1)*2);
}
vm.runInContext('db.teachers.find(t=>t.id==="46").fallbackOnly=true;enableSeedFallbacks(db,source)',c);assert(!source.find(t=>t.id==='46').fallbackOnly);
console.log('PASS: checkbox visible before distribution; named collaborators available on five days; no automatic distribution on toggle; one allocator call per click; unchecked excludes admins; checked includes them; Ali busy lessons excluded; legacy flags cleared.');

el('#date').value='2026-11-04';vm.runInContext('showExternal=false;showExternalTeachers=false;draft=[];absent=[];renderToday()',c);
el('#externalTeachers').checked=true;el('#externalTeachers').onchange();
let teacherPool=vm.runInContext('activePool()',c);assert(teacherPool.includes('0'));assert(!teacherPool.includes('46'));
el('#external').checked=true;el('#external').onchange();assert(vm.runInContext('activePool()',c).includes('46'));assert(vm.runInContext('activePool()',c).includes('0'));
el('#externalTeachers').checked=false;el('#externalTeachers').onchange();assert(!vm.runInContext('activePool()',c).includes('0'));assert(vm.runInContext('activePool()',c).includes('46'));
const [regular,outside]=['10','0'].map(id=>source.find(t=>t.id===id));const period=Array.from({length:8},(_,p)=>p).find(p=>[regular,outside].every(t=>engine.canAssign(t,3,p,[])));assert(period!==undefined);const job={key:'check',period};assert.equal(engine.allocate([job],[regular,outside],3,[],['10','0'],[],2,[],'2026-11-04',['10'])[0].cover,'10');
console.log('PASS: independent switches, all combinations, and regular-group priority.');
