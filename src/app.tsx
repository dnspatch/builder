import { useEffect, useState } from "preact/hooks";
import {
  loadIndex,
  loadSchema,
  type Schema,
  type SchemaIndex,
} from "./core/schema";
import { setLang, t, useLang } from "./i18n";
import { BuildTool } from "./tools/build/BuildTool";
import { ConfigTool } from "./tools/config/ConfigTool";

type Route = "config" | "build";

function routeFromHash(): Route {
  return location.hash.startsWith("#/build") ? "build" : "config";
}

interface Loaded {
  index: SchemaIndex;
  tag: string;
  schema: Schema;
}

export function App() {
  const lang = useLang();
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const open = async (index: SchemaIndex, tag: string) => {
    try {
      setLoaded({ index, tag, schema: await loadSchema(tag) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    loadIndex()
      .then((index) => open(index, index.default))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <>
      <header>
        <strong>{t("appTitle")}</strong>
        <nav>
          <a
            href="#/config"
            aria-current={route === "config" ? "page" : undefined}
          >
            {t("navConfig")}
          </a>
          <a
            href="#/build"
            aria-current={route === "build" ? "page" : undefined}
          >
            {t("navBuild")}
          </a>
        </nav>
        <span class="tools">
          {loaded && loaded.index.versions.length > 1 && (
            <select
              aria-label={t("version")}
              value={loaded.tag}
              onChange={(e) => open(loaded.index, e.currentTarget.value)}
            >
              {loaded.index.versions.map((v) => (
                <option key={v.tag} value={v.tag}>
                  {v.tag}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          >
            {lang === "ru" ? "EN" : "RU"}
          </button>
        </span>
      </header>
      <main>
        {error && <p class="warn">{t("loadError", { error })}</p>}
        {!error && !loaded && <p>{t("loading")}</p>}
        {loaded && route === "config" && <ConfigTool schema={loaded.schema} />}
        {loaded && route === "build" && (
          <BuildTool schema={loaded.schema} version={loaded.tag} />
        )}
      </main>
    </>
  );
}
