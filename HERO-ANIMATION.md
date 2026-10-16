# Hero city animation

The original reference in `Map animation/` is preserved. The site renders generated SVG geometry and runs `src/scripts/map-animation.ts`.

## Cities

`src/data/map-capitals.json` contains the original 50 capitals selected from 2025 nominal GDP estimates (IMF WEO April 2026, UN member states), plus 17 user-requested/editorial additions: New York, San Francisco, Saint Petersburg, Sydney, Wellington, Kyiv, Rabat, Dakar, Accra, Addis Ababa, Nairobi, Caracas, Quito, Georgetown, Paramaribo, Shanghai and Guangzhou. The additional cities are not an objective importance ranking. The entire set of 67 is shuffled once per page load.

## Sequence

- Coastline drawing: 5 seconds.
- Land fill: 3 seconds.
- Cities begin immediately when the fill completes.
- Flash duration: 1,200 ms; next city starts after 1,000 ms, giving 200 ms overlap.
- Initial ignition: 35 ms with a white core and two glow layers; label fades in over 220 ms.
- After the final flash ends, coastlines, islands, fill and cities start the same CSS shimmer together.
- Full sequence: approximately 75.2 seconds of visible playback.
- City playback and final shimmer pause outside the hero or when the tab is hidden.
- Reduced motion displays the completed map without flashes or shimmer. Static cities also remain visible without JavaScript.

## Labels

Every label uses the same 7.5 SVG-unit font with natural glyph widths (no textLength or glyph stretching). The preferred gap is 4 SVG units, half the former default. After the site font loads, `src/scripts/map-labels.ts` measures real text dimensions and lays out labels to avoid labels and city points. Dense areas can use larger offsets. Leader lines preserve the association with the actual geographic location.

Change cities in the JSON dataset and rebuild with `npm run build`. Flash duration and interval are constants in the animation script. Geometry uses the same projection as the original map.

Manual label directions are stored in labelPositions in the city JSON. Those eight boxes are reserved before automatic placement. Brussels is excluded (66 cities, full sequence about 74.2 seconds). Labels are remeasured after viewport resizing. Hero text shading uses reduced opacity on desktop and mobile.
