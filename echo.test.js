const {test}=require('node:test');
const assert=require('node:assert/strict');
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
    const signup=await api('signup',{username:'nova_pilot',password:'echo123'});assert.equal(signup.status,200);
    assert.equal((await api('signup',{username:'nova_pilot',password:'echo123'})).status,409);
    assert.equal((await api('login',{username:'nova_pilot',password:'wrong12'})).status,401);
    const login=await api('login',{username:'nova_pilot',password:'echo123'});assert.equal(login.status,200);
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
    for(let loop=1;loop<=3;loop++){
      await wait(()=>pa.state.phase==='playing'&&pb.state.phase==='playing'&&pa.state.loop===loop&&pb.state.loop===loop);
      levelTypes.push(pa.state.task.puzzle.type);
      if(loop===1){await api('hint',a);await wait(()=>pa.state.task.puzzle.hint);assert.equal(pa.state.tokens,110)}
      for(const [self,other,session] of [[pa,pb,a],[pb,pa,b]]){
        const task=self.state.task,clue=other.state.intel[0].text;
        assert.equal((await api('solve',{...session,task:task.id,value:solution(task,clue)})).status,200);
      }
      await wait(()=>pa.state.phase!=='playing');if(loop<3)await api('rewind',a);
    }
    assert.deepEqual(levelTypes,['sequence','cipher','decision']);
    await api('rewind',a);await wait(()=>pa.state.phase==='playing'&&pa.state.loop===4&&pb.state.loop===4);
    await api('checkout',b);await api('costume',{...a,value:'neon'});await api('costume',{...b,value:'void'});await wait(()=>pa.state.escape.customizeUntil<=pa.state.serverTime);
    assert.equal(pa.state.tokens,95);assert.equal(pb.state.tokens,95);
    const rendezvous=[4,3];
    for(const [peer,session] of [[pa,a],[pb,b]])for(const [dx,dy] of path(peer.state.escape.players.find(x=>x.id===peer.state.you).pos,rendezvous,peer.state.escape)){await api('move',{...session,dx,dy});await new Promise(r=>setTimeout(r,6))}
    await wait(()=>pa.state.escape.unlocked);
    for(const [peer,session] of [[pa,a],[pb,b]])for(const [dx,dy] of path(peer.state.escape.players.find(x=>x.id===peer.state.you).pos,peer.state.escape.exit,peer.state.escape)){await api('move',{...session,dx,dy});await new Promise(r=>setTimeout(r,6))}
    await wait(()=>pa.state.phase==='finished');assert.equal(pa.state.result,'escaped');assert.equal(pa.state.discoveries.length,4);
    await api('replay',a);await wait(()=>pb.state.phase==='lobby');assert.equal(pb.state.loop,0);
  }finally{
    controllers.forEach(x=>x.abort());server.closeAllConnections();await new Promise(r=>server.close(r));
  }
});
