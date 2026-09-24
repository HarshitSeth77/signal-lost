const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const accountStore=path.join(os.tmpdir(),`signal-lost-accounts-${process.pid}.json`);
process.env.ACCOUNT_STORE=accountStore;
const {createServer}=require('./server-v2');

test('Echo Loop: multiplayer levels, themes, tokens, hints, voice signaling and replay',async()=>{
  const server=createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,controllers=[];
  const api=async(action,body)=>{const response=await fetch(base+'/api/'+action,{method:'POST',body:JSON.stringify(body)});return {status:response.status,data:await response.json()}};
  async function events(session){
    const controller=new AbortController();controllers.push(controller);
    const response=await fetch(`${base}/events?room=${session.room}&token=${session.token}`,{signal:controller.signal});
    const peer={state:null,signals:[]};
    (async()=>{try{let buffer='';for await(const chunk of response.body){buffer+=new TextDecoder().decode(chunk);let end;while((end=buffer.indexOf('\n\n'))>=0){const message=buffer.slice(0,end);buffer=buffer.slice(end+2);const data=message.split('\n').find(x=>x.startsWith('data: '));if(!data)continue;const parsed=JSON.parse(data.slice(6));if(message.startsWith('event: signal'))peer.signals.push(parsed);else peer.state=parsed}}}catch{}})();
    return peer;
  }
  async function wait(check){for(let i=0;i<400;i++){if(check())return;await new Promise(r=>setTimeout(r,10))}throw Error('state timeout')}
  function solution(task,clue){
    if(task.puzzle.type==='sequence'){const answer=clue.replace('Chronology: ','').split(' → ');return answer.map(event=>task.puzzle.options.indexOf(event))}
    if(task.puzzle.type==='power')return [...clue.matchAll(/(\d+)/g)].map(x=>Number(x[1]));
    if(task.puzzle.type==='route')return clue.replace('Safe route: ','').split(' → ');
    if(task.puzzle.type==='cipher')return clue.replace('Echo cipher: ','').split(' → ');
    return [clue.replace('Final directive: ','')];
  }
  function path(from,to,escape){
    const key=p=>p.join(','),blocked=new Set(escape.walls.map(key)),queue=[[from,[]]],seen=new Set([key(from)]);
    while(queue.length){const [p,moves]=queue.shift();if(key(p)===key(to))return moves;for(const move of [[0,-1],[0,1],[-1,0],[1,0]]){const next=[p[0]+move[0],p[1]+move[1]],k=key(next);if(next[0]>=0&&next[1]>=0&&next[0]<escape.cols&&next[1]<escape.rows&&!blocked.has(k)&&!seen.has(k)){seen.add(k);queue.push([next,[...moves,move]])}}}
    throw Error('maze path missing');
  }
  try{
    const signup=await api('signup',{username:'nova_pilot',password:'echo123'});assert.equal(signup.status,200);assert.match(signup.data.pilotId,/^SL-[A-F0-9]{8}$/);
    const duplicate=await api('signup',{username:'NOVA_PILOT',password:'echo123'});assert.equal(duplicate.status,409);assert.equal(duplicate.data.code,'USERNAME_TAKEN');assert.equal(duplicate.data.suggestions.length,2);assert.notEqual(duplicate.data.suggestions[0],duplicate.data.suggestions[1]);assert.equal(fs.existsSync(accountStore),true);
    assert.equal((await api('login',{username:'nova_pilot',password:'wrong12'})).status,401);
    const login=await api('login',{username:'NOVA_PILOT',password:'echo123'});assert.equal(login.status,200);
    const a=(await api('create',{name:'Nova',accountToken:login.data.accountToken})).data,b=(await api('join',{name:'Echo',room:a.room})).data;
    const pa=await events(a),pb=await events(b);await wait(()=>pa.state&&pb.state);
    assert.equal(pa.state.tokens,20);assert.equal(pa.state.account,'nova_pilot');assert.equal(pa.state.tokenVault,100000000);
    await api('theme',{...a,value:'violet'});await wait(()=>pb.state.theme==='violet');
    await api('difficulty',{...a,value:'void'});await wait(()=>pb.state.difficulty==='void');
    await api('checkout',a);await wait(()=>pa.state.tokens===120);assert.equal(pa.state.tokenVault,99999900);
    await api('voice',{...a,value:true});await wait(()=>pb.state.players.find(x=>x.id===pb.state.host).voice);
    await api('signal',{...a,target:pb.state.you,data:{description:{type:'offer',sdp:'test'}}});await wait(()=>pb.signals.length===1);
    await api('tutorial',a);assert.equal((await api('tutorialStep',b)).status,400);
    for(let i=0;i<3;i++)await api('tutorialStep',a);await wait(()=>pa.state.phase==='lobby');
    await api('ready',a);await api('ready',b);await api('start',a);await wait(()=>pa.state.phase==='playing');
    const levelTypes=[];
    async function stage(number){await wait(()=>pa.state.phase==='playing'&&pb.state.phase==='playing'&&pa.state.loop===number&&pb.state.loop===number);levelTypes.push(pa.state.task.puzzle.type)}
    async function solvePair(){for(const [self,other,session] of [[pa,pb,a],[pb,pa,b]]){const task=self.state.task,clue=other.state.intel[0].text;assert.equal((await api('solve',{...session,task:task.id,value:solution(task,clue)})).status,200)}await wait(()=>pa.state.phase!=='playing')}
    async function next(){assert.equal((await api('rewind',a)).status,200)}
    await stage(1);await api('hint',a);await wait(()=>pa.state.task.puzzle.hint);assert.equal(pa.state.tokens,110);await solvePair();await next();
    await stage(2);assert.equal(pa.state.mini.isDriver,true);assert.equal(pb.state.mini.isDriver,false);for(const [dx,dy] of path(pa.state.mini.position,pa.state.mini.exit,pb.state.mini))assert.equal((await api('mini-move',{...a,dx,dy})).status,200);await wait(()=>pa.state.phase!=='playing');await next();
    await stage(3);await solvePair();await next();
    await stage(4);assert.equal((await api('split-pulse',a)).status,200);assert.equal((await api('split-pulse',b)).status,200);await wait(()=>pa.state.phase!=='playing');await next();
    await stage(5);assert.equal((await api('transmit',{...a,value:pa.state.mini.privateCode})).status,200);assert.equal((await api('transmit',{...b,value:pb.state.mini.privateCode})).status,200);await wait(()=>pa.state.mini.phase==='vote');const corrupted=pa.state.mini.isCorrupted?pa.state.you:pb.state.you;assert.equal((await api('vote',{...a,target:corrupted})).status,200);assert.equal((await api('vote',{...b,target:corrupted})).status,200);await wait(()=>pa.state.phase!=='playing');await next();
    await stage(6);await solvePair();await next();
    await stage(7);for(const [peer,session] of [[pa,a],[pb,b]]){const hunt={...peer.state.mini,walls:[...peer.state.mini.walls,[4,2]]};for(const [dx,dy] of path(peer.state.mini.players.find(x=>x.id===peer.state.you).pos,peer.state.mini.exit,hunt))assert.equal((await api('mini-move',{...session,dx,dy})).status,200)}await wait(()=>pa.state.phase!=='playing');await next();
    assert.deepEqual(levelTypes,['sequence','blind','cipher','split','impostor','decision','soundhunt']);
    await stage(8);
    await api('checkout',b);assert.equal((await api('select-costume',{...a,value:'neon'})).status,200);assert.equal((await api('select-costume',{...b,value:'void'})).status,200);await wait(()=>pa.state.escape.customizeUntil<=pa.state.serverTime);
    assert.equal(pa.state.escape.players.find(x=>x.id===pa.state.you).costume,'neon');assert.equal(pb.state.escape.players.find(x=>x.id===pb.state.you).costume,'void');
    assert.equal(pa.state.tokens,95);assert.equal(pb.state.tokens,95);
    const rendezvous=[4,3];
    for(const [peer,session] of [[pa,a],[pb,b]])for(const [dx,dy] of path(peer.state.escape.players.find(x=>x.id===peer.state.you).pos,rendezvous,peer.state.escape)){await api('move',{...session,dx,dy});await new Promise(r=>setTimeout(r,6))}
    await wait(()=>pa.state.escape.unlocked);
    for(const [peer,session] of [[pa,a],[pb,b]])for(const [dx,dy] of path(peer.state.escape.players.find(x=>x.id===peer.state.you).pos,peer.state.escape.exit,peer.state.escape)){await api('move',{...session,dx,dy});await new Promise(r=>setTimeout(r,6))}
    await wait(()=>pa.state.phase==='finished');assert.equal(pa.state.result,'escaped');assert.equal(pa.state.discoveries.length,8);assert.equal(pa.state.maxLoops,8);
    await api('replay',a);await wait(()=>pb.state.phase==='lobby');assert.equal(pb.state.loop,0);
  }finally{
    controllers.forEach(x=>x.abort());server.closeAllConnections();await new Promise(r=>server.close(r));try{fs.unlinkSync(accountStore)}catch{}
  }
});
