// Geometry and styling extracted from the user's working Map animation/index.html.
// Keep the original reference intact. Projection, winding, Caspian Sea and polar seam logic are preserved.
import fs from 'node:fs';
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import { addCities } from './map-cities.mjs';
const dom = new JSDOM('<!doctype html><svg id="world" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"></svg>');
globalThis.document=dom.window.document;
const major=JSON.parse(fs.readFileSync('Map animation/world-major.geojson','utf8'));
const islands=JSON.parse(fs.readFileSync('Map animation/world-islands.geojson','utf8'));
    function toCoastlines(collection) {
      const features = [];

      for (const feature of collection.features) {
        const geometry = feature.geometry;
        if (!geometry) continue;

        const polygons = geometry.type === "Polygon"
          ? [geometry.coordinates]
          : geometry.type === "MultiPolygon"
            ? geometry.coordinates
            : [];

        for (const rings of polygons) {
          const ring = rings[0];
          if (!ring || ring.length < 2) continue;

          features.push({
            type: "Feature",
            properties: feature.properties || {},
            geometry: { type: "LineString", coordinates: ring }
          });
        }
      }

      return { type: "FeatureCollection", features };
    }

    // Return the interior rings (holes) as independent coastlines.
    // In this Natural Earth dataset the Eurasian polygon contains
    // one such ring: the Caspian Sea. The fill already respects this hole.
    function toInteriorCoastlines(collection) {
      const features = [];

      for (const feature of collection.features) {
        const geometry = feature.geometry;
        if (!geometry) continue;

        const polygons = geometry.type === "Polygon"
          ? [geometry.coordinates]
          : geometry.type === "MultiPolygon"
            ? geometry.coordinates
            : [];

        for (const rings of polygons) {
          for (const ring of rings.slice(1)) {
            if (!ring || ring.length < 4) continue;
            features.push({
              type: "Feature",
              properties: feature.properties || {},
              geometry: { type: "LineString", coordinates: ring }
            });
          }
        }
      }

      return { type: "FeatureCollection", features };
    }

    // Detect Antarctica by its geographic extent, NOT by the old -90° pole.
    // The revised ArcGIS data ends near -88°, so the previous test fails.
    function isAntarctica(feature) {
      const coords = feature.geometry?.coordinates;
      if (!coords || !coords.length) return false;
      const latitudes = coords.map(p => p[1]);
      const longitudes = coords.map(p => p[0]);
      return Math.min(...latitudes) < -75 &&
             Math.max(...latitudes) < -60 &&
             Math.max(...longitudes) - Math.min(...longitudes) > 300;
    }

    // Antarctica has a short ARTIFICIAL seam along +/-180° in both the old
    // Natural Earth data and the newly trimmed ArcGIS export. Return only
    // the real coastline, plus the trimmed latitude for the fill cap.
    function getAntarcticShape(ring) {
      const points = [...ring];
      if (points.length > 1 &&
          points[0][0] === points.at(-1)[0] &&
          points[0][1] === points.at(-1)[1]) points.pop();

      const jump = points.findIndex((point, index) =>
        index > 0 && Math.abs(point[0] - points[index - 1][0]) > 300
      );
      if (jump < 0) return {
        coast: points,
        capLatitude: Math.min(...points.map(p => p[1]))
      };

      const artificial = ([lon, lat]) =>
        Math.abs(lon) >= 179.97 && lat < -84.7;

      let before = jump - 1;
      let after = jump;
      // Trim the meridian-side vertices created by the polygon closure.
      while (before > 0 && artificial(points[before - 1])) before--;
      while (after < points.length - 1 && artificial(points[after + 1])) after++;

      const capLatitude = Math.min(
        ...points.slice(before, after + 1).map(p => p[1])
      );
      const coast = points.slice(after + 1).concat(points.slice(0, before));

      return { coast, capLatitude };
    }

    // D3 expects small GeoJSON polygons with clockwise exterior rings,
    // whereas Natural Earth/ArcGIS export CCW exterior rings.
    // Correct winding means d3.geoPath can safely handle the date-line cut
    // instead of our old direct d3.line() filling that caused phantom lines.
    function signedArea(ring) {
      let area = 0;
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1];
        const b = ring[i];
        area += a[0] * b[1] - b[0] * a[1];
      }
      return area / 2;
    }

    function forD3Fill(feature) {
      const geometry = feature.geometry;
      const polygons = geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates : [];

      const adjusted = polygons.map(rings => rings.map((ring, index) => {
        const clockwise = index === 0;
        const reverse = clockwise ? signedArea(ring) > 0 : signedArea(ring) < 0;
        return reverse ? [...ring].reverse() : ring;
      }));

      return {
        type: "Feature",
        properties: feature.properties || {},
        geometry: {
          type: geometry.type,
          coordinates: geometry.type === "Polygon" ? adjusted[0] : adjusted
        }
      };
    }


      const majorLines = toCoastlines(major);
      const islandLines = toCoastlines(islands);
      const inlandCoastlines = toInteriorCoastlines(major);
      // Interior coastlines use the island reveal timeline, so the
      // Caspian Sea appears gradually instead of being traced.
      const fadingCoastlines = [
        ...islandLines.features,
        ...inlandCoastlines.features
      ];
      const allLines = {
        type: "FeatureCollection",
        features: [...majorLines.features, ...islandLines.features]
      };

      const settings = JSON.parse(fs.readFileSync('src/data/map-animation-settings.json', 'utf8'));
      const svg = d3.select("#world").attr('style', '--shimmer-duration:' + settings.shimmerDurationMs + 'ms;--shimmer-min-opacity:' + settings.shimmerMinOpacity + ';--land-opacity:' + settings.landOpacity + ';--city-label-size:' + settings.labelFontSize + 'px');
      svg.selectAll("*").remove();

      svg.append("defs")
        .append("filter")
        .attr("id", "tip-glow")
        .attr("x", "-250%")
        .attr("y", "-250%")
        .attr("width", "600%")
        .attr("height", "600%")
        .html(`
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur-near" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur-far" />
          <feMerge>
            <feMergeNode in="blur-far" />
            <feMergeNode in="blur-near" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        `);

      const projection = d3.geoNaturalEarth1()
        .fitExtent([[20, 20], [1180, 580]], allLines);
      const geoPath = d3.geoPath(projection);
      // Unlike geoPath, a projected SVG line doesn't clip/split Antarctica
      // at the antimeridian. Its open geometry has a single continuous path.
      const polarPath = d3.line()
        .x(point => projection(point)[0])
        .y(point => projection(point)[1]);

      // Fills are rendered separately, *behind* the animated coastlines.
      // D3's geoPath handles the antimeridian and ring winding for land.
      // Antarctica keeps its custom open coast and gets its own fill cap.
      svg.select("defs").append("clipPath")
        .attr("id", "land-viewport")
        .append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", 1200).attr("height", 600);

      const landFills = svg.append("g")
        .attr("id", "land-fills")
        .attr("clip-path", "url(#land-viewport)");
      const landFillShimmer = landFills.append("g")
        .attr("id", "land-fill-shimmer");

      for (const feature of [...major.features, ...islands.features]) {
        let fillPath;
        if (isAntarctica({ geometry: {
          coordinates: feature.geometry.type === "Polygon"
            ? feature.geometry.coordinates[0]
            : (feature.geometry.coordinates[0]?.[0] || [])
        }})) {
          const { coast, capLatitude } = getAntarcticShape(
            feature.geometry.coordinates[0]
          );
          if (coast.length < 3) continue;
          const coastalD = polarPath(coast);
          const first = projection(coast[0]);
          const last = projection(coast.at(-1));
          const capY = projection([0, capLatitude])[1];
          // The closing edge exists only in the FILL path (stroke:none).
          // Unlike the previous hardcoded y=620, its height follows the
          // actually trimmed Antarctic polygon from ArcGIS.
          fillPath = `${coastalD}L${last[0]},${capY}L${first[0]},${capY}Z`;
        } else {
          fillPath = geoPath(forD3Fill(feature));
        }
        if (fillPath) {
          landFillShimmer.append("path")
            .attr("class", "land-fill")
            .attr("d", fillPath);
        }
      }


