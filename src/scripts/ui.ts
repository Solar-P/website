document.documentElement.classList.add('js');
const header = document.querySelector<HTMLElement>('.header');
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('#main-nav');
if (toggle && nav) {
  toggle.hidden = false;
  const close = () => { toggle.setAttribute('aria-expanded','false'); nav.classList.remove('open'); };
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded',String(open)); nav.classList.toggle('open',open); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click',close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { close(); toggle.focus(); } });
  document.addEventListener('click', event => { if (event.target instanceof Node && !header?.contains(event.target)) close(); });
}
const scrolled = () => header?.classList.toggle('scrolled',scrollY > 24);
scrolled(); addEventListener('scroll',scrolled,{passive:true});
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const track = document.querySelector<HTMLElement>('.project-track');
const controls = document.querySelector<HTMLElement>('.carousel-controls');
const prev = document.querySelector<HTMLButtonElement>('[data-prev]');
const next = document.querySelector<HTMLButtonElement>('[data-next]');
if (track && controls && prev && next) {
  const update = () => { controls.hidden = track.scrollWidth <= track.clientWidth + 2; prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; };
  const move = (direction:number) => { const card = track.querySelector<HTMLElement>('.project-card'); track.scrollBy({left:direction * ((card?.offsetWidth || track.clientWidth) + parseFloat(getComputedStyle(track).gap)),behavior:reduceMotion.matches ? 'instant' : 'smooth'}); };
  prev.addEventListener('click',() => move(-1)); next.addEventListener('click',() => move(1));
  track.addEventListener('keydown',event => { if (event.target !== track) return; if(event.key === 'ArrowRight' || event.key === 'ArrowLeft'){event.preventDefault();move(event.key === 'ArrowRight'?1:-1);} });
  track.addEventListener('scroll',update,{passive:true}); new ResizeObserver(update).observe(track); update();
}
document.querySelector<HTMLAnchorElement>('[data-explore]')?.addEventListener('click', event => {
  if (!track) return;
  event.preventDefault();
  const headerHeight = header?.getBoundingClientRect().height || 88;
  const label = document.querySelector<HTMLElement>('#projects .section-index');
  const top = scrollY + (label || track).getBoundingClientRect().top - headerHeight - 12;
  window.scrollTo({top, behavior: reduceMotion.matches ? 'instant' : 'smooth'});
  history.replaceState(null, '', '#projects');
});
const sectionLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-section]')];
const headingLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-heading]')];
function spy(links:HTMLAnchorElement[],key:'section'|'heading') {
  const targets = links.map(link => document.getElementById(link.dataset[key] || '')).filter((el):el is HTMLElement => !!el);
  if(!targets.length) return;
  const update = () => {
    let current:HTMLElement|undefined;
    for(const target of targets) if(target.getBoundingClientRect().top <= 180) current=target;
    if(innerHeight + scrollY >= document.documentElement.scrollHeight - 8) current=targets.at(-1);
    links.forEach(link => { if(link.dataset[key]===current?.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current'); });
  };
  let queued=false; addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(()=>{update();queued=false;});}},{passive:true}); update();
}
spy(sectionLinks,'section');spy(headingLinks,'heading');
if(!reduceMotion.matches && 'IntersectionObserver' in window){
  const observer = new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('.projects-empty,.project-card,.toolkit-row,.job').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('reveal-ready');observer.observe(el);}});
}
const zoomLinks = document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]');
if(zoomLinks.length){
 const dialog=document.createElement('dialog');dialog.className='lightbox';dialog.setAttribute('aria-label','Image preview');
 const close=document.createElement('button');close.textContent='Close ×';close.setAttribute('aria-label','Close image preview');
 const image=document.createElement('img');dialog.append(close,image);document.body.append(dialog);
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 zoomLinks.forEach(link=>link.addEventListener('click',event=>{event.preventDefault();image.src=link.href;image.alt=link.querySelector('img')?.alt || '';dialog.showModal();close.focus();}));
}

// Case media uses each asset's own aspect ratio; hidden videos always pause.
document.querySelectorAll<HTMLElement>('[data-media-carousel]').forEach(carousel => {
 const slides = [...carousel.querySelectorAll<HTMLElement>('[data-media-slide]')];
 const buttons = carousel.querySelector<HTMLElement>('[data-media-controls]');
 if(slides.length < 2 || !buttons) return;
 let index=0;
 const show=(nextIndex:number)=>{
  slides[index].querySelector('video')?.pause();
  index=(nextIndex+slides.length)%slides.length;
  slides.forEach((slide,i)=>slide.hidden=i!==index);
  const caption=carousel.querySelector('[data-media-caption]');
  if(caption) caption.textContent=carousel.querySelectorAll<HTMLTemplateElement>('[data-caption]')[index]?.content.textContent || '';
  const status=carousel.querySelector('[data-media-status]');
  if(status)status.textContent=(index+1)+' / '+slides.length;
 };
 buttons.hidden=false;show(0);
 carousel.querySelector('[data-media-prev]')?.addEventListener('click',()=>show(index-1));
 carousel.querySelector('[data-media-next]')?.addEventListener('click',()=>show(index+1));
 carousel.addEventListener('keydown',event=>{
  if(event.target instanceof HTMLVideoElement) return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}
 });
});
