import { labelPositions } from '../data/map-capitals.json';
import settings from '../data/map-animation-settings.json';
// Measure the actual loaded font instead of stretching individual city names.
export function layoutCityLabels(svg: SVGSVGElement) {
 type Box = { left: number; right: number; top: number; bottom: number };
 const items = [...svg.querySelectorAll<SVGGElement>('.map-city')].map(node => {
  const text = node.querySelector<SVGTextElement>('.city-label')!;
  const transform = node.transform.baseVal.getItem(0).matrix;
  return { node, text, x: transform.e, y: transform.f, width: text.getComputedTextLength(), height: text.getBBox().height };
 });
 const boxes = new Map<typeof items[number], Box>();
 const fixed = new Set<typeof items[number]>();
 // Reserve manually pinned labels first; automatic labels must work around them.
 for (const item of items) {
  const direction = (labelPositions as Record<string, number[]>)[item.text.textContent ?? ''];
  if (!direction) continue;
  const [dx, dy, offsetX = 0, offsetY = 0] = direction;
  const cx = item.x + dx * (settings.labelGap + item.width / 2) + offsetX;
  const cy = item.y + dy * (settings.labelGap + item.height / 2) + offsetY;
  boxes.set(item, {left:cx-item.width/2,right:cx+item.width/2,top:cy-item.height/2,bottom:cy+item.height/2});
  fixed.add(item);
 }
 const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left) + 1) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + 1);
 // Several local passes let early labels move too, rather than pushing every later
 // European city farther away. Four SVG units is the preferred point-to-label gap.
 for (let pass = 0; pass < 8; pass++) {
  for (const item of items) {
   if (fixed.has(item)) continue;
   let best: Box | undefined;
   let bestScore = Infinity;
   for (let gap = settings.labelGap; gap <= Math.max(64, settings.labelGap); gap += 2) {
    for (const [dx, dy] of [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,-1],[1,1],[-1,1]]) {
     const cx = item.x + dx * (gap + item.width / 2);
     const cy = item.y + dy * (gap + item.height / 2);
     const box = {left:cx-item.width/2,right:cx+item.width/2,top:cy-item.height/2,bottom:cy+item.height/2};
     if (box.left < 4 || box.right > 1196 || box.top < 4 || box.bottom > 596) continue;
     let score = gap * gap + (dx && dy ? 6 : 0);
     for (const [other, b] of boxes) if (other !== item) score += overlap(box,b) * 10000;
     for (const point of items) score += overlap(box,{left:point.x-2.5,right:point.x+2.5,top:point.y-2.5,bottom:point.y+2.5}) * 10000;
     if (score < bestScore) { bestScore = score; best = box; }
    }
   }
   if (best) boxes.set(item,best);
  }
 }
 for (const [item, box] of boxes) {
  const y = (box.top + box.bottom) / 2 - item.y;
  item.text.setAttribute('x', String(box.left - item.x));
  item.text.setAttribute('y', String(y));
  const line = item.node.querySelector('line')!;
  line.setAttribute('x2', String(Math.max(box.left,Math.min(item.x,box.right))-item.x));
  line.setAttribute('y2', String(y));
 }
}
