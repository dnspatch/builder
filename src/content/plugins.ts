import type { Lang } from "../i18n";

export type L10n = Record<Lang, string>;

export interface FieldInfo {
  label: L10n;
  /** Where to find the value, for those who have never seen the service's panel. */
  where?: L10n;
  /** Shown first, before the optional ones, even when not required. */
  example?: string;
}

export interface PluginInfo {
  title: L10n;
  summary: L10n;
  fields: Record<string, FieldInfo>;
}

/**
 * Fields that stay out of the constructor: they are for people who understand
 * networks and would rather write the file by hand.
 */
export const hiddenFields: ReadonlySet<string> = new Set(["base_url", "proxy"]);

/** What the constructor offers in this version, in order. */
export const featured = {
  retriever: ["ipify"],
  provider: ["cloudflare", "duckdns", "noip", "regru"],
} as const;

/** Texts the release schema does not carry: titles and hints per plugin and field. */
export const plugins: Record<string, PluginInfo> = {
  "retriever/ipify": {
    title: { ru: "ipify", en: "ipify" },
    summary: {
      ru: "Бесплатный сервис, который сообщает ваш публичный IP-адрес.",
      en: "A free service that tells you your public IP address.",
    },
    fields: {},
  },
  "provider/cloudflare": {
    title: { ru: "Cloudflare", en: "Cloudflare" },
    summary: {
      ru: "Домен управляется в Cloudflare.",
      en: "The domain is managed in Cloudflare.",
    },
    fields: {
      zone: {
        label: { ru: "Домен", en: "Domain" },
        where: {
          ru: "Ваш домен целиком, например example.com.",
          en: "Your whole domain, for example example.com.",
        },
        example: "example.com",
      },
      rr_name: {
        label: { ru: "Имя записи", en: "Record name" },
        where: {
          ru: "Часть перед доменом: home даст home.example.com. Знак @ означает сам домен.",
          en: "The part before the domain: home gives home.example.com. The @ sign means the domain itself.",
        },
        example: "home",
      },
      zone_id: {
        label: { ru: "ID зоны (Zone ID)", en: "Zone ID" },
        where: {
          ru: "В панели Cloudflare откройте свой домен: на странице «Обзор» (Overview) справа внизу есть поле Zone ID.",
          en: "Open your domain in the Cloudflare dashboard: the Overview page has a Zone ID field at the bottom right.",
        },
      },
      token: {
        label: { ru: "API-токен", en: "API token" },
        where: {
          ru: "Cloudflare → Мой профиль → API-токены → Создать токен. Выберите шаблон «Изменение DNS зоны» и ограничьте токен вашим доменом.",
          en: "Cloudflare → My Profile → API Tokens → Create Token. Pick the “Edit zone DNS” template and limit the token to your domain.",
        },
      },
      ttl: {
        label: {
          ru: "Срок жизни записи, секунд",
          en: "Record lifetime, seconds",
        },
      },
      proxied: {
        label: {
          ru: "Пропускать через Cloudflare (оранжевое облако)",
          en: "Send through Cloudflare (orange cloud)",
        },
      },
    },
  },
  "provider/duckdns": {
    title: { ru: "DuckDNS", en: "DuckDNS" },
    summary: {
      ru: "Бесплатный адрес вида имя.duckdns.org.",
      en: "A free address like name.duckdns.org.",
    },
    fields: {
      domain: {
        label: { ru: "Имя на DuckDNS", en: "Name on DuckDNS" },
        where: {
          ru: "Только имя без .duckdns.org: для myhome.duckdns.org впишите myhome.",
          en: "Just the name without .duckdns.org: for myhome.duckdns.org enter myhome.",
        },
        example: "myhome",
      },
      token: {
        label: { ru: "Токен", en: "Token" },
        where: {
          ru: "Войдите на duckdns.org: токен показан вверху страницы.",
          en: "Sign in at duckdns.org: the token is shown at the top of the page.",
        },
      },
    },
  },
  "provider/noip": {
    title: { ru: "No-IP", en: "No-IP" },
    summary: {
      ru: "Бесплатный адрес на noip.com, например имя.ddns.net.",
      en: "A free address at noip.com, like name.ddns.net.",
    },
    fields: {
      hostname: {
        label: { ru: "Адрес целиком", en: "Full hostname" },
        where: {
          ru: "Адрес, который вы создали на noip.com, например myhome.ddns.net.",
          en: "The hostname you created at noip.com, for example myhome.ddns.net.",
        },
        example: "myhome.ddns.net",
      },
      username: {
        label: { ru: "Логин", en: "Username" },
        where: {
          ru: "Лучше создать отдельный ключ DDNS в панели No-IP (Dynamic DNS → DDNS Keys) и взять логин оттуда. Подойдёт и логин аккаунта.",
          en: "Better to create a separate DDNS key in the No-IP panel (Dynamic DNS → DDNS Keys) and use its username. The account login works too.",
        },
      },
      password: {
        label: { ru: "Пароль", en: "Password" },
        where: {
          ru: "Пароль того же ключа DDNS или аккаунта.",
          en: "The password of the same DDNS key or account.",
        },
      },
    },
  },
  "provider/regru": {
    title: { ru: "REG.RU", en: "REG.RU" },
    summary: {
      ru: "Домен зарегистрирован или управляется в REG.RU.",
      en: "The domain is registered or managed at REG.RU.",
    },
    fields: {
      zone: {
        label: { ru: "Домен", en: "Domain" },
        where: {
          ru: "Ваш домен целиком, например example.com.",
          en: "Your whole domain, for example example.com.",
        },
        example: "example.com",
      },
      rr_name: {
        label: { ru: "Имя записи", en: "Record name" },
        where: {
          ru: "Часть перед доменом: home даст home.example.com. Знак @ означает сам домен.",
          en: "The part before the domain: home gives home.example.com. The @ sign means the domain itself.",
        },
        example: "home",
      },
      username: {
        label: { ru: "Логин REG.RU", en: "REG.RU login" },
        where: {
          ru: "Логин, под которым вы входите в личный кабинет REG.RU.",
          en: "The login you use to sign in to your REG.RU account.",
        },
      },
      password: {
        label: { ru: "Пароль для API", en: "API password" },
        where: {
          ru: "В личном кабинете REG.RU задайте отдельный пароль для API и разрешите доступ с адреса, где работает dnspatch.",
          en: "In your REG.RU account set a separate API password and allow access from the address dnspatch runs from.",
        },
      },
    },
  },
};

export function pluginInfo(kind: string, name: string): PluginInfo | undefined {
  return plugins[`${kind}/${name}`];
}
