# @dtkt/protoform

Generate editable forms from protobuf message descriptors. Built on
[protobuf-es](https://github.com/bufbuild/protobuf-es) reflection and
[protovalidate](https://github.com/bufbuild/protovalidate-es).

```tsx
import { Message } from "@dtkt/protoform";
import { Protoform, SubmitButton } from "@dtkt/protoform/components";
import { tailwindKit } from "@dtkt/protoform/kit/tailwind";
import "@dtkt/protoform/styles.css";

const message = new Message(MySchema, { name: "example" });

<Protoform message={message} kit={tailwindKit} onSubmit={() => save(message.get())}>
  <SubmitButton>Save</SubmitButton>
</Protoform>
```

`SubmitButton` is drawn by the active kit, so it matches the form (and any kit you swap in).
Other children of `<Protoform>` are rendered as-is: the kit styles only its own elements.

`message.get()` is always the live protobuf message; edits apply immediately.
`onSubmit` only fires when protovalidate passes and no input is unparsable
(`onInvalid` fires otherwise). Errors show after the first submit attempt and
stay current as the user edits (`validateOn="change"` shows them from the first edit).

## Install

```sh
npm install @dtkt/protoform react react-dom
npm install @headlessui/react   # only if you use the Tailwind kit
```

`@headlessui/react` is an *optional* peer dependency: the bare kit doesn't need it, but
`@dtkt/protoform/kit/tailwind` does, and **your app must install it** so it shares your copy of React.

### Troubleshooting: `Cannot read properties of null (reading 'useId')`

This means Headless UI is running against a second copy of React ("Invalid hook call").
It happens when the library is **linked locally** (`npm link`, `file:`, workspaces): the
bundler resolves the library's imports from its real path, so it picks up the library's own
`node_modules` copies of `@headlessui/react` and `react` — even if your app has them
installed. Force a single copy in `vite.config.ts`, then restart with `vite --force` and
hard-reload:

```ts
export default defineConfig({
  resolve: {
    dedupe: [
      "react", "react-dom", "@headlessui/react",
      "@bufbuild/protobuf", "@bufbuild/protovalidate",
      "@connectrpc/connect", "@connectrpc/connect-web",
    ],
  },
});
```

Regular installs from a registry or a packed tarball (`npm pack`) don't need this, but your
app must still install `@headlessui/react` for the Tailwind kit.

## What each type renders

| Proto type | Control |
|---|---|
| `string` | text input (`input.multilineText` hint → textarea) |
| `bool` | switch (`confirm` hint → checkbox) |
| `int32` family | text input, `inputmode=numeric`, range-checked |
| `int64` family | same, kept exact as `bigint` |
| `float`, `double` | text input, accepts `NaN`/`Infinity` |
| `bytes` | base64 text (`file` hint → file picker) |
| `enum` | radio group (≤ 4 values) or select |
| `message` | collapsible section, added/removed explicitly (unset ≠ empty) |
| `repeated` | rows with add, remove, move up/down |
| `map` | rows labelled by key; key input validated for the key type, duplicates rejected |
| `oneof` | case picker plus the selected member |
| `Timestamp`, `Duration`, `FieldMask` | RFC 3339 / `1.5s` / `a,b.c` text with validation (Timestamp has a "Now" button) |
| `Struct`, `Value`, `ListValue` | JSON editor |
| wrappers (`Int32Value`, …) | the wrapped scalar |
| `Any` | type picker from the `Env` registry, then the nested form |

The `select` / `multiSelect` hints (options loaded over RPC) are not implemented yet; those fields fall back to the control for their type.

## Choosing a UI

Rendering goes through a `UIKit`: a small set of primitives (`Form`, `Stack`,
`Row`, `Field`, `Section`, `TextInput`, `TextArea`, `Checkbox`, `Select`,
`RadioGroup`, `FileInput`, `Button`). Three levels:

1. **Tailwind + Headless UI** — `@dtkt/protoform/kit/tailwind` plus `@dtkt/protoform/styles.css`.
   `@headlessui/react` is an optional peer dependency; Tailwind is *not* required in your app.
2. **Bare** (the default when no kit is given) — unstyled, semantic HTML with `data-pf="…"`
   attributes to style against. No CSS, no extra dependencies.
3. **Your own** — pass any subset of primitives; the rest fall back to the enclosing
   provider or the bare kit.

```tsx
import { UIProvider } from "@dtkt/protoform/providers";

// Use MUI buttons everywhere, everything else bare
<UIProvider kit={{ Button: ({ children, onClick, disabled, type }) => (
  <MuiButton type={type} onClick={onClick} disabled={disabled}>{children}</MuiButton>
) }}>
  <Protoform message={message} />
</UIProvider>
```

`<Protoform kit={…}>` takes the same `kit`, `renderers`, `resolve` and `messages`
props as `UIProvider`. Providers nest; inner ones override per primitive.
`defineKit(a, b)` composes kits over the bare kit.

### Theming and dark mode

`styles.css` is prebuilt: no Tailwind setup or global reset, only `.pf-*` classes in
the `protoform` cascade layer (your own unlayered CSS wins). Retheme with CSS custom
properties on the form or any ancestor:

```css
.my-form { --pf-accent: #0d9488; --pf-radius: 0.75rem; }
```

The form uses a system sans-serif font by default. To use your own stack, set
`--pf-font: "Inter", sans-serif;` on the form or any ancestor. To follow your app's
typography, use plain CSS (unlayered CSS beats the `protoform` layer):

```css
.pf-form { font-family: inherit; }
```

(`--pf-font: inherit` does *not* work: for a custom property, `inherit` means "take the
parent's `--pf-font`", not "inherit `font-family`".)

Dark mode follows `prefers-color-scheme`. Force it with `.dark` / `[data-theme="dark"]`
(or `.light` / `[data-theme="light"]`) on the form or any ancestor.

### Custom renderers

Replace the editor for individual fields without touching the kit. Keys are a
field's full name (`pkg.Message.field`) or the type name of its message/enum:

```tsx
const TimestampPicker: FieldRenderer = ({ field, id }) => <MyDatePicker id={id} field={field} />;

<Protoform
  message={message}
  renderers={{ "google.protobuf.Timestamp": TimestampPicker }}
  resolve={(field) => field.desc.name === "secret" ? SecretInput : undefined}
/>
```

A renderer is wrapped in the standard labelled field frame; set `Renderer.frame = "none"`
to draw your own (see `FieldSection`).

### Translating

All built-in strings live in `defaultMessages`; override any with the `messages` prop.

## Environment

`Env` (via `EnvProvider`) supplies the type registry (needed for `Any`), validator and
transport. The default transport is created lazily, so importing the package has no side effects.

```tsx
const env = new Env({ registry, anyTypeFilter: (name) => name.startsWith("acme.") });
```

## Development

### Playground

An interactive playground lives in [`playground/`](./playground). It renders a form for a
fixture message covering every field type, with live JSON output beside it, and toggles for
kit (Tailwind / bare), theme (system / light / dark) and read-only mode.

```sh
npm install
npm run dev        # → http://localhost:5173
```

Edits to `lib/` (components, kits, `lib/styles/protoform.css`) hot-reload. To try your own
message, change what `playground/main.tsx` renders — the fixture schema is in
`lib/test/fixture.ts`, or import any generated schema from your own protos.

`npm run build` produces the publishable package in `dist/`. (There is no `vite preview`
target: the build is a library, not an app. Use the playground to see it.)

### Scripts

```sh
npm run dev            # playground with HMR
npm test               # vitest (jsdom), single run
npm run test:watch     # vitest in watch mode
npm run test:coverage  # coverage report (v8) in the terminal and ./coverage
npm run lint           # eslint
npm run build          # tsc, library (vite), then dist/styles.css (tailwind CLI)
```

### Tests

Tests are co-located with the code they cover (`foo.ts` → `foo.test.ts`,
`components/foo.tsx` → `components/foo.test.tsx`). Shared helpers live in
[`lib/test/`](./lib/test): `fixture.ts` builds a schema at runtime covering every field type
plus annotated ("hinted") fields, `render.tsx` renders a form with an `Env`, and
`helpers.ts` has the typed data accessors. UI tests run against **every shipped kit**
(`describe.each(kits)`), so a new kit or primitive is exercised by the whole suite.
