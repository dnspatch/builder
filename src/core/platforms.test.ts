import { describe, expect, test } from "vitest";
import {
  buildCommand,
  findPlatform,
  platforms,
  prepareCommand,
} from "./platforms";

describe("buildCommand", () => {
  test("sets GOARM for 32-bit ARM", () => {
    expect(buildCommand(findPlatform("linux-arm"), "a,b", "posix", false)).toBe(
      'CGO_ENABLED=0 GOOS=linux GOARCH=arm GOARM=7 go build -trimpath -tags "a,b" -ldflags "-s -w" -o dnspatch github.com/dnspatch/dnspatch/cmd/dnspatch',
    );
  });

  test("sets GOMIPS=softfloat for MIPS routers", () => {
    for (const id of ["linux-mips", "linux-mipsle"]) {
      expect(buildCommand(findPlatform(id), "a", "posix", false)).toContain(
        "GOMIPS=softfloat",
      );
    }
  });

  test("names the Windows binary .exe and uses $env in PowerShell", () => {
    const cmd = buildCommand(
      findPlatform("windows-amd64"),
      "a",
      "powershell",
      false,
    );
    expect(cmd).toContain('$env:GOOS="windows"');
    expect(cmd).toContain("-o dnspatch.exe");
  });

  test("ids are unique", () => {
    const ids = platforms.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("prepareCommand", () => {
  test("makes a module that pulls the release in", () => {
    expect(prepareCommand("v1.2.3", false, "posix")).toContain(
      "go get github.com/dnspatch/dnspatch/cmd/dnspatch@v1.2.3",
    );
  });
});

describe("with an unpacked Go", () => {
  test("calls go by its path and stays in the current folder", () => {
    const prepare = prepareCommand("v1.2.3", true, "posix");
    expect(prepare).not.toContain("cd ");
    expect(prepare).toContain("./go/bin/go mod init build");
    expect(
      buildCommand(findPlatform("linux-arm64"), "a", "posix", true),
    ).toContain("./go/bin/go build");
  });
});

describe("cmd.exe", () => {
  test("sets variables with set and calls an unpacked Go with backslashes", () => {
    const cmd = buildCommand(findPlatform("linux-arm64"), "a", "cmd", true);
    expect(cmd).toContain("set GOOS=linux");
    expect(cmd).toContain(".\\go\\bin\\go build");
    expect(prepareCommand("v1", true, "cmd")).toContain(
      ".\\go\\bin\\go mod init",
    );
  });
});
