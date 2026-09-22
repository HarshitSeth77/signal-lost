const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('expired room returns to terminal; temporary disconnect keeps retrying',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'public/app.js'),'utf8');
 const match=source.match(/function connect\(\)\{[\s\S]*?\nfunction exit/);
 assert.ok(match);
 let exits=0,renders=0;const messages=[];
 const context={stream:null,app:{},session:{room:'ABCD',token:'invalid'},document:{querySelector:()=>({})},encodeURIComponent,connected:false,state:{},exit:()=>{exits++;},render:()=>{renders++;},toast:s=>messages.push(s),EventSource:class{static CLOSED=2;constructor(){this.readyState=0;}close(){}}};
 vm.createContext(context);vm.runInContext(match[0].replace(/\nfunction exit$/,''),context);context.connect();context.stream.onerror();assert.equal(exits,0);assert.equal(renders,1);assert.match(messages.at(-1),/Reconnecting/);context.stream.readyState=2;context.stream.onerror();assert.equal(exits,1);assert.match(messages.at(-1),/no longer available/);
});
