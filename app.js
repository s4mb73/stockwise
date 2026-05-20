// Stockwise — single bundle: nav, reveal, FAQ, waitlist form.

// ── Nav toggle ─────────────────────────────────────────
function toggleNav(){const n=document.querySelector('nav');const o=n.classList.toggle('open');n.querySelector('.nav-toggle').setAttribute('aria-expanded',o)}
function closeNav(){const n=document.querySelector('nav');n.classList.remove('open');n.querySelector('.nav-toggle').setAttribute('aria-expanded','false')}

// ── Stagger index: tag children of grids/lists so CSS can compute delays
document.querySelectorAll('.tline, .pp-metrics6, .bento').forEach(parent=>{
  const cls=parent.classList;
  const sel=cls.contains('tline')?'.tstep'
    :cls.contains('bento')?'.bento-tile'
    :'.pp-m';
  parent.querySelectorAll(sel).forEach((child,i)=>child.style.setProperty('--i',i));
});

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Smooth scroll (Lenis from CDN; silently no-ops to native scroll) ──
let lenis=null;
if(window.Lenis && !reduceMotion){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
  const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};
  requestAnimationFrame(raf);
  // Smooth anchor-link jumps (skip bare "#" CTAs — they open the modal)
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    const id=a.getAttribute('href');
    if(id.length<2) return;
    a.addEventListener('click',e=>{
      const target=document.querySelector(id);
      if(target){e.preventDefault();lenis.scrollTo(target,{offset:-72})}
    });
  });
}

// ── Count-up: animate a number to its data-count value when revealed
function fmt(n,el){
  const prefix=el.dataset.prefix||'';
  const suffix=el.dataset.suffix||'';
  const dec=parseInt(el.dataset.decimals||'0',10);
  const num=Number(n);
  let v;
  if(el.dataset.format==='comma'){
    v=num.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  }else{
    v=dec>0?num.toFixed(dec):Math.round(num);
  }
  return prefix+v+suffix;
}
function countUp(el){
  if(el.dataset.cuDone) return;
  el.dataset.cuDone='1';
  const target=parseFloat(el.dataset.count);
  if(reduceMotion||isNaN(target)){el.textContent=fmt(target||0,el);return}
  const dur=1400, start=performance.now();
  const ease=t=>1-Math.pow(1-t,3);
  function tick(now){
    const p=Math.min(1,(now-start)/dur);
    el.textContent=fmt(target*ease(p),el);
    if(p<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Reveal on scroll ───────────────────────────────────
const io=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    e.target.classList.add('in');
    // Trigger count-ups inside (or on) the revealed element
    e.target.querySelectorAll?.('.cu').forEach(countUp);
    if(e.target.classList.contains('cu')) countUp(e.target);
    io.unobserve(e.target);
  });
},{rootMargin:'0px 0px -40px 0px',threshold:.05});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));


// ── FAQ accordion ──────────────────────────────────────
document.querySelectorAll('.fq').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const fi=btn.parentElement;
    const open=fi.classList.toggle('open');
    btn.setAttribute('aria-expanded',open);
  });
});

// ── Waitlist form ──────────────────────────────────────
const FORM_STEPS=5;             // 5 question steps, then success screen
const ans={s1:null,s2:null,s3:null,s4:null};
let cur=1;

function oF(){
  document.getElementById('fo').classList.add('on');
  document.body.style.overflow='hidden';
  if(lenis) lenis.stop();
  // Focus first option for keyboard users
  setTimeout(()=>{
    const first=document.querySelector('#f'+cur+' .fop, #f'+cur+' .fin');
    if(first) first.focus?.();
  },50);
}
function cF(){
  document.getElementById('fo').classList.remove('on');
  document.body.style.overflow='';
  if(lenis) lenis.start();
}

// Select an option in current step
function sO(el){
  const step=el.parentElement.dataset.s;
  el.parentElement.querySelectorAll('.fop').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');
  ans['s'+step]=el.textContent.trim();
  document.getElementById('fnx').disabled=false;
}

function renderDots(){
  for(let i=1;i<=FORM_STEPS;i++){
    const d=document.getElementById('dd'+i);
    if(!d) continue;
    d.classList.remove('ac','dn');
    if(i<cur) d.classList.add('dn');
    else if(i===cur) d.classList.add('ac');
  }
  document.getElementById('fbk').style.display=cur>1?'block':'none';
}

