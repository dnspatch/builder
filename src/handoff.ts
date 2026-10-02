const key = "dnspatch.handoff";

/** Leaves a config for the build helper and opens its page. */
export function sendToBuild(config: string) {
  try {
    sessionStorage.setItem(key, config);
  } catch {
    // Storage can be blocked; the build page then opens empty.
  }
  location.hash = "#/build";
}

/** Takes the config left by the constructor, once. */
export function takeHandoff(): string {
  try {
    const config = sessionStorage.getItem(key) ?? "";
    sessionStorage.removeItem(key);
    return config;
  } catch {
    return "";
  }
}
