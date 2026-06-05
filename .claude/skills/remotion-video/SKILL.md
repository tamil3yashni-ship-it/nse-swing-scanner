# Remotion Video Skill

Generate programmatic videos using [Remotion](https://www.remotion.dev) — React components that render to MP4.

## When to use this skill

Use this skill when asked to:
- Create a video or animation from stock/market data
- Render a chart, heatmap, or signal summary as a shareable video clip
- Build a reusable video composition for NSE swing scanner output

## Project layout

```
.claude/skills/remotion-video/
├── src/
│   ├── Root.tsx          # Register compositions here
│   ├── HelloWorld.tsx    # Example composition (safe to delete)
│   └── HelloWorld/       # Sub-components for the example
├── public/               # Static assets (fonts, images)
├── remotion.config.ts    # Remotion config
└── package.json
```

## Key commands

Run from `.claude/skills/remotion-video/`:

```bash
npm run dev                         # Open Remotion Studio (live preview)
npx remotion render <CompositionId> # Render a single composition to MP4
npx remotion render                 # Render all compositions
```

Rendered output lands in `out/`.

## Adding a new composition

1. Create `src/MyComp.tsx` — a React component that reads `useCurrentFrame()` and `useVideoConfig()`.
2. Register it in `src/Root.tsx`:

```tsx
import { MyComp } from "./MyComp";

<Composition
  id="MyComp"
  component={MyComp}
  durationInFrames={300}  // 10 s at 30 fps
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{ /* typed props */ }}
/>
```

3. Render: `npx remotion render MyComp`

## Core Remotion primitives

| Primitive | Purpose |
|-----------|---------|
| `useCurrentFrame()` | Current frame number (0-indexed) |
| `useVideoConfig()` | `{ fps, durationInFrames, width, height }` |
| `interpolate(frame, [in], [out])` | Map frame range to value range |
| `spring({ frame, fps, config })` | Physics-based easing |
| `<Sequence from={N}>` | Delay children by N frames |
| `<AbsoluteFill>` | Full-canvas positioned div |
| `<Audio>` / `<Video>` | Embed media |

## Passing data from the scanner

Props are typed with Zod and passed via `defaultProps` or `--props` at render time:

```bash
npx remotion render StockSummary --props='{"symbol":"RELIANCE","signal":"BUY","change":2.4}'
```

Define the schema in the composition file:

```tsx
import { z } from "zod";
const schema = z.object({ symbol: z.string(), signal: z.string(), change: z.number() });
export const StockSummary: React.FC<z.infer<typeof schema>> = ({ symbol, signal, change }) => { ... };
```

## Remotion version

`4.0.473` — see [changelog](https://github.com/remotion-dev/remotion/blob/main/CHANGELOG.md) for latest features.
