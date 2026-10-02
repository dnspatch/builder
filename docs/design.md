# Design

Tracks dnspatch task DNS-59. Status: accepted, nothing but the skeleton is built.

## Problem

A dnspatch build is chosen with build tags (`dnspatch_none,cloudflare,ipify`,
`ping`, `notify_all`, ...). Today the user must read the table in the docs,
install Go, and cross-compile for the target (a router, a Raspberry Pi, a NAS).
Only two flavours are published: the lightweight one and `-full`.

## Goals

1. Recommend a build from what the user runs and needs, without knowing tags.
2. Hand over a ready artifact: a binary for the target, or a Docker image,
   with no Go toolchain on the user's side.
3. Stay a thin layer: dnspatch remains the source of truth for what plugins exist.

Non-goals: accounts, a plugin marketplace, building arbitrary user code or forks.

## Overview

```
browser ──► web (static) ──► API ──► job queue ──► sandboxed worker (go build)
                              │                          │
                              └──── artifact store ◄─────┘   (binary, archive, OCI tarball)
```

Single Go binary: serves the static front end and the API, runs the workers.

## Catalog

The builder must not hardcode plugins. dnspatch already generates its plugin list
(`cmd/genplugins`); it will additionally emit `catalog.json` and attach it to each
release: kind, name, build tag, title, docs link, tag conflicts, and the measured
binary size added by the plugin. The builder reads the catalog of the chosen
release. This is a follow-up task in dnspatch.

## Recommendation

A declarative wizard, data in `profiles/*.yaml`, no logic in code:

1. Where does it run: Docker, Linux server, Raspberry Pi, OpenWrt router, NAS,
   Windows, macOS. This sets the OS/arch preset (for example OpenWrt asks for
   the CPU: `arm`, `arm64`, `mipsle`, `mips`, `amd64`; MIPS needs `GOMIPS=softfloat`).
2. Which DNS provider(s): multi-select with search.
3. How to learn the IP: retrievers (recommend two or more when the fallback and
   consensus mode is wanted).
4. Monitoring and notifications: `ping`, notifier backends.

The result is a profile: tags, target, estimated size, and a one-line rationale
per choice. Minimal builds use `dnspatch_none` plus the chosen plugins.

**Paste a config.** The user may paste an existing `config.toml`; the page reads
the plugin types it uses and derives the exact tags. Parsing happens in the
browser only, because the file holds secrets and never has to leave it.

## Output

Every profile is shown as:

- the tags string, `go install -tags ... ` and `go build` lines;
- a Docker `--build-arg TAGS=...` line and a compose snippet;
- a download: archive (`tar.gz` or `zip`) with a `sha256` file;
- a Docker image as an OCI tarball for `docker load`.

## Build engine

- Source: `go mod download github.com/dnspatch/dnspatch@<tag>` through the module
  proxy, verified by the checksum database. Only released tags are buildable.
- Command: `CGO_ENABLED=0 go build -trimpath -tags <tags> -ldflags "-s -w -X main.version=<v>"`,
  the same as the project's Dockerfile and goreleaser config. `CGO_ENABLED=0`
  makes cross-compiling free.
- Input is never free text: tags come from the release catalog (allowlist),
  OS/arch from a fixed table, the version from the release list.
- Isolation: each job runs in a throwaway rootless container with no network
  (the module cache is pre-warmed read-only), CPU/memory/time limits, and a
  size cap on the output.
- Cache: key is `sha256(version, sorted tags, goos, goarch, goarm/gomips)`; a hit
  returns instantly, requests are idempotent. Go build cache is shared between jobs.
- Docker image: assembled without a Docker daemon with `go-containerregistry`:
  the binary on the same pinned distroless base as the official image, the same
  labels, `nonroot`, healthcheck. Delivered as a tarball first; a short-lived
  registry (`docker pull builder.example/custom/<hash>`) comes later.

## API (sketch)

```
GET  /api/releases                    released versions
GET  /api/catalog?version=v0.4.2      plugins of a release
POST /api/builds                      {version, tags[], os, arch, format} -> {id}
GET  /api/builds/{id}                 status: queued | running | done | failed
GET  /api/builds/{id}/artifact        the file
```

`id` is the cache key, so the same request always yields the same id.

## Security

- No user code runs; only allowlisted tags reach `go build`.
- Per-IP rate limit and a global queue bound; artifacts expire (TTL, LRU).
- Provenance: the page shows the release, tags and the Go version of the build;
  checksums are published; signing (cosign) is a later step.
- Secrets never reach the server: the config paste is client-side only.

## Stack

Go 1.25 (same as dnspatch), `net/http`, `log/slog`, no framework. Front end: plain
ES modules embedded with `go:embed`, no bundler until a real need appears.
Deployment: one container on a small VPS; an artifact volume with a TTL cleaner.

## Phases

1. **Recommend only.** Wizard, catalog, tags and commands. Static, no build
   infrastructure, can be hosted on Pages. Needs `catalog.json` from dnspatch.
2. **Binaries.** Job queue, sandboxed workers, cache, archive download.
3. **Docker.** OCI tarball, then the short-lived registry.
4. **Config paste**, size estimates, signing.

## Open questions

- Where to host and who pays for build CPU (a small VPS with quotas is enough
  to start).
- Retention: how long an artifact lives (proposal: 7 days, rebuilt on demand).
- Whether MIPS and other targets outside the release matrix are supported or
  only the platforms of the official releases.