const continentLayer=svg.append('g').attr('id','continents');
for(const feature of majorLines.features){
  const antarctica=isAntarctica(feature);
  const d=antarctica ? polarPath(getAntarcticShape(feature.geometry.coordinates).coast) : geoPath(feature);
  if(d)continentLayer.append('path').attr('class','continent').attr('data-antarctica',String(antarctica)).attr('d',d);
}
svg.append('g').attr('id','islands').selectAll('path').data(fadingCoastlines).join('path').attr('class','island').attr('d',geoPath);
// Static HTML is the default: visible even when JS is disabled or fails to load.
svg.append('style').text("    /* The fill sits BEHIND all animated coastlines and has no stroke. */\n    #land-fills { opacity: 0; }\n    .land-fill {\n      fill: var(--land-fill);\n      fill-opacity: var(--land-opacity);\n      fill-rule: evenodd;\n      stroke: none;\n      pointer-events: none;\n    }\n\n    /* Same appearance for both coastline layers from the very beginning. */\n    .continent,\n    .island {\n      fill: none;\n      stroke: var(--coast);\n      stroke-width: 1.2;\n      stroke-linecap: round;\n      stroke-linejoin: round;\n      filter: drop-shadow(0 0 2px rgba(131, 199, 202, .35));\n    }\n\n    /* JavaScript reveals islands gradually and reaches exactly 1 at 100%. */\n    .island { opacity: 0; }\n\n    /* Both layers start and finish each shimmer cycle at full brightness. */\n    #world.map-finished #continents,\n    #world.map-finished #islands,\n    #world.map-finished #land-fill-shimmer {\n      animation: coastline-shimmer var(--shimmer-duration) ease-in-out infinite;\n    }\n\n    @keyframes coastline-shimmer {\n      0%, 1%, 100% { opacity: 1; }\n      56%           { opacity: var(--shimmer-min-opacity, .70); }\n    }\n\n    /* Bright moving tips. They are removed once drawing is complete. */\n    .trace-tip {\n      pointer-events: none;\n    }\n\n    .trace-tip-glow {\n      fill: #9ef5f4;\n      opacity: .9;\n      filter: url(#tip-glow);\n    }\n\n    .trace-tip-core {\n      fill: #e1ffff;\n    }\n\n    @media (prefers-reduced-motion: reduce) {\n      .island { opacity: 1; }\n      #world.map-finished #continents,\n      #world.map-finished #islands,\n      #world.map-finished #land-fill-shimmer { animation: none; }\n    }\n" + '\n#world:not(.map-animating) #land-fills,#world:not(.map-animating) .island{opacity:1}');
addCities(svg, projection);
fs.mkdirSync('src/generated',{recursive:true});
fs.writeFileSync('src/generated/world.svg',svg.node().outerHTML);
console.log('Prepared original map: '+majorLines.features.length+' major coastlines, '+fadingCoastlines.length+' island/inland coastlines.');

