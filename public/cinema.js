// Visual presentation stays independent of authoritative multiplayer state.
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const mainSurface=document.querySelector('#app');
const footer=document.createElement('footer');
footer.className='credits';
footer.innerHTML='<a href="/" class="footer-brand">SIGNAL<span>/</span>LOST</a><span>Created by <strong>Harshit Seth</strong><br>© 2026 Harshit Seth. All rights reserved.</span><span class="footer-end">BUILT FOR YOUR CREW <span aria-hidden="true">✦</span></span>';
mainSurface.after(footer);
let previousHull=null,previousSolved=null,previousStage='';
function decorate(){
 const hero=mainSurface.querySelector('.hero');
 if(hero&&!hero.querySelector('.hero-art')){
  document.body.dataset.scene='home';
  hero.insertAdjacentHTML('afterbegin','<div class="hero-art"><img src="/space-art.png" alt="Exploration ship orbiting a copper planet with glowing cyan engines" fetchpriority="high"><div class="art-vignette"></div><div class="telemetry"><span>VESSEL / ODYSSEY-07</span><span class="signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div><div class="art-caption"><span>SECTOR 07 · OUTER RIM</span><span>CONNECTION UNSTABLE</span></div></div>');
  hero.querySelector('h1').innerHTML='SIGNAL<span class="title-lost">/ LOST<span class="title-dot">.</span></span>';
  hero.querySelector('h1').classList.add('game-title');
  hero.querySelector('.pill').textContent='● A MULTIPLAYER DISTRESS CALL';
  hero.querySelector('p').innerHTML='<strong>Lost in space. Found by your crew.</strong><br>Different screens. Incomplete instructions. One ship to save. Can you make it home together?';
  const join=mainSurface.querySelector('.join-card');
  join.insertAdjacentHTML('afterbegin','<div class="terminal-decoration" aria-hidden="true"><span></span><span></span><span></span><b>CREW ACCESS / 001</b></div>');
  previousHull=null;previousSolved=null;previousStage='';
 }
 const head=mainSurface.querySelector('.room-head');
 if(head&&!mainSurface.querySelector('.mission-track')){
  document.body.dataset.scene='mission';
  const stage=typeof state!=='undefined'&&state?state:null;
  const current=stage?.round||0;
  head.insertAdjacentHTML('afterend',`<div class="mission-track" aria-label="Mission progress">${['DEPARTURE','RELAY','DEEP SPACE','DARK ZONE','HOME STRETCH'].map((label,i)=>`<div class="track-step ${current>i+1?'complete':current===i+1?'active':''}"><span>${current>i+1?'✓':String(i+1).padStart(2,'0')}</span><small>${label}</small></div>`).join('')}</div>`);
  if(stage?.phase==='lobby')mainSurface.querySelector('.grid>section:last-child')?.insertAdjacentHTML('afterbegin','<div class="briefing-art"><img src="/space-art.png" alt="Your spacecraft above a distant planet"><span>YOUR SHIP. YOUR PEOPLE.</span></div>');
  if(stage){
   const phaseKey=stage.phase+':'+stage.round;
   if(previousStage&&previousStage!==phaseKey&&!reducedMotion.matches)window.scrollTo({top:0,behavior:'smooth'});
   if(previousHull!==null&&stage.health<previousHull)pulse('damage-flash');
   else if(previousSolved!==null&&stage.solved>previousSolved)pulse('success-flash');
   previousHull=stage.health;previousSolved=stage.solved;previousStage=phaseKey;
   if(stage.phase==='finished')mainSurface.querySelector('.result')?.classList.add(stage.result==='rescued'?'victory':'defeat');
  }
 }
}
function pulse(className){document.body.classList.remove(className);requestAnimationFrame(()=>{document.body.classList.add(className);setTimeout(()=>document.body.classList.remove(className),650);});}
new MutationObserver(decorate).observe(mainSurface,{childList:true});
decorate();
document.addEventListener('pointermove',e=>{if(reducedMotion.matches||e.pointerType==='touch')return;const card=e.target.closest('.card');if(!card)return;const box=card.getBoundingClientRect();card.style.setProperty('--pointer-x',(e.clientX-box.left)+'px');card.style.setProperty('--pointer-y',(e.clientY-box.top)+'px');},{passive:true});
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.disabled||reducedMotion.matches)return;const dot=document.createElement('span');dot.className='click-wave';dot.setAttribute('aria-hidden','true');const box=button.getBoundingClientRect();dot.style.left=(e.clientX?e.clientX-box.left:box.width/2)+'px';dot.style.top=(e.clientY?e.clientY-box.top:box.height/2)+'px';button.appendChild(dot);setTimeout(()=>dot.remove(),600);});
