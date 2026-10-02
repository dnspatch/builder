import { expect, test } from "vitest";
import { tagsFor } from "./tags";

test("tagsFor starts from the empty build and sorts plugins", () => {
  expect(tagsFor(["ipify", "cloudflare"])).toEqual([
    "dnspatch_none",
    "cloudflare",
    "ipify",
  ]);
});
