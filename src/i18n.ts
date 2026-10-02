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
  stepFields: "Данные вашего домена",
  stepAddress: "2. Как узнавать ваш адрес",
  addressText:
    "dnspatch спрашивает у интернет-сервиса, какой у вас сейчас публичный IP-адрес. Если первый сервис не ответит, он спросит следующий.",
  dragHint: "Порядок можно менять перетаскиванием строки или стрелками.",
  sumOn: "включён",
  sumOff: "выключен",
  sumNone: "нет",
  retrieverPrimary: "Основной",
  retrieverBackup: "Запасной {n}",
  addBackup: "Добавить запасной",
  moveUp: "Выше",
  moveDown: "Ниже",
  remove: "Убрать",
  stepMonitor: "3. Мониторинг (необязательно)",
  monitorIntro:
    "Если dnspatch перестанет работать (выключился компьютер, пропал интернет), вы можете долго об этом не знать. Мониторинг это решает: после каждой проверки dnspatch «стучится» по ссылке в сервис вроде Healthchecks.io или Uptime Kuma, а сервис пишет вам, когда стук прекращается.",
  monitorUse: "Сообщать о работе по ссылке (ping)",
  monitorWhere:
    "Создайте проверку в Healthchecks.io (или Push-монитор в Uptime Kuma) и скопируйте её адрес для пинга. Впишите его в файл .env: ссылка содержит секретный ключ, поэтому в файл настроек она не попадает.",
  monitorFull:
    "Для мониторинга нужен образ latest-full: он уже подставлен в compose.yml.",
  stepNotify: "4. Уведомления (необязательно)",
  notifyIntro:
    "dnspatch сам ничего не отправляет в Telegram или на почту. Он публикует события в брокер сообщений: MQTT (он есть, например, в Home Assistant), RabbitMQ или Redis, а читает их ваша программа или бот. Если у вас такого брокера нет, пропустите этот шаг.",
  notifyUse: "Отправлять события в {name}",
  notifyEvents: "Какие события отправлять",
  notifyFull:
    "Для уведомлений нужен образ latest-full: он уже подставлен в compose.yml.",
  secretField:
    "Хранится отдельно от файла настроек: впишите значение в файл .env, в переменную {name}.",
  secretFile:
    "Хранится отдельно от файла настроек: сохраните значение в файл secrets/{name}.",
  whereToFind: "Где взять",
  moreOptions: "Дополнительные настройки",
  required: "обязательно",
  stepResult: "Результат",
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
  stepFields: "Your domain details",
  stepAddress: "2. How to find your address",
  addressText:
    "dnspatch asks an internet service for your current public IP address. If the first service does not answer, it asks the next one.",
  dragHint: "Change the order by dragging a row, or with the arrows.",
  sumOn: "on",
  sumOff: "off",
  sumNone: "none",
  retrieverPrimary: "Main",
  retrieverBackup: "Backup {n}",
  addBackup: "Add a backup",
  moveUp: "Up",
  moveDown: "Down",
  remove: "Remove",
  stepMonitor: "3. Monitoring (optional)",
  monitorIntro:
    "If dnspatch stops working (the computer is off, the internet is gone), you may not know for a long time. Monitoring solves that: after every check dnspatch calls a link at a service like Healthchecks.io or Uptime Kuma, and the service writes to you when the calls stop.",
  monitorUse: "Report that it is alive by calling a link (ping)",
  monitorWhere:
    "Create a check in Healthchecks.io (or a Push monitor in Uptime Kuma) and copy its ping address. Put it in the .env file: the link holds a secret key, so it stays out of the settings file.",
  monitorFull:
    "Monitoring needs the latest-full image: it is already set in compose.yml.",
  stepNotify: "4. Notifications (optional)",
  notifyIntro:
    "dnspatch does not send anything to Telegram or email by itself. It publishes events to a message broker: MQTT (Home Assistant has one, for example), RabbitMQ or Redis, and your own program or bot reads them. If you have no such broker, skip this step.",
  notifyUse: "Send events to {name}",
  notifyEvents: "Which events to send",
  notifyFull:
    "Notifications need the latest-full image: it is already set in compose.yml.",
  secretField:
    "Kept apart from the settings file: put the value in the .env file, in the variable {name}.",
  secretFile:
    "Kept apart from the settings file: save the value to the file secrets/{name}.",
  whereToFind: "Where to find it",
  moreOptions: "More options",
  required: "required",
  stepResult: "Result",
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
