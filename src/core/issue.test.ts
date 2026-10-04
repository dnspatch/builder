import { describe, expect, test } from "vitest";
import { pluginRequestUrl } from "./issue";

const base = {
  service: " Gandi ",
  apiDocs: "https://api.gandi.net/docs/",
  why: "My domain lives there.",
  extra: "",
};

describe("pluginRequestUrl", () => {
  test("fills the fields of the provider request form", () => {
    const url = new URL(pluginRequestUrl("provider", base));
    expect(url.origin + url.pathname).toBe(
      "https://github.com/dnspatch/dnspatch/issues/new",
    );
    expect(url.searchParams.get("template")).toBe("provider_request.yml");
    expect(url.searchParams.get("title")).toBe("Provider request: Gandi");
    expect(url.searchParams.get("service")).toBe("Gandi");
    expect(url.searchParams.get("api-docs")).toBe(base.apiDocs);
    expect(url.searchParams.get("why")).toBe(base.why);
  });

  test("opens the retriever form for a retriever", () => {
    const url = new URL(pluginRequestUrl("retriever", base));
    expect(url.searchParams.get("template")).toBe("retriever_request.yml");
    expect(url.searchParams.get("title")).toBe("Retriever request: Gandi");
  });

  test("opens the notifier form for a notifier", () => {
    const url = new URL(pluginRequestUrl("notifier", base));
    expect(url.searchParams.get("template")).toBe("notifier_request.yml");
    expect(url.searchParams.get("title")).toBe("Notifier request: Gandi");
  });

  test("leaves the optional field out when it is empty", () => {
    const url = new URL(pluginRequestUrl("provider", base));
    expect(url.searchParams.has("auth")).toBe(false);
  });

  test("puts the last field under the id its form uses", () => {
    const extra = { ...base, extra: "plain text" };
    const provider = new URL(pluginRequestUrl("provider", extra));
    const retriever = new URL(pluginRequestUrl("retriever", extra));
    expect(provider.searchParams.get("auth")).toBe("plain text");
    expect(retriever.searchParams.get("details")).toBe("plain text");
  });
});
