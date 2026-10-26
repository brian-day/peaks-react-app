# Peaks Preview (React)

An exploratory web front end for `AnalyzePeaks` preview, as an alternative to the Mathematica
notebook front end. It draws a chromatogram and its peaks, and edits the analysis through
`peaks_server`, a small Rust HTTP server in the DVA repository that wraps `dva_lib`. The server
downloads data from Constellation and holds the analysis; this app only presents it.

This is proof-of-concept work, likely to be redesigned.

## What it does

- Opens an `Object[Data, Chromatography]`, or an HPLC or FPLC protocol, from Constellation.
- Plots the trace with box zoom, pan, wheel zoom, and independent zoom of each axis.
- Picks peaks by three methods:
  - **Manual:** drag across a peak to add it, and drag its boundaries;
  - **Curvature:** the existing curvature method, with its −y″ overlay and draggable threshold;
  - **Curvature (vnext):** the new curvature pipeline, with any number of detection domains, each
    with its own smoothing, threshold, baseline and exclusion settings. Domains can be drawn,
    dragged and snapped together on the plot.
- Lists the peaks in a table whose columns can be chosen, grouped by domain under vnext, and
  linked to the plot by hover.
- For protocols, shows the injection table. Clicking an analysed injection makes it the one being
  viewed, and every other injection's trace can be shown faintly behind it.

## Running it

You need Node (via `fnm` here), and the DVA repository for `peaks_server`.

1. Start the server from DVA, in release mode, since vnext is about 45 times slower in a debug
   build:

   ```sh
   export CONSTELLATION_USERNAME=…  CONSTELLATION_PASSWORD=…   # CONSTELLATION_DOMAIN defaults to stage
   cargo run --release -p peaks_server                         # listens on 127.0.0.1:3001
   ```

2. Start this app:

   ```sh
   npm install
   npm run dev        # http://localhost:5173, proxying /api to peaks_server
   ```

3. Choose a type, enter an ID and press Analyze. Two IDs on stage that work:
   - `id:M8n3rxPqa87E`, a chromatography data object, which is the default in the form;
   - `id:01G6nvDbLz6r`, an HPLC protocol with 12 injections, 6 of them samples.

## Scripts

| Command         | What it does                                            |
| --------------- | ------------------------------------------------------- |
| `npm run dev`   | Vite dev server with hot reload                         |
| `npm run build` | Type-check (`tsc -b`) and build into `dist/`            |
| `npm run lint`  | ESLint, with type-aware TypeScript and React rules      |
| `npm test`      | Vitest; tests cover the pure logic, not the components  |

## Layout

```
src/
  App, SessionView, ObjectIdForm, useSession
                the app shell: choosing what to analyze, the session's server state, and the view
                of one session, which starts over for each new analysis
  api/          wire types (mirroring peaks_server's JSON by hand) and the fetch client
  plot/         the chromatogram: SVG layers, axes, interaction, −y″, threshold bars, viewport maths
  settings/     peak detection settings: the domain table, its per-method edits, number fields
  table/        the peaks table, its column definitions and picker, grouping by domain
  injections/   a protocol's injection table
  shared/       pieces used across features and tied to none: button groups, message lists,
                element sizing, number formatting
```

The plot is plain SVG with `d3-scale`, with no chart library. Long paths are built once in data
coordinates and moved with an SVG transform, so panning stays fast.
