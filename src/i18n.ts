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
  fold: "Свернуть",
  unfold: "Развернуть",
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
  downloadAll: "Скачать всё архивом",
  toBuildTitle: "Свой образ?",
  toBuildHint:
    "Если нужен нестандартный набор плагинов, проверьте, хватит ли готового образа, и соберите свой.",
  toBuild: "Открыть в помощнике сборки",
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
    "Вам подойдёт готовый образ {image}: в нём уже есть всё, что вы выбрали.",
  verdictFull:
    "Вам подойдёт готовый образ {image}: в нём есть мониторинг и уведомления, которые вы выбрали.",
  customTitle: "Или соберите сборку под себя",
  customHelp:
    "В неё попадёт только то, что вам нужно, поэтому файл получится меньше. Это удобно, когда места мало (роутер, Raspberry Pi). Собирать можно на любом компьютере с Go, а на устройство перенести готовый файл: ни Go, ни Docker там не нужны.",
  platformLabel: "Где будет работать dnspatch",
  helpMeBuild: "Помогите мне собрать dnspatch",
  close: "Закрыть",
  noGo: "У меня не установлен Go",
  noGoTitle: "Go ставить не нужно, достаточно архива",
  noGoStep1: "Скачайте архив Go",
  noGoStep1Rest:
    " для своей системы: для Windows файл .zip, для Linux и macOS файл .tar.gz.",
  noGoStep2: "Распакуйте его в пустую папку: внутри появится папка go.",
  noGoStep3:
    "Откройте терминал в этой папке и выполните команды ниже: они уже написаны под этот случай.",
  goQuestion: "Есть ли у вас Go",
  hasGo: "Go уже установлен",
  hasGoSummary:
    "Команда go version работает в терминале. Команды ниже самые короткие.",
  noGoSummary:
    "Ничего ставить не нужно: скачаете архив и запустите Go прямо из папки.",
  platformHelp:
    "Не знаете, какой у устройства процессор? Выполните на нём команду uname -m: x86_64 это «Linux, обычный компьютер», aarch64 это ARM 64 бит, armv7l это ARM 32 бит, mips или mipsel это MIPS.",
  buildStepPrepare: "1. Подготовьте папку (нужен только Go)",
  buildStepBuild: "2. Соберите файл",
  buildStepMove: "3. Перенесите на устройство",
  buildMove:
    "Скопируйте файл {file} на устройство и запустите его там с вашим dnspatch.toml.",
  shellPosix: "Linux и macOS",
  shellPowershell: "Windows (PowerShell)",
  shellCmd: "Windows (cmd)",
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
  fold: "Fold",
  unfold: "Unfold",
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
  downloadAll: "Download everything as a zip",
  toBuildTitle: "Your own image?",
  toBuildHint:
    "If you need an unusual set of plugins, check whether a ready image is enough, or build your own.",
  toBuild: "Open in the build helper",
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
    "The ready-made image {image} suits you: it already has everything you picked.",
  verdictFull:
    "The ready-made image {image} suits you: it has the monitoring and notifications you picked.",
  customTitle: "Or build one just for you",
  customHelp:
    "It will hold only what you need, so the file is smaller. Handy when space is tight (a router, a Raspberry Pi). You can build on any computer with Go and carry the finished file to the device: neither Go nor Docker is needed there.",
  platformLabel: "Where dnspatch will run",
  helpMeBuild: "Help me build dnspatch",
  close: "Close",
  noGo: "I do not have Go installed",
  noGoTitle: "No need to install Go, an archive is enough",
  noGoStep1: "Download the Go archive",
  noGoStep1Rest:
    " for your system: a .zip file for Windows, a .tar.gz file for Linux and macOS.",
  noGoStep2:
    "Unpack it into an empty folder: a folder named go appears inside.",
  noGoStep3:
    "Open a terminal in that folder and run the commands below: they are already written for this case.",
  goQuestion: "Do you have Go",
  hasGo: "Go is installed",
  hasGoSummary:
    "The go version command works in the terminal. The commands below are the shortest.",
  noGoSummary:
    "Nothing to install: download an archive and run Go right from its folder.",
  platformHelp:
    "Not sure which processor the device has? Run uname -m on it: x86_64 is “Linux, regular PC”, aarch64 is ARM 64-bit, armv7l is ARM 32-bit, mips or mipsel is MIPS.",
  buildStepPrepare: "1. Prepare a folder (only Go is needed)",
  buildStepBuild: "2. Build the file",
  buildStepMove: "3. Move it to the device",
  buildMove:
    "Copy the file {file} to the device and run it there with your dnspatch.toml.",
  shellPosix: "Linux and macOS",
  shellPowershell: "Windows (PowerShell)",
  shellCmd: "Windows (cmd)",
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
