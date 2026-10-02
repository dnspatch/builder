import { describe, expect, test } from "vitest";
import { zip } from "./zip";

describe("zip", () => {
  const archive = zip([
    { name: "a.txt", text: "hello" },
    { name: ".env", text: "X=1\n" },
  ]);
  const view = new DataView(archive.buffer);

  test("starts with a local header and ends with the directory record", () => {
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(archive.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(archive.length - 22 + 10, true)).toBe(2);
  });

  test("stores the data as it is with the right CRC", () => {
    // CRC-32 of "hello" is 0x3610a686.
    expect(view.getUint32(14, true)).toBe(0x3610a686);
    expect(new TextDecoder().decode(archive.slice(35, 40))).toBe("hello");
  });
});
