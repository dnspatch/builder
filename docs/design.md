# Design

Tracks dnspatch task DNS-59. Status: accepted; the repository holds a skeleton only.

## Audience and product rules

The user knows nothing about networks and wants dynamic DNS working quickly.
Someone who does will write the config and the build by the documentation and
never come here. So:

- The UI speaks in tasks, not in dnspatch terms: "where is your domain", "how to
  find your address", not "provider" and "retriever". Terms are explained inline.
- Safe defaults are preselected; every knob beyond them sits under "Advanced".
- Nobody is asked to type a secret into the page. Secret fields are filled with
  placeholders such as `${CLOUDFLARE_TOKEN}` (dnspatch reads them from the
  environment or a file) and the tool also produces the matching `.env` template.
- A custom build is offered only when it is needed. If the config uses only the
  default plugins the helper says "no build needed, use the official image"; if it
  needs `ping` or notifiers, it points to the `-full` image; only a wish for a
  minimal binary leads to a custom build.

## The two tools

1. **Config constructor.** Blocks (where the address comes from, where the domain
   lives, how to be told about problems), forms generated from the plugin schema,
   live preview of `dnspatch.toml`, copy or download, a short "how to run it" for
   Docker, Linux and Windows. Later: per-field hints on where to find a value (a
   Cloudflare zone id, a DuckDNS token).
2. **Build helper.** Input: a pasted config, or a hand-picked list of plugins, plus
   the target (Docker, Linux, Raspberry Pi, router, Windows, macOS). Output: the
   tags, `go install` and `docker build` lines, and an optional "Build it" button.

## Stack

| Concern | Decision | Why |
|---|---|---|
| Hosting | GitHub Pages project site, `dnspatch.github.io/builder`, deployed by Actions | Free, fits "a static tool"; a custom domain can come later |
| Language | TypeScript, `strict` | Schema-driven forms need types |
| UI | Preact 11 | 4 KB, enough for forms and a preview, no heavy framework |
| Build | Vite | Static output with a `base` path for Pages |
| Routing | hash (`#/config`, `#/build`) | Pages has no SPA fallback, so no 404 workaround |
| Styling | Plain CSS with custom properties, light and dark | No CSS framework; system fonts, nothing fetched |
| TOML | `smol-toml` to parse, own emitter | Parsing a pasted config; the emitter keeps order and writes comments, which no library does |
| i18n | Russian and English dictionaries, typed keys | The audience is Russian-speaking first; no library needed |
| Lint, format | Biome | One tool instead of ESLint plus Prettier |
| Tests | Vitest; Playwright later for the two main flows | |

Runtime dependencies are exactly two: `preact` and `smol-toml`. A third needs a
reason in the PR.

## Schema: the single source of truth

dnspatch publishes `schema.json` as an asset of every release since `v0.4.4-rc.1`
(DNS-77), produced by `cmd/gendoc` from the same struct tags that make
`docs/PARAMETERS.md`. Format `schema_version: 1`, described in dnspatch's
`docs/development/writing-a-plugin.md`; the types are in `src/core/schema.ts`:

- plugin: `kind` (retriever, provider, notifier), `name` (the `type` in a config),
  `build_tags` (any one compiles the plugin in), `fields`;
- field: `name` (`table.key` for a nested table), `type`, `required`,
  `required_if`, `default`, `example`, `description`, `secret`.

The version grows only on incompatible changes. The schema has **no plugin title
and no list of allowed values**; until dnspatch adds them, the titles and the
choices live in `content/` here.

Delivery is at build time, not at runtime. `scripts/fetch-schemas.mjs` (run as
`npm run schemas`) downloads the schemas of the latest five releases, prereleases
included, into `public/schema/<tag>.json` and writes `index.json` with the default
version (the newest stable release, else the newest prerelease). The Pages workflow
runs it before every build and is triggered by `repository_dispatch`
(`schema-released`, sent by the dnspatch release), by a nightly schedule as a safety
net, and by hand. A browser cannot reliably read GitHub release assets (CORS), and
a self-contained bundle has no runtime third parties anyway. Releases without a
schema, or with an unsupported `schema_version`, are skipped.

Texts that a Go tag is a bad home for (titles, where to find a value, links) live
in `src/content/plugins.ts`, keyed by `kind/name` and field, in Russian and English.
The constructor offers only the plugins listed in `featured` there; the helper
offers every plugin of the schema. Fields `base_url` and `proxy` are hidden from
the constructor: they are for people who write the file by hand.

## Shared core (`src/core`)

Pure functions, no DOM, unit-tested:

- `schema`: load, index by kind and name.
- `toml`: emit a config from the form state; parse a pasted config.
- `tags`: from a config or a plugin list to the build tags, using the schema.
- `profile`: target to `GOOS`, `GOARCH`, `GOARM`, `GOMIPS`.

Both tools sit on top of them, so the constructor's output can be fed to the
helper directly.

## Correctness check against dnspatch

CI downloads the dnspatch release and runs `dnspatch --check-config` on golden
configs generated by the constructor for every plugin. A schema change that breaks
generated configs fails here, not for a user.

## The "Build it" button

The page never builds anything. The build service is a separate project on the
owner's VPS. This repository only fixes the contract and ships a client behind a
feature flag (`VITE_BUILD_API`; empty means the button is hidden):

```
POST {api}/builds    {version, tags[], os, arch, arm?, mips?, format: "binary" | "docker"}
                     -> {id}
GET  {api}/builds/{id}  -> {status: queued|running|done|failed, url?, sha256?, error?}
```

- The request carries only the version, tags and target. **Never the config.**
- `id` is a hash of the request, so identical requests are idempotent and cached.
- The service validates tags against the release schema (allowlist) and must allow
  CORS from `https://dnspatch.github.io`. Abuse protection (rate limit, queue
  bound, possibly a proof of work) is the service's job.
- Polling, no websockets. On failure the page falls back to showing the commands.

## Constraints

- No backend, no accounts, no analytics, no cookies. A draft may be kept in
  `localStorage`, without secrets.
- Pages cannot set response headers, so the CSP is a `<meta>` tag
  (`default-src 'self'`; `connect-src` adds the build API origin when configured).
  Nothing is loaded from CDNs; fonts are system fonts.
- Browsers: current evergreen. Without JavaScript the page shows a plain message.
- Budget: initial JavaScript under 100 KB gzipped (schemas load lazily per version).
- Accessible: a label on every field, keyboard operable, AA contrast.
- Pages limits (1 GB site, 100 GB a month) are far above this site's size.

## Repository layout

```
src/core          pure logic and its tests
src/tools/config  config constructor
src/tools/build   build helper
src/content       per-plugin titles and help texts, ru and en
public/schema     release schemas, fetched by CI
e2e               browser tests
```

## Phases

1. Done: shared core, schema loading, the constructor, the helper without the build
   button.
2. Done: hints for twelve providers (`dyndns2` and `rfc2136` are left to people who
   write the file by hand), the golden `--check-config` check for each of them, e2e
   tests in Playwright with the browser that is installed (`PW_CHANNEL`, Chrome by
   default). Secrets too awkward for an environment variable, such as the Yandex
   Cloud JSON key, are read from files under `/etc/dnspatch/secrets` with
   `${file:...}`.
3. The "Build it" client, once the service exists.
4. Share links without secrets, a custom domain.

## Open questions

- Which plugins to show first in the constructor (proposal: the five most used).
- A custom domain, or stay on `dnspatch.github.io/builder`.
- Whether the build service lives in this organization.
