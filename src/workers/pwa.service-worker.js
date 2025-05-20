import { precacheAndRoute } from "workbox-precaching";

self.addEventListener("message", (event) => {
  console.log("Service worker received message:", event.data);

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

  scheduledAlarms.set(alarm.id, timeoutId);
  console.log("Scheduled alarms count:", scheduledAlarms.size);
}

// Функция для отмены запланированного уведомления
function cancelAlarmNotification(alarmId) {
  if (scheduledAlarms.has(alarmId)) {
    clearTimeout(scheduledAlarms.get(alarmId));
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
        icon: "/icon-192x192.png", // Убедитесь, что этот файл существует в вашем проекте
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
