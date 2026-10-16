import fs from 'node:fs';

// Use the same fitted projection as the coastline generator; no client-side D3.
export function addCities(svg, projection) {
  const { cities } = JSON.parse(fs.readFileSync('src/data/map-capitals.json', 'utf8'));
  const points = cities.map(([country, name, lon, lat]) => ({ country, name, point: projection([lon, lat]) }));
  const boxes = [];
  const layer = svg.append('g').attr('id', 'cities');
  for (const { country, name, point: [x, y] } of points) {
    const width = name.length * 4.1;
    let box;
    // Reserve label rectangles independently of reveal order; keep every city visible.
    for (let radius = 4; radius <= 160 && !box; radius += 3) {
      for (const angle of [0, 180, 270, 90, 315, 225, 45, 135]) {
        const radians = angle * Math.PI / 180;
        const cx = x + Math.cos(radians) * (radius + width / 2);
        const cy = y + Math.sin(radians) * radius;
        const candidate = { left: cx - width / 2, right: cx + width / 2, top: cy - 5, bottom: cy + 5 };
        if (candidate.left < 8 || candidate.right > 1192 || candidate.top < 8 || candidate.bottom > 592) continue;
        if (boxes.some(b => candidate.left < b.right + 3 && candidate.right > b.left - 3 && candidate.top < b.bottom + 3 && candidate.bottom > b.top - 3)) continue;
        if (points.some(({ point: [px, py] }) => px > candidate.left - 4 && px < candidate.right + 4 && py > candidate.top - 4 && py < candidate.bottom + 4)) continue;
        box = candidate;
        break;
      }
    }
    if (!box) throw new Error('Cannot place capital label: ' + name);
    boxes.push(box);
    const city = layer.append('g').attr('class', 'map-city').attr('data-city', name).attr('transform', `translate(${x},${y})`);
    city.append('title').text(`${name}, ${country}`);
    const settled = city.append('g').attr('class', 'city-settled');
    const labelX = box.left - x;
    const labelY = (box.top + box.bottom) / 2 - y;
    settled.append('line').attr('class', 'city-leader').attr('x1', 0).attr('y1', 0)
      .attr('x2', Math.max(box.left, Math.min(x, box.right)) - x).attr('y2', labelY);
    settled.append('circle').attr('class', 'city-dot').attr('r', 1.8);
    settled.append('text').attr('class', 'city-label').attr('x', labelX).attr('y', labelY)
      .attr('dominant-baseline', 'central').text(name);
    const flash = city.append('g').attr('class', 'city-flash');
    flash.append('circle').attr('class', 'city-halo').attr('r', 14);
    flash.append('circle').attr('class', 'city-bloom').attr('r', 6);
    flash.append('circle').attr('class', 'city-core').attr('r', 4.4);
  }
  svg.append('style').text(`
    #cities { pointer-events: none; }
    .city-dot { fill: #c8ffff; }
    .city-label { font-family: var(--font-body, sans-serif); font-size: var(--city-label-size, 7.5px); font-weight: 450; fill: #bce3e5; stroke: #101820; stroke-width: 2px; paint-order: stroke; stroke-linejoin: round; }
    .city-leader { stroke: #83c7ca; stroke-width: .45; opacity: .45; }
    .city-flash { opacity: 0; }
    .city-halo { fill: #c8ffff; filter: url(#tip-glow); }
    .city-bloom { fill: #e5ffff; filter: url(#tip-glow); }
    .city-core { fill: #ffffff; }
    #world.map-finished #cities { animation: coastline-shimmer var(--shimmer-duration) ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { #world.map-finished #cities { animation: none; } }
  `);
}

