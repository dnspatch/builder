// Downloads schema.json of the latest dnspatch releases into public/schema/ and
// writes public/schema/index.json. Run before a build: a browser cannot read
// release assets (CORS), so the schemas have to be part of the bundle.
//
// Needs Node 22+. GITHUB_TOKEN is optional and only raises the API rate limit.
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const repo = process.env.DNSPATCH_REPO ?? "dnspatch/dnspatch";
const keep = Number(process.env.SCHEMA_KEEP ?? 5);
const supported = 1;
const outDir = join(import.meta.dirname, "..", "public", "schema");

const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function get(url, init) {
  const res = await fetch(url, { headers, ...init });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return res;
}

const releases = await (await get(`https://api.github.com/repos/${repo}/releases?per_page=30`)).json();

const versions = [];
for (const rel of releases) {
  if (rel.draft || versions.length >= keep) continue;
  const asset = rel.assets.find((a) => a.name === "schema.json");
  if (!asset) continue;

  const schema = await (await get(asset.browser_download_url)).json();
  if (schema.schema_version !== supported) {
    console.warn(`skip ${rel.tag_name}: schema_version ${schema.schema_version}, supported ${supported}`);
    continue;
  }
  versions.push({ tag: rel.tag_name, prerelease: rel.prerelease, schema });
}

if (versions.length === 0) throw new Error(`no release of ${repo} has a supported schema.json`);

await mkdir(outDir, { recursive: true });
for (const f of await readdir(outDir)) {
  if (f.endsWith(".json")) await rm(join(outDir, f));
}
for (const v of versions) {
  await writeFile(join(outDir, `${v.tag}.json`), JSON.stringify(v.schema));
}

// The first stable release is the default; with none, the newest prerelease.
const stable = versions.find((v) => !v.prerelease);
const index = {
  default: (stable ?? versions[0]).tag,
  versions: versions.map(({ tag, prerelease }) => ({ tag, prerelease })),
};
await writeFile(join(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`schemas: ${versions.map((v) => v.tag).join(", ")} (default ${index.default})`);
