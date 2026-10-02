# dnspatch builder

A static web page that helps people who are not into networking set up
[dnspatch](https://github.com/dnspatch/dnspatch), a dynamic DNS daemon.

- **Config constructor**: assemble `dnspatch.toml` from blocks, with hints on
  where to find each value.
- **Build helper**: from a config or a list of providers, get the build tags and
  the command; optionally ask the build service for a ready binary or Docker image.

Everything runs in the browser. Secrets never leave it. Design and decisions:
[docs/design.md](docs/design.md).

## Development

```bash
npm ci
npm run dev      # http://localhost:5173/builder/
npm test
npm run lint
npm run build
```

## License

MIT, see [LICENSE](LICENSE).
