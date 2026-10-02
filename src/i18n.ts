import { useEffect, useState } from "preact/hooks";

export type Lang = "ru" | "en";

const ru = {
  appTitle: "dnspatch builder",
  navConfig: "Конструктор конфига",
  navBuild: "Помощник сборки",
  version: "Версия dnspatch",
  loading: "Загрузка…",
  loadError: "Не удалось загрузить данные: {error}",

  configTitle: "Настройка dnspatch",
  configIntro:
    "Ответьте на несколько вопросов и получите готовый файл настроек. Всё происходит в вашем браузере: пароли и ключи никуда не отправляются и даже не вводятся.",
  stepProvider: "1. Где находится ваш домен?",
  stepProviderHelp:
    "Выберите сервис, в котором вы управляете доменом. dnspatch будет обновлять там запись, когда меняется ваш IP-адрес.",
  stepFields: "2. Данные вашего домена",
  stepAddress: "3. Как узнавать ваш адрес",
  addressText:
    "Автоматически: dnspatch спрашивает у сервиса ipify, какой у вас сейчас публичный IP-адрес. Ничего настраивать не нужно.",
  secretField:
    "Хранится отдельно от файла настроек: впишите значение в файл .env, в переменную {name}.",
  secretFile:
    "Хранится отдельно от файла настроек: сохраните значение в файл secrets/{name}.",
  whereToFind: "Где взять",
  moreOptions: "Дополнительные настройки",
  required: "обязательно",
  stepResult: "4. Готово",
  missing: "Заполните: {fields}",
  copy: "Копировать",
  copied: "Скопировано",
  download: "Скачать",
  runTitle: "Как запустить",
  runFiles:
    "Положите рядом файлы: {files}. Затем выполните команду в этой папке:",
  runMore: "Другие способы запуска описаны в документации.",

  buildTitle: "Помощник сборки",
  buildIntro:
    "Вставьте ваш dnspatch.toml или отметьте нужные сервисы: подскажем, нужна ли вообще своя сборка.",
  pasteLabel: "Ваш dnspatch.toml (пароли вставлять не нужно)",
  orPick: "Или выберите сами",
  kindRetriever: "Как узнавать адрес",
  kindProvider: "Где домен",
  kindNotifier: "Уведомления",
  needPing: "Мониторинг (ping_url)",
  verdict: "Что вам подойдёт",
  verdictOfficial:
    "Своя сборка не нужна. Готовый образ или бинарник уже содержит всё, что нужно.",
  verdictFull:
    "Нужен вариант «full»: в нём есть мониторинг и уведомления. Своя сборка по-прежнему не обязательна.",
  readyImage: "Готовый образ",
  customTitle: "Нужен самый маленький файл? Соберите свой",
  customHelp:
    "Это нужно, когда места мало (роутер, Raspberry Pi). Понадобится Go или Docker.",
  tagsLabel: "Теги сборки",
  unknownPlugins: "Эта версия dnspatch не знает: {list}",
  parseError: "Не удалось прочитать файл: {error}",
  nothingYet: "Вставьте файл или отметьте сервисы.",
} as const;

export type Key = keyof typeof ru;

const en: Record<Key, string> = {
  appTitle: "dnspatch builder",
  navConfig: "Config constructor",
  navBuild: "Build helper",
  version: "dnspatch version",
  loading: "Loading…",
  loadError: "Could not load the data: {error}",

  configTitle: "Set up dnspatch",
  configIntro:
    "Answer a few questions and get a ready settings file. Everything happens in your browser: passwords and keys are never sent anywhere, or even typed in.",
  stepProvider: "1. Where is your domain?",
  stepProviderHelp:
    "Pick the service where you manage the domain. dnspatch will update the record there whenever your IP address changes.",
  stepFields: "2. Your domain details",
  stepAddress: "3. How to find your address",
  addressText:
    "Automatic: dnspatch asks the ipify service for your current public IP address. Nothing to configure.",
  secretField:
    "Kept apart from the settings file: put the value in the .env file, in the variable {name}.",
  secretFile:
    "Kept apart from the settings file: save the value to the file secrets/{name}.",
  whereToFind: "Where to find it",
  moreOptions: "More options",
  required: "required",
  stepResult: "4. Done",
  missing: "Fill in: {fields}",
  copy: "Copy",
  copied: "Copied",
  download: "Download",
  runTitle: "How to run it",
  runFiles: "Put these files side by side: {files}. Then run in that folder:",
  runMore: "Other ways to run it are in the documentation.",

  buildTitle: "Build helper",
  buildIntro:
    "Paste your dnspatch.toml or tick the services you need: we will tell you whether you need your own build at all.",
  pasteLabel: "Your dnspatch.toml (do not paste passwords)",
  orPick: "Or pick them yourself",
  kindRetriever: "Finding the address",
  kindProvider: "Where the domain is",
  kindNotifier: "Notifications",
  needPing: "Monitoring (ping_url)",
  verdict: "What suits you",
  verdictOfficial:
    "You do not need your own build. The ready-made image or binary has everything.",
  verdictFull:
    "You need the “full” flavour: it has monitoring and notifications. Your own build is still optional.",
  readyImage: "Ready-made image",
  customTitle: "Want the smallest file? Build your own",
  customHelp:
    "Only needed when space is tight (a router, a Raspberry Pi). Needs Go or Docker.",
  tagsLabel: "Build tags",
  unknownPlugins: "This dnspatch version does not know: {list}",
  parseError: "Could not read the file: {error}",
  nothingYet: "Paste a file or tick some services.",
};

const dictionaries: Record<Lang, Record<Key, string>> = { ru, en };

function detect(): Lang {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "ru" || saved === "en") return saved;
  } catch {
    // Storage may be blocked; fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

let current: Lang = detect();
const listeners = new Set<() => void>();

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem("lang", lang);
  } catch {
    // The choice just is not remembered.
  }
  document.documentElement.lang = lang;
  for (const l of listeners) l();
}

export function useLang(): Lang {
  const [, update] = useState(0);
  useEffect(() => {
    const l = () => update((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return current;
}

/** Translates a key for the current language, filling `{name}` placeholders. */
export function t(key: Key, vars: Record<string, string> = {}): string {
  return dictionaries[current][key].replace(
    /\{(\w+)\}/g,
    (_, name: string) => vars[name] ?? "",
  );
}
