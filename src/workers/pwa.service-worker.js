self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Получение данных о будильниках для планирования уведомлений
  if (event.data && event.data.type === "SCHEDULE_ALARM") {
    const alarm = event.data.alarm;
    scheduleAlarmNotification(alarm);
  }

  // Отмена ранее запланированного будильника
  if (event.data && event.data.type === "CANCEL_ALARM") {
    const alarmId = event.data.alarmId;
    cancelAlarmNotification(alarmId);
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

const manifest = self.__WB_MANIFEST.filter((entry) => {
  return !entry.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
});

precacheAndRoute(manifest);

// Обработчик уведомлений - когда пользователь нажимает на уведомление
self.addEventListener("notificationclick", (event) => {
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
    cancelAlarmNotification(alarm.id);
  }

  const alarmTime = new Date(alarm.time).getTime();
  const now = Date.now();
  const delay = alarmTime - now;

  // Если время уже прошло или менее секунды до срабатывания, ничего не делаем
  if (delay < 1000) return;

  // Планируем уведомление
  const timeoutId = setTimeout(() => {
    showNotification(alarm);
    scheduledAlarms.delete(alarm.id);
  }, delay);

  scheduledAlarms.set(alarm.id, timeoutId);
}

// Функция для отмены запланированного уведомления
function cancelAlarmNotification(alarmId) {
  if (scheduledAlarms.has(alarmId)) {
    clearTimeout(scheduledAlarms.get(alarmId));
    scheduledAlarms.delete(alarmId);
  }
}

// Функция для показа уведомления
function showNotification(alarm) {
  self.registration.showNotification("Будильник", {
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
  });
}
