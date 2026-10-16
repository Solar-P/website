import { layoutCityLabels } from './map-labels';
import settings from '../data/map-animation-settings.json';
// Animation adapted from Map animation/index.html; geographic paths are built ahead of time.
const svg = document.querySelector<SVGSVGElement>('#world');
if (svg) {
 for (const [name, value] of Object.entries({
  '--shimmer-duration': `${settings.shimmerDurationMs}ms`,
  '--shimmer-min-opacity': String(settings.shimmerMinOpacity),
  '--land-opacity': String(settings.landOpacity),
  '--city-label-size': `${settings.labelFontSize}px`
 })) svg.style.setProperty(name, value);
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const ns='http://www.w3.org/2000/svg';
 const fills=svg.querySelector<SVGGElement>('#land-fills')!;
 const islands=[...svg.querySelectorAll<SVGPathElement>('.island')];
 const tips=document.createElementNS(ns,'g');tips.id='drawing-tips';
 const makeTip=()=>{const group=document.createElementNS(ns,'g');group.setAttribute('class','trace-tip');for(const [name,r] of [['trace-tip-glow','5.5'],['trace-tip-core','2.0']]){const circle=document.createElementNS(ns,'circle');circle.setAttribute('class',name);circle.setAttribute('r',r);group.append(circle);}tips.append(group);return group;};
 const traces=[...svg.querySelectorAll<SVGPathElement>('.continent')].map(forward=>({forward,length:forward.getTotalLength(),antarctica:forward.dataset.antarctica==='true',backward:forward.cloneNode(true) as SVGPathElement,forwardTip:makeTip(),backwardTip:makeTip()}));
 const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 let frameId=0;
 const FLASH_DURATION = settings.flashDurationMs;
 const CITY_INTERVAL = settings.cityIntervalMs;
 const cities = [...svg.querySelectorAll<SVGGElement>('.map-city')].map(node => ({
  node, settled: node.querySelector<SVGGElement>('.city-settled')!,
  flash: node.querySelector<SVGGElement>('.city-flash')!
 }));
 // Fisher-Yates: each capital appears exactly once, with a fresh order on reload.
 for (let i = cities.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [cities[i], cities[j]] = [cities[j], cities[i]];
 }
 let cityFrameId = 0;
 let cityStarted = false;
 let inView = true;
 let cityElapsed = 0;
 let previousCityFrame: number | undefined;
 void document.fonts.ready.then(() => layoutCityLabels(svg));
 let labelLayoutFrame = 0;
 window.addEventListener('resize', () => {
  cancelAnimationFrame(labelLayoutFrame);
  labelLayoutFrame = requestAnimationFrame(() => layoutCityLabels(svg));
 });
 const showStaticCities = () => {
  cancelAnimationFrame(cityFrameId);
  cities.forEach(({ node, settled, flash }) => {
   node.style.opacity = '1'; settled.style.opacity = '1'; flash.style.opacity = '0';
  });
 };
 const renderCities = (now: number) => {
  if (motion.matches || document.hidden || !inView || !cityStarted) return;
  if (previousCityFrame !== undefined) cityElapsed += now - previousCityFrame;
  previousCityFrame = now;
   cities.forEach(({ node, settled, flash }, index) => {
    const age = cityElapsed - index * CITY_INTERVAL;
    node.style.opacity = age < 0 ? '0' : '1';
    if (age < 0) return;
    const progress = Math.min(age / FLASH_DURATION, 1);
    settled.style.opacity = String(Math.min(age / settings.labelFadeDurationMs, 1));
    // A quick ignition, then a soft contraction into the permanent dot.
    const ignition = Math.min(age / settings.flashIgnitionMs, 1);
    flash.style.opacity = String(ignition * Math.pow(1 - progress, .7));
    flash.setAttribute('transform', `scale(${.18 + .82 * Math.pow(1 - progress, 1.5)})`);
   });
  if (cityElapsed >= (cities.length - 1) * CITY_INTERVAL + FLASH_DURATION) {
   // Start all four CSS animations together, only after the last flash settles.
   svg.classList.add('map-finished');
   cityStarted = false;
   return;
  }
  cityFrameId = requestAnimationFrame(renderCities);
 };
 const startCities = () => {
  cityStarted = true;
  cancelAnimationFrame(cityFrameId);
  pause();
 };
 const staticMap=()=>{cancelAnimationFrame(frameId);svg.classList.remove('map-animating','map-finished');for(const trace of traces){trace.forward.style.strokeDasharray='none';trace.forward.style.strokeDashoffset='0';trace.backward.remove();}islands.forEach(node=>node.style.opacity='1');fills.getAnimations().forEach(a=>a.cancel());fills.style.opacity='1';tips.remove();};
 const move=(tip:SVGGElement,node:SVGPathElement,d:number)=>{const p=node.getPointAtLength(d);tip.setAttribute('transform','translate('+p.x+','+p.y+')');};
 const render=(progress:number)=>{
  const fraction=ease(progress);const elapsed=progress*settings.drawDurationMs;
  islands.forEach((node,i)=>{const delay=Math.min(settings.islandStartMs+(i*settings.islandStepMs)%Math.max(settings.islandStaggerMs,1),settings.drawDurationMs-1);node.style.opacity=String(ease(Math.max(0,Math.min((elapsed-delay)/(settings.drawDurationMs-delay),1))));});
  for(const trace of traces){const half=trace.length/2;const visible=half*fraction;const dash=visible+' '+(trace.length+2);trace.forward.style.strokeDasharray=dash;trace.backward.style.strokeDasharray=dash;
   if(trace.antarctica){trace.forward.style.strokeDashoffset=String(-half);trace.backward.style.strokeDashoffset=String(-(half-visible));move(trace.forwardTip,trace.forward,half+visible);move(trace.backwardTip,trace.backward,half-visible);}
   else{trace.forward.style.strokeDashoffset='0';trace.backward.style.strokeDashoffset=String(-(trace.length-visible));move(trace.forwardTip,trace.forward,visible);move(trace.backwardTip,trace.backward,trace.length-visible);}
  }
 };
 if(!motion.matches){
  svg.classList.add('map-animating');fills.style.opacity='0';traces.forEach(trace=>trace.forward.after(trace.backward));svg.append(tips);render(0);
  let start:number|undefined;
  const frame=(now:number)=>{start??=now;const progress=Math.min((now-start)/settings.drawDurationMs,1);render(progress);if(progress<1){frameId=requestAnimationFrame(frame);return;}
   traces.forEach(trace=>{trace.forward.style.strokeDasharray='none';trace.forward.style.strokeDashoffset='0';trace.backward.remove();});
   tips.animate([{opacity:1},{opacity:0}],{duration:settings.tipFadeDurationMs,easing:'cubic-bezier(.33,1,.68,1)',fill:'forwards'}).onfinish=()=>tips.remove();
   const fillAnimation=fills.animate([{opacity:0},{opacity:1}],{duration:settings.fillDurationMs,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
   fillAnimation.onfinish=()=>{fills.style.opacity='1';fillAnimation.cancel();svg.classList.remove('map-animating');if(!motion.matches)startCities();};
  };frameId=requestAnimationFrame(frame);
 }
 if (!motion.matches) cities.forEach(({node}) => node.style.opacity = '0');
 motion.addEventListener('change',()=>{if(motion.matches){staticMap();showStaticCities();}});
 // Pause the decorative shimmer outside the hero and when the tab is hidden.
 const pause=()=>{
  svg.querySelectorAll<SVGElement>('#continents,#islands,#land-fill-shimmer,#cities').forEach(node=>node.style.animationPlayState=!document.hidden && inView?'running':'paused');
  cancelAnimationFrame(cityFrameId);
  previousCityFrame = undefined;
  if (!document.hidden && inView && cityStarted && !motion.matches) cityFrameId=requestAnimationFrame(renderCities);
 };
 document.addEventListener('visibilitychange',pause);
 new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;pause();},{threshold:0}).observe(svg);
}