// Steps: f1-f4 are MCQs, f5 is the contact fields step, f6 is the success screen.
function showStep(n){
  for(let i=1;i<=6;i++){
    const el=document.getElementById('f'+i);
    if(el) el.style.display=i===n?'block':'none';
  }
  document.getElementById('fnv').style.display=n===6?'none':'flex';
  cur=n;
  renderDots();
}

function applyValid(){
  const name=document.getElementById('fN').value.trim();
  const email=document.getElementById('fE').value.trim();
  const discord=document.getElementById('fD').value.trim();
  const location=document.getElementById('fL').value.trim();
  return name.length>=2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && discord.length>=2
    && location.length>=2;
}

let contactWired=false;
function wireContactStep(){
  if(contactWired) return; contactWired=true;
  const en=()=>{document.getElementById('fnx').disabled=!applyValid()};
  ['fN','fE','fD','fL'].forEach(id=>document.getElementById(id).addEventListener('input',en));
}

function syncNextBtn(){
  const btn=document.getElementById('fnx');
  if(cur===FORM_STEPS){
    btn.textContent='Submit application';
    btn.disabled=!applyValid();
  }else{
    btn.textContent='Next';
    btn.disabled=!ans['s'+cur];
  }
}

function nx(){
  if(cur===FORM_STEPS) return submitForm();
  showStep(cur+1);
  if(cur===FORM_STEPS) wireContactStep();
  syncNextBtn();
}

function pv(){
  if(cur>1) showStep(cur-1);
  syncNextBtn();
}

async function submitForm(){
  const name=document.getElementById('fN').value.trim();
  const company=document.getElementById('fC').value.trim();
  const email=document.getElementById('fE').value.trim();
  const discord=document.getElementById('fD').value.trim();
  const location=document.getElementById('fL').value.trim();
  const err=document.getElementById('fErr');
  err.style.display='none';

  if(name.length<2){err.textContent='Please enter your name.';err.style.display='block';return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.textContent='Please enter a valid email.';err.style.display='block';return}
  if(discord.length<2){err.textContent='Discord username is required so we can add you to the beta server.';err.style.display='block';return}
  if(location.length<2){err.textContent='Please tell us where your brokerage is registered.';err.style.display='block';return}

  const btn=document.getElementById('fnx');
  btn.disabled=true;
  btn.innerHTML='<span class="fnx-spin" aria-hidden="true"></span>Sending…';

  try{
    const r=await fetch('/api/waitlist',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,company,email,discord,location,s1:ans.s1,s2:ans.s2,s3:ans.s3,s4:ans.s4})
    });
    if(!r.ok){
      const j=await r.json().catch(()=>({}));
      throw new Error(j.error||'Could not submit');
    }
    showStep(FORM_STEPS+1);
  }catch(e){
    err.textContent=e.message;err.style.display='block';
    btn.disabled=false;btn.textContent='Submit application';
  }
}

// Close on Escape
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('fo').classList.contains('on')) cF();
    if(document.querySelector('nav').classList.contains('open')) closeNav();
  }
});

// Init dots
renderDots();

// Footer year
const yr=document.getElementById('yr');
if(yr) yr.textContent=new Date().getFullYear();

// ── Dashboard live ticker: Total sold counter increments after reveal
(function(){
  if(reduceMotion) return;
  const pp=document.querySelector('.pp');
  if(!pp) return;
  const cards=pp.querySelectorAll('.pp-m');
  const card=cards[5]; // "Total sold" is the 6th metric
  if(!card) return;
  const cu=card.querySelector('.cu');
  if(!cu) return;
  let count=parseInt(cu.dataset.count,10)||0;

  function tick(){
    count++;
    cu.dataset.count=count;
    cu.textContent=count.toLocaleString('en-US');
    card.classList.add('is-ticking');
    setTimeout(()=>card.classList.remove('is-ticking'),1100);
  }

  // Pause ticker when dashboard is off-screen; resume when back in view.
  let timer=null;
  function start(){if(!timer){tick();timer=setInterval(tick,7500)}}
  function stop(){if(timer){clearInterval(timer);timer=null}}
  const ppIo=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)start();else stop()});
  },{threshold:.15});

  // Wait for the initial reveal count-up to finish before observing
  (function waitForReveal(){
    if(cu.dataset.cuDone){
      setTimeout(()=>ppIo.observe(pp),1800);
    }else{
      setTimeout(waitForReveal,500);
    }
  })();
})();
