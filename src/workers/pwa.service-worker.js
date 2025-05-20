import { precacheAndRoute } from "workbox-precaching";

// Переменная для отслеживания последнего времени активности
let lastActivityTime = Date.now();

self.addEventListener("message", (event) => {
  console.log("Service worker received message:", event.data);

  // Обновление времени последней активности при любом сообщении
  lastActivityTime = Date.now();

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Получение данных о будильниках для планирования уведомлений
  if (event.data && event.data.type === "SCHEDULE_ALARM") {
    const alarm = event.data.alarm;
    console.log("Scheduling alarm notification:", alarm);
    scheduleAlarmNotification(alarm);
  }

  // Отмена ранее запланированного будильника
  if (event.data && event.data.type === "CANCEL_ALARM") {
    const alarmId = event.data.alarmId;
    console.log("Canceling alarm notification:", alarmId);
    cancelAlarmNotification(alarmId);
  }

  // Обработка пинг-сообщения для поддержания активности
  if (event.data && event.data.type === "KEEP_ALIVE_PING") {
    console.log(
      "Received keep-alive ping at:",
      new Date().toLocaleTimeString(),
    );

    // Отвечаем на пинг, чтобы подтвердить, что SW активен
    if (event.source) {
      event.source.postMessage({
        type: "KEEP_ALIVE_PONG",
        timestamp: Date.now(),
      });
    }

    // Проверяем все запланированные будильники и обновляем их статус
    refreshAlarmTimeouts();
  }
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  self.skipWaiting();
});

const manifest = self.__WB_MANIFEST.filter((entry) => {
  return !entry.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
});

precacheAndRoute(manifest);

// Обработчик уведомлений - когда пользователь нажимает на уведомление
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);
  event.notification.close();

  // Открыть приложение при клике на уведомление
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      // Если уже открыто окно - фокусируемся на нем
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url.includes(self.location.origin)
          ? (windowClient.focus(), true)
          : false,
      );

      // Иначе открываем новое окно
      if (!hadWindowToFocus)
        self.clients
          .openWindow("/")
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
    }),
  );
});

// Хранилище для запланированных будильников (id: timeoutId)
const scheduledAlarms = new Map();

// Функция для повторной проверки и обновления таймеров всех будильников
function refreshAlarmTimeouts() {
  console.log("Refreshing all alarm timeouts");

  if (scheduledAlarms.size === 0) {
    console.log("No alarms to refresh");
    return;
  }

  // Временный массив для хранения данных будильников
  const alarmsToReschedule = [];

  // Собираем данные будильников и очищаем старые таймеры
  for (const [alarmId, data] of scheduledAlarms.entries()) {
    if (data.alarm) {
      clearTimeout(data.timeoutId);
      alarmsToReschedule.push(data.alarm);
      console.log(`Cleared timeout for alarm: ${alarmId}`);
    }
  }

  // Перепланируем все будильники
  for (const alarm of alarmsToReschedule) {
    scheduleAlarmNotification(alarm);
  }

  console.log(`Refreshed ${alarmsToReschedule.length} alarm timeouts`);
}

// Функция для планирования уведомления будильника
function scheduleAlarmNotification(alarm) {
  // Отмена предыдущего таймера, если он существует
  if (scheduledAlarms.has(alarm.id)) {
    console.log("Canceling existing alarm timer for:", alarm.id);
    cancelAlarmNotification(alarm.id);
  }

  const alarmTime = new Date(alarm.time).getTime();
  const now = Date.now();
  const delay = alarmTime - now;

  console.log(
    `Alarm time: ${new Date(alarmTime).toLocaleString()}, delay: ${delay}ms`,
  );

  // Если время уже прошло или менее секунды до срабатывания, ничего не делаем
  if (delay < 1000) {
    console.log("Alarm time already passed or too close, skipping");
    return;
  }

  // Планируем уведомление
  console.log(`Setting timeout for ${delay}ms`);
  const timeoutId = setTimeout(() => {
    console.log("Alarm triggered, showing notification for:", alarm.name);
    showNotification(alarm);
    scheduledAlarms.delete(alarm.id);
  }, delay);

  // Сохраняем ссылку на таймер и данные будильника
  scheduledAlarms.set(alarm.id, {
    timeoutId: timeoutId,
    alarm: alarm,
    scheduledTime: alarmTime,
  });

  console.log("Scheduled alarms count:", scheduledAlarms.size);
}

// Функция для отмены запланированного уведомления
function cancelAlarmNotification(alarmId) {
  if (scheduledAlarms.has(alarmId)) {
    const data = scheduledAlarms.get(alarmId);
    clearTimeout(data.timeoutId);
    scheduledAlarms.delete(alarmId);
    console.log("Alarm canceled for:", alarmId);
    console.log("Remaining scheduled alarms:", scheduledAlarms.size);
  } else {
    console.log("No alarm found to cancel for:", alarmId);
  }
}

// Функция для показа уведомления
function showNotification(alarm) {
  console.log("Showing notification for alarm:", alarm);

  // Проверяем поддержку уведомлений
  if (!self.registration.showNotification) {
    console.error("Notifications not supported by this browser/device");
    return;
  }

  // Попытка показать уведомление
  try {
    self.registration
      .showNotification("Будильник", {
        body: alarm.name,
        icon: "/icon-192x192.png",
        tag: alarm.id,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 400],
        actions: [
          {
            action: "close",
            title: "Закрыть",
          },
        ],
      })
      .then(() => {
        console.log("Notification shown successfully");
      })
      .catch((error) => {
        console.error("Error showing notification:", error);
      });
  } catch (error) {
    console.error("Exception showing notification:", error);
  }
}

// Периодическая самопроверка для iOS (проверяем наличие "засыпания")
setInterval(() => {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;

  console.log(
    `Self-check: Time since last activity: ${timeSinceLastActivity}ms`,
  );

  // Если прошло больше 30 секунд с последней активности, проверяем будильники
  if (timeSinceLastActivity > 30000) {
    console.log("Long time since last activity, refreshing alarms");
    lastActivityTime = now;
    refreshAlarmTimeouts();
  }

  // Проверяем, не пропустили ли мы какие-то будильники из-за "засыпания"
  for (const [alarmId, data] of scheduledAlarms.entries()) {
    if (data.scheduledTime <= now) {
      console.log(`Detected missed alarm during self-check: ${alarmId}`);
      // Показываем уведомление для пропущенного будильника
      showNotification(data.alarm);
      scheduledAlarms.delete(alarmId);
    }
  }
}, 25000); // Проверка каждые 25 секунд
