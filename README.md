# dnspatch builder

A web configurator for [dnspatch](https://github.com/dnspatch/dnspatch) builds.
dnspatch picks its retrievers, providers and notifiers at compile time with
build tags, which gives a small binary but asks the user to know the tags and to
have a Go toolchain. The builder removes both: answer a few questions (or paste
a config), get the exact tags, the commands, and a ready binary or Docker image.

Status: design stage, see [docs/design.md](docs/design.md).

## Development

```bash
go run ./cmd/builder -addr :8080
go test ./...
```

## License

MIT, see [LICENSE](LICENSE).
