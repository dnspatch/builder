import type { L10n, PluginInfo } from "./plugins";

/** Retrievers and notifiers offered by the constructor: same shape as `plugins`. */
export const extras: Record<string, PluginInfo> = {
  "retriever/2ip": {
    title: { ru: "2ip.io", en: "2ip.io" },
    summary: {
      ru: "Сервис 2ip.io сообщает ваш публичный адрес.",
      en: "The 2ip.io service reports your public address.",
    },
    fields: {},
  },
  "retriever/icanhazip": {
    title: { ru: "icanhazip", en: "icanhazip" },
    summary: {
      ru: "Сервис icanhazip.com сообщает ваш публичный адрес.",
      en: "The icanhazip.com service reports your public address.",
    },
    fields: {},
  },
  "retriever/identme": {
    title: { ru: "ident.me", en: "ident.me" },
    summary: {
      ru: "Сервис ident.me сообщает ваш публичный адрес.",
      en: "The ident.me service reports your public address.",
    },
    fields: {},
  },
  "retriever/ifconfigco": {
    title: { ru: "ifconfig.co", en: "ifconfig.co" },
    summary: {
      ru: "Сервис ifconfig.co сообщает ваш публичный адрес.",
      en: "The ifconfig.co service reports your public address.",
    },
    fields: {},
  },
  "notifier/mqtt": {
    title: { ru: "MQTT", en: "MQTT" },
    summary: {
      ru: "Например, Mosquitto в Home Assistant.",
      en: "For example Mosquitto in Home Assistant.",
    },
    fields: {
      address: {
        label: { ru: "Адрес брокера MQTT", en: "MQTT broker address" },
        where: {
          ru: "Вида mqtt://логин:пароль@192.168.1.10:1883. Логин и пароль входят в адрес, поэтому адрес хранится как секрет.",
          en: "Like mqtt://user:password@192.168.1.10:1883. The login and password are part of the address, so the address is kept as a secret.",
        },
      },
      qos: {
        label: {
          ru: "Гарантия доставки (0, 1 или 2)",
          en: "Delivery guarantee (0, 1 or 2)",
        },
        where: {
          ru: "0 — не более одного раза, 1 — минимум один раз, 2 — ровно один раз. Подходит значение по умолчанию.",
          en: "0 at most once, 1 at least once, 2 exactly once. The default is fine.",
        },
      },
      retain: {
        label: {
          ru: "Хранить последнее событие на брокере",
          en: "Keep the last event on the broker",
        },
      },
    },
  },
  "notifier/rabbitmq": {
    title: { ru: "RabbitMQ", en: "RabbitMQ" },
    summary: {
      ru: "Брокер сообщений RabbitMQ.",
      en: "The RabbitMQ message broker.",
    },
    fields: {
      address: {
        label: { ru: "Адрес RabbitMQ", en: "RabbitMQ address" },
        where: {
          ru: "Вида amqp://логин:пароль@host:5672/. Логин и пароль входят в адрес, поэтому адрес хранится как секрет.",
          en: "Like amqp://user:password@host:5672/. The login and password are part of the address, so the address is kept as a secret.",
        },
      },
    },
  },
  "notifier/redis": {
    title: { ru: "Redis", en: "Redis" },
    summary: {
      ru: "Redis Pub/Sub: событие получит только тот, кто подключён в этот момент.",
      en: "Redis Pub/Sub: only a subscriber connected at that moment receives an event.",
    },
    fields: {
      address: {
        label: { ru: "Адрес Redis", en: "Redis address" },
        where: {
          ru: "Вида redis://:пароль@host:6379/0. Пароль входит в адрес, поэтому адрес хранится как секрет.",
          en: "Like redis://:password@host:6379/0. The password is part of the address, so the address is kept as a secret.",
        },
      },
    },
  },
};

export interface EventInfo {
  title: L10n;
  hint: L10n;
}

/** What each event type means, in words for someone who has never seen a broker. */
export const events: Record<string, EventInfo> = {
  status: {
    title: { ru: "Сбой и восстановление", en: "Failure and recovery" },
    hint: {
      ru: "Сообщение, когда обновление перестало получаться или снова заработало. Рекомендуется.",
      en: "A message when updating started failing or works again. Recommended.",
    },
  },
  provider_status: {
    title: { ru: "Сбой DNS-сервиса", en: "DNS service failure" },
    hint: {
      ru: "Сообщение, когда не получается записать адрес в ваш DNS-сервис, и когда снова получилось.",
      en: "A message when writing the address to your DNS service fails, and when it works again.",
    },
  },
  retriever_status: {
    title: { ru: "Сбой определения адреса", en: "Address lookup failure" },
    hint: {
      ru: "Сообщение, когда сервис, подсказывающий адрес, не отвечает, и когда снова ответил.",
      en: "A message when the service that tells the address stops answering, and when it answers again.",
    },
  },
  ip_change: {
    title: { ru: "Смена адреса", en: "Address change" },
    hint: {
      ru: "Сообщение, когда ваш адрес изменился и записан в DNS.",
      en: "A message when your address changed and was written to DNS.",
    },
  },
  cycle: {
    title: { ru: "Каждая проверка", en: "Every check" },
    hint: {
      ru: "Сообщение после каждой проверки. Сообщений будет много.",
      en: "A message after every check. There will be many.",
    },
  },
  lifecycle: {
    title: { ru: "Запуск и остановка", en: "Start and stop" },
    hint: {
      ru: "Сообщение, когда dnspatch запустился или остановился.",
      en: "A message when dnspatch started or stopped.",
    },
  },
};
