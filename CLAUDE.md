# peaks-react-app

Exploratory React and TypeScript front end for `AnalyzePeaks` preview, backed by `peaks_server`, an
axum server in the DVA repository (`~/DVA/peaks_server`) that wraps `dva_lib`. It's proof-of-concept
work, likely to be redesigned: optimise for the easiest path and for lessons that transfer, not for
polish. The README covers what the app does and how to run it.

## Two repos, one feature

- Most features touch both repositories: the server (Rust, in DVA) and this app (React).
- **Label every planned or reported change as Rust (DVA) or React (peaks-react-app).**
- Commit in each repo separately. A change to `dva_lib` is a separate commit from `peaks_server`
  work.

## Commands

- Node comes from fnm, so prefix shell commands with `eval "$(fnm env --shell zsh)";`.
- Checks to run after a change: `npx tsc -b`, `npm run lint` (oxlint) and `npx vitest run`.
- The server, from `~/DVA`: `cargo run --release -p peaks_server`. Always use `--release`, because
  vnext is far too slow in debug. Don't add a named cargo-make task for it.
- Rust checks: `cargo test -p peaks_server` and `cargo clippy -p peaks_server --all-targets`.
  For `dva_lib`, also run with `--features vnext,standard_data_source`.
- After a Rust change, restart the background `peaks_server` before checking in the browser.

## Checking in the browser

- Check features in Chrome against stage, with the Claude in Chrome tools, before calling them done.
- **Reuse one tab** across checks rather than opening a new one each time. Open more only when
  asked to compare states. The user may close the tab themselves; that's safe.
- The extension scales click coordinates and drops modifier keys. Drive drags by dispatching
  `PointerEvent`s from page scripts. React's `onPointerEnter`/`Leave` need `pointerover`/`out`
  events.
- Test IDs on stage:
  - `id:M8n3rxPqa87E`, a chromatography data object;
  - `id:01G6nvDbLz6r`, an HPLC protocol with 12 injections and 6 samples, whose first sample is
    `id:M8n3rxPqa87E`.

  FPLC has never been tested.
- An unusual state (a long name, say) can be faked by editing the page directly. It lasts until
  React redraws that element.

## Code conventions

- **The server is the source of truth.** The client never recomputes a peak property. Each command
  returns the whole analysis, and `useSession` replaces its copy.
- **`src/api/types.ts` mirrors the Rust structs by hand.** Change both sides together.
- **Keep logic out of components,** in plain `.ts` modules with Vitest tests, as in
  `plot/viewport.ts`, `plot/domains.ts`, `table/groups.ts` and `table/columns.ts`. There are no
  component tests.
- **Prefer explicit literal expected values in tests,** rather than calling the code under test to
  build them.
- **Plot rendering:**
  - Build long paths once in data coordinates (`dataPath`) and move them with `dataTransform`.
    Never rebuild path strings on zoom.
  - Things drawn on the data layer have `pointer-events: none`, except their drag handles.
- **State:** derive values during render rather than copying them into state in an effect, which
  the lint rules flag. Don't read refs during render.
- **Structure:** reusable components with clear responsibilities, but avoid over-abstraction.
  Match the surrounding code's comment density and naming.
  - Doc comments say what something is for, in plain English.
  - There's no Prettier: wrap lines at about 120 characters, as the existing code does.
- **Text in the UI:**
  - Headings, column labels and toolbar group labels are in **title case**.
  - Tooltips are sentences.
  - Button labels haven't been settled.
- **Matching the Mathematica preview:** it's a starting point, not a spec. Deviate where a different
  interaction is clearly better, and say why.

## Working with the user

- **Never `git commit` yourself.** Stage only when asked.
- **Suggest commit messages:**
  - one line, ending with a period;
  - each commit about one logical change; defer adjacent fixes to their own commit;
  - say what changed for the user, plainly, without jargon.
- **Work one step at a time.** When there's a multi-step plan, stop after each step and wait to be
  asked for the next. Don't bundle "and then we can…" into one turn.
- **Explain React and TypeScript on their own terms.** The user is fairly new to them, so explain
  the why where it matters.
- **Prefer in-code docs** to hand-maintained architecture documents. The design document for this
  prototype (`~/peaks-react-app-design.pdf`) was a deliberate one-off.

## Known gaps

The design document's §12 and §13 list these in full. The main ones:

- `ChromatogramPlot` does too much.
- The wire types are hand-mirrored.
- `index.css` is one large file.
- Domain snapping isn't atomic: it sends one command per domain.
- Domains are identified by position.
- `peaks_server` sessions are never freed.
- These features are cut from scope:
  - signal-to-noise and blank selection;
  - parent peak and labelling;
  - several domains for the original Curvature method.
