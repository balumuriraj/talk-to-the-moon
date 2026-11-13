# Reference

Configuration, data sources, and SDK caveats.

## Configuration

Copy `.env.example` to `.env.local` and restart the dev server:

```bash
NEXT_PUBLIC_PORTAL_URL=...      # the portal with the AI service (default https://www.arcgis.com)
NEXT_PUBLIC_ARCGIS_API_KEY=...  # only if your setup needs one
```

`NEXT_PUBLIC_` values are embedded in the browser bundle, so do not put secrets
in them.

Supported browsers are Chrome and Edge 123+, Firefox 120+, and Safari 17.5+.
Voice input uses the browser's speech recognition and works best in Chrome.

## Data

All three layers are public on ArcGIS Online. `backups/` has CSV copies in case
you want to publish your own.

### Missions

51 spacecraft that reached the Moon's surface at a known location.

- Layer: [Moon Missions](https://jsapi.maps.arcgis.com/home/item.html?id=5e7a5e537f274ec19bede7998ae464be)
  ([FeatureServer/0](https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/moon_missions/FeatureServer/0))
- Source: NASA NSSDCA,
  [Table of Anthropogenic Impacts and Spacecraft on the Moon](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html)
  (updated 13 August 2025)
- Most coordinates come from Lunar Reconnaissance Orbiter imagery. Sites
  without one are marked `approximate`.
- Debris such as spent rocket stages is left out.
- Launch details are sourced in
  [backups/mission-sources.json](../backups/mission-sources.json). There,
  `nssdca` means a NASA NSSDCA spacecraft page and `siddiqi` means Asif
  Siddiqi's *Beyond Earth* (NASA SP-2018-4041). Other values are URLs.

### Launch sites

10 spaceports, from the
[Moon Launch Sites layer](https://www.arcgis.com/home/item.html?id=78ad3a153bef46e3af31a08fa3e78b81).
A mission's `launchSiteId` points to these ids, so keep them stable.

### Craters

1,575 named craters.

- Layer: [Moon Craters](https://jsapi.maps.arcgis.com/home/item.html?id=664148a6ef744843b1641d6fe29332c7)
  ([FeatureServer/0](https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/moon-craters/FeatureServer/0))
- Source: the IAU/USGS
  [Gazetteer of Planetary Nomenclature](https://planetarynames.wr.usgs.gov/Page/MOON/target),
  from the 2019 export mirrored in
  [eleanorlutz/moon_geology_atlas_of_space](https://github.com/eleanorlutz/moon_geology_atlas_of_space)
- Lettered satellite craters such as "Abbe H" are left out. Depths are not
  included.
- Shackleton, Whipple, and Hinshelwood are too close to the poles for Web
  Mercator geometry. The app uses the `lat` and `lon` attributes instead, so it
  can still find and mark them.

### Other assets

- The lander model is NASA's Apollo Lunar Module from NASA 3D Resources. See
  [public/models/README.md](../public/models/README.md).
- The flags in `public/flags/` are simplified drawings made for this app, not
  official flag specifications.

## Publishing your own missions layer

- Use `lat` and `lon` as the coordinate fields. They are lunar coordinates
  stored as Earth geometry so the map can display them.
- Keep `id` as text. Rideshares and the 3D model refer to missions by id.
- Publish `arrivalDate` and `launchDate` as Date fields in UTC, and enable time
  on `arrivalDate`. The source has calendar dates only, so each is set to
  12:00 UTC.
- `commercial`, `sampleReturn`, and `approximate` are integers: 1 for true, 0
  for false.
- `crew` holds the surface crew's names separated by semicolons. `orbitingCrew`
  is a separate field.
- A new country needs a flag in `public/flags/` and an entry in `FLAGS` in
  [data.ts](../src/data.ts). A new outcome needs an icon in `public/icons/`.

## SDK caveats (5.2)

- **Tool errors.** An error thrown by a tool ends the whole request. The
  `returnErrors` wrapper in [tools/shared.ts](../src/agent/tools/shared.ts) returns the error
  to the model instead.
- **Popups.** Closing a popup clears its content but leaves the frame open, so
  [App.tsx](../src/App.tsx) closes it on `arcgisClose`. Automatic popup
  templates come up empty, so both layers define their own.
- **Voice input.** The assistant's voice-input property is not in the React
  typings yet, so `voice-input-enabled` is passed as an attribute.
- **Two WebGL scenes** render at the same time. If a machine struggles, check
  GPU use in the browser's task manager.
- **chooseMission** accepts either the mission id or its label as the user's
  answer.
