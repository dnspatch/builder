import type { PluginInfo } from "./plugins";

const zoneField = {
  label: { ru: "Домен", en: "Domain" },
  where: {
    ru: "Ваш домен целиком, например example.com.",
    en: "Your whole domain, for example example.com.",
  },
  example: "example.com",
};

const recordField = {
  label: { ru: "Имя записи", en: "Record name" },
  where: {
    ru: "Часть перед доменом: home даст home.example.com. Знак @ означает сам домен.",
    en: "The part before the domain: home gives home.example.com. The @ sign means the domain itself.",
  },
  example: "home",
};

const hostnameField = {
  label: { ru: "Адрес целиком", en: "Full hostname" },
  where: {
    ru: "Полное имя, которое нужно обновлять, например home.example.com.",
    en: "The full name to update, for example home.example.com.",
  },
  example: "home.example.com",
};

const ttlField = {
  label: { ru: "Срок жизни записи, секунд", en: "Record lifetime, seconds" },
};

/** Providers the constructor offers after the first four: same shape as `plugins`. */
export const moreProviders: Record<string, PluginInfo> = {
  "provider/beget": {
    title: { ru: "Beget", en: "Beget" },
    summary: {
      ru: "Домен находится на хостинге Beget.",
      en: "The domain is hosted at Beget.",
    },
    fields: {
      zone: zoneField,
      rr_name: recordField,
      username: {
        label: { ru: "Логин Beget", en: "Beget login" },
        where: {
          ru: "Логин, под которым вы входите в панель Beget.",
          en: "The login you use to sign in to the Beget panel.",
        },
      },
      password: {
        label: { ru: "Пароль Beget", en: "Beget password" },
        where: {
          ru: "Пароль от аккаунта Beget.",
          en: "The password of your Beget account.",
        },
      },
    },
  },
  "provider/dyn": {
    title: { ru: "Dyn", en: "Dyn" },
    summary: {
      ru: "Адрес в сервисе Dyn (Oracle Dyn DNS).",
      en: "An address at Dyn (Oracle Dyn DNS).",
    },
    fields: {
      hostname: hostnameField,
      username: {
        label: { ru: "Логин Dyn", en: "Dyn login" },
        where: {
          ru: "Логин вашего аккаунта Dyn.",
          en: "The login of your Dyn account.",
        },
      },
      password: {
        label: { ru: "Ключ Updater Client", en: "Updater client key" },
        where: {
          ru: "Ключ клиента обновления: создаётся в настройках аккаунта. Это не пароль от аккаунта.",
          en: "The updater client key, created in the account settings. It is not the account password.",
        },
      },
    },
  },
  "provider/dynu": {
    title: { ru: "Dynu", en: "Dynu" },
    summary: {
      ru: "Бесплатный адрес на dynu.com.",
      en: "A free address at dynu.com.",
    },
    fields: {
      hostname: hostnameField,
      username: {
        label: { ru: "Логин Dynu", en: "Dynu login" },
        where: {
          ru: "Логин вашего аккаунта Dynu.",
          en: "The login of your Dynu account.",
        },
      },
      password: {
        label: { ru: "Пароль", en: "Password" },
        where: {
          ru: "Пароль аккаунта. Безопаснее задать в настройках Dynu отдельный пароль для обновления IP и использовать его.",
          en: "The account password. Safer: set a separate IP update password in the Dynu account settings and use that.",
        },
      },
    },
  },
  "provider/namecheap": {
    title: { ru: "Namecheap", en: "Namecheap" },
    summary: {
      ru: "Домен зарегистрирован в Namecheap.",
      en: "The domain is registered at Namecheap.",
    },
    fields: {
      domain: {
        label: { ru: "Домен", en: "Domain" },
        where: {
          ru: "Домен точно так же, как он записан в вашем аккаунте Namecheap (важен регистр).",
          en: "The domain exactly as it appears in your Namecheap account (case matters).",
        },
        example: "example.com",
      },
      host: {
        label: { ru: "Имя записи", en: "Host" },
        where: {
          ru: "Знак @ означает сам домен, либо имя записи, например home.",
          en: "The @ sign means the domain itself, or a host name such as home.",
        },
        example: "@",
      },
      password: {
        label: { ru: "Пароль Dynamic DNS", en: "Dynamic DNS password" },
        where: {
          ru: "В Namecheap откройте домен, вкладку Advanced DNS: пароль Dynamic DNS показан там. Это не пароль от аккаунта.",
          en: "In Namecheap open the domain and its Advanced DNS tab: the Dynamic DNS password is shown there. It is not the account password.",
        },
      },
    },
  },
  "provider/nicru": {
    title: { ru: "NIC.RU", en: "NIC.RU" },
    summary: {
      ru: "Домен обслуживается в NIC.RU (РУ-ЦЕНТР).",
      en: "The domain is served by NIC.RU.",
    },
    fields: {
      hostname: {
        ...hostnameField,
        where: {
          ru: "Полное имя записи, например home.example.com. NIC.RU обновит записи с этим именем во всех зонах вашего договора.",
          en: "The full record name, for example home.example.com. NIC.RU updates the records with this name in every zone of your contract.",
        },
      },
      username: {
        label: { ru: "Логин", en: "Login" },
        where: {
          ru: "Логин аккаунта или договора, которому разрешён Dynamic DNS. Услугу нужно включить в личном кабинете.",
          en: "The login of the account or contract allowed to use Dynamic DNS. The service has to be switched on in your account.",
        },
      },
      password: {
        label: { ru: "Пароль", en: "Password" },
        where: {
          ru: "Пароль от этого логина.",
          en: "The password for that login.",
        },
      },
    },
  },
  "provider/selectel": {
    title: { ru: "Selectel", en: "Selectel" },
    summary: {
      ru: "DNS-хостинг в Selectel.",
      en: "DNS hosting at Selectel.",
    },
    fields: {
      zone: zoneField,
      rr_name: recordField,
      project_name: {
        label: { ru: "Имя проекта", en: "Project name" },
        where: {
          ru: "Проект Selectel, в котором создана DNS-зона.",
          en: "The Selectel project the DNS zone belongs to.",
        },
      },
      account_id: {
        label: { ru: "Номер аккаунта", en: "Account ID" },
        where: {
          ru: "Показан в правом верхнем углу панели управления Selectel.",
          en: "Shown in the top right corner of the Selectel control panel.",
        },
      },
      username: {
        label: { ru: "Сервисный пользователь", en: "Service user" },
        where: {
          ru: "Имя сервисного пользователя, которого вы создали для доступа к API.",
          en: "The name of the service user you created for API access.",
        },
      },
      password: {
        label: {
          ru: "Пароль сервисного пользователя",
          en: "Service user password",
        },
        where: {
          ru: "Пароль этого сервисного пользователя.",
          en: "The password of that service user.",
        },
      },
      ttl: ttlField,
    },
  },
  "provider/timeweb": {
    title: { ru: "Timeweb Cloud", en: "Timeweb Cloud" },
    summary: {
      ru: "DNS в Timeweb Cloud.",
      en: "DNS at Timeweb Cloud.",
    },
    fields: {
      zone: zoneField,
      rr_name: recordField,
      token: {
        label: { ru: "API-ключ", en: "API key" },
        where: {
          ru: "В панели управления Timeweb Cloud откройте раздел «API-ключи» и создайте ключ.",
          en: "In the Timeweb Cloud control panel open “API keys” and create a key.",
        },
      },
      ttl: ttlField,
    },
  },
  "provider/yandexcloud": {
    title: { ru: "Yandex Cloud DNS", en: "Yandex Cloud DNS" },
    summary: {
      ru: "DNS-зона в Yandex Cloud.",
      en: "A DNS zone in Yandex Cloud.",
    },
    fields: {
      zone_id: {
        label: { ru: "ID зоны", en: "Zone ID" },
        where: {
          ru: "Показан в консоли Cloud DNS на странице зоны.",
          en: "Shown in the Cloud DNS console on the zone page.",
        },
        example: "dns1234567890abcdefgh",
      },
      rr_name: recordField,
      key: {
        label: { ru: "Авторизованный ключ", en: "Authorized key" },
        where: {
          ru: "JSON-файл ключа сервисного аккаунта (его создаёт команда yc iam key create). У аккаунта должна быть роль dns.editor на каталог зоны. Содержимое файла сохраните в файл ниже.",
          en: "The JSON key file of a service account (made by yc iam key create). The account needs the dns.editor role on the folder of the zone. Save the file's content to the file named below.",
        },
        asFile: true,
      },
      ttl: ttlField,
    },
  },
};
