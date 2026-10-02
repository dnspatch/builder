import type { Lang } from "../i18n";

/** Where the built binary will run: the values `go build` wants in GOOS / GOARCH. */
export interface Platform {
  id: string;
  goos: "linux" | "windows" | "darwin";
  goarch: "amd64" | "arm64" | "arm" | "mips" | "mipsle";
  /** Extra variable the architecture needs: GOARM for 32-bit ARM, GOMIPS for MIPS. */
  extra?: { name: "GOARM" | "GOMIPS"; value: string };
  title: Record<Lang, string>;
  hint: Record<Lang, string>;
}

export const platforms: readonly Platform[] = [
  {
    id: "linux-amd64",
    goos: "linux",
    goarch: "amd64",
    title: { ru: "Linux, обычный компьютер", en: "Linux, regular PC" },
    hint: {
      ru: "Сервер, мини-ПК, виртуалка (x86-64).",
      en: "A server, mini PC or virtual machine (x86-64).",
    },
  },
  {
    id: "linux-arm64",
    goos: "linux",
    goarch: "arm64",
    title: { ru: "Linux, ARM 64 бит", en: "Linux, ARM 64-bit" },
    hint: {
      ru: "Raspberry Pi 3/4/5 с 64-битной системой, современные роутеры (aarch64).",
      en: "Raspberry Pi 3/4/5 with a 64-bit system, modern routers (aarch64).",
    },
  },
  {
    id: "linux-arm",
    goos: "linux",
    goarch: "arm",
    extra: { name: "GOARM", value: "7" },
    title: { ru: "Linux, ARM 32 бит", en: "Linux, ARM 32-bit" },
    hint: {
      ru: "Старые Raspberry Pi, многие роутеры и NAS (armv7).",
      en: "Older Raspberry Pi, many routers and NAS boxes (armv7).",
    },
  },
  {
    id: "linux-mipsle",
    goos: "linux",
    goarch: "mipsle",
    extra: { name: "GOMIPS", value: "softfloat" },
    title: {
      ru: "Роутер на MIPS (little-endian)",
      en: "MIPS router (little-endian)",
    },
    hint: {
      ru: "Многие роутеры TP-Link, Xiaomi, Keenetic; в OpenWrt архитектура mipsel.",
      en: "Many TP-Link, Xiaomi and Keenetic routers; OpenWrt calls it mipsel.",
    },
  },
  {
    id: "linux-mips",
    goos: "linux",
    goarch: "mips",
    extra: { name: "GOMIPS", value: "softfloat" },
    title: {
      ru: "Роутер на MIPS (big-endian)",
      en: "MIPS router (big-endian)",
    },
    hint: {
      ru: "Часть роутеров Atheros/Qualcomm; в OpenWrt архитектура mips.",
      en: "Some Atheros/Qualcomm routers; OpenWrt calls it mips.",
    },
  },
  {
    id: "windows-amd64",
    goos: "windows",
    goarch: "amd64",
    title: { ru: "Windows", en: "Windows" },
    hint: { ru: "Обычный компьютер с Windows.", en: "A regular Windows PC." },
  },
  {
    id: "darwin-arm64",
    goos: "darwin",
    goarch: "arm64",
    title: { ru: "macOS, Apple Silicon", en: "macOS, Apple Silicon" },
    hint: {
      ru: "Mac с чипом M1 и новее.",
      en: "A Mac with an M1 chip or newer.",
    },
  },
  {
    id: "darwin-amd64",
    goos: "darwin",
    goarch: "amd64",
    title: { ru: "macOS, Intel", en: "macOS, Intel" },
    hint: {
      ru: "Mac с процессором Intel.",
      en: "A Mac with an Intel processor.",
    },
  },
];

/** The platform picked when the page opens: the first of the list. */
export const defaultPlatform = platforms[0] as Platform;

/** The platform with the id, or the default one. */
export function findPlatform(id: string): Platform {
  return platforms.find((p) => p.id === id) ?? defaultPlatform;
}

export type Shell = "posix" | "powershell" | "cmd";

/** File name the binary gets on the target. */
export function binaryName(p: Platform): string {
  return p.goos === "windows" ? "dnspatch.exe" : "dnspatch";
}

const modulePath = "github.com/dnspatch/dnspatch/cmd/dnspatch";

/**
 * How to call `go` when it is only unpacked from an archive in the current
 * folder. cmd.exe reads a slash as the start of an option, so it needs backslashes.
 */
export function goCommand(portable: boolean, shell: Shell): string {
  if (!portable) return "go";
  return shell === "cmd" ? ".\\go\\bin\\go" : "./go/bin/go";
}

/**
 * Prepares the folder for the build: a throwaway Go module that pulls the
 * release in. Needs only Go (no git), and the finished file then lands in this
 * very folder. With an unpacked Go the commands run right where it was
 * unpacked, so nothing has to be added to PATH.
 */
export function prepareCommand(
  version: string,
  portable: boolean,
  shell: Shell,
): string {
  const go = goCommand(portable, shell);
  return [
    ...(portable ? [] : ["mkdir dnspatch-build", "cd dnspatch-build"]),
    `${go} mod init build`,
    `${go} get ${modulePath}@${version}`,
  ].join("\n");
}

/**
 * The `go build` command that makes a binary for the platform into the current
 * folder; the variables are set the way the given shell wants them.
 */
export function buildCommand(
  p: Platform,
  tags: string,
  shell: Shell,
  portable: boolean,
): string {
  const vars: [string, string][] = [
    ["CGO_ENABLED", "0"],
    ["GOOS", p.goos],
    ["GOARCH", p.goarch],
    ...(p.extra ? ([[p.extra.name, p.extra.value]] as [string, string][]) : []),
  ];
  const go = `${goCommand(portable, shell)} build -trimpath -tags "${tags}" -ldflags "-s -w" -o ${binaryName(p)} ${modulePath}`;
  if (shell === "posix") {
    return `${vars.map(([k, v]) => `${k}=${v}`).join(" ")} ${go}`;
  }
  if (shell === "cmd") {
    return [...vars.map(([k, v]) => `set ${k}=${v}`), go].join("\n");
  }
  return [...vars.map(([k, v]) => `$env:${k}="${v}"`), go].join("\n");
}
