import type { Alarm } from "../types";

// Функция для проверки поддержки уведомлений
export const checkNotificationSupport = (): boolean => {
  const isSupported = "Notification" in window && "serviceWorker" in navigator;
  console.log("Notifications supported:", isSupported);
  return isSupported;
};

// Функция для запроса разрешения на уведомления
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!checkNotificationSupport()) {
    console.warn("Notification support is not available");
    return false;
  }

  try {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("Notification permission result:", permission);
    return permission === "granted";
  } catch (error) {
    console.error("Ошибка при запросе разрешения на уведомления:", error);
    return false;
  }
};

// Получение статуса разрешения на уведомления
export const getNotificationPermissionStatus = (): string => {
  if (!checkNotificationSupport()) return "unsupported";
  const status = Notification.permission;
  console.log("Current notification permission status:", status);
  return status;
};

// Получение активной регистрации service worker
export const getServiceWorkerRegistration =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) {
      console.warn("ServiceWorker is not supported in this browser");
      return null;
    }

    try {
      console.log("Waiting for service worker to be ready...");
      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker registration obtained:", registration);
      return registration;
    } catch (error) {
      console.error("Ошибка при получении регистрации service worker:", error);
      return null;
    }
  };

// Функция для планирования уведомления будильника
export const scheduleAlarmNotification = async (
  alarm: Alarm,
): Promise<boolean> => {
  console.log("Scheduling alarm notification:", alarm);

  if (!alarm.active) {
    console.log("Alarm is not active, skipping scheduling");
    return false;
  }

  // Проверяем, что уведомления разрешены
  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return false;
  }

  const swRegistration = await getServiceWorkerRegistration();
  if (!swRegistration) {
    console.error("Failed to get service worker registration");
    return false;
  }

  if (!swRegistration.active) {
    console.error("No active service worker found");
    return false;
  }

  // Создаем копию объекта alarm для передачи в сервис-воркер
  const alarmData = {
    id: alarm.id,
    name: alarm.name,
    time: alarm.time.toISOString(),
  };

  console.log("Sending message to service worker:", {
    type: "SCHEDULE_ALARM",
    alarm: alarmData,
  });

  // Отправляем сообщение service worker для планирования уведомления
  swRegistration.active.postMessage({
    type: "SCHEDULE_ALARM",
    alarm: alarmData,
  });

  return true;
};

// Функция для отмены запланированного уведомления
export const cancelAlarmNotification = async (
  alarmId: string,
): Promise<boolean> => {
  console.log("Canceling alarm notification:", alarmId);

  const swRegistration = await getServiceWorkerRegistration();
  if (!swRegistration) {
    console.error("Failed to get service worker registration for cancellation");
    return false;
  }

  if (!swRegistration.active) {
    console.error("No active service worker found for cancellation");
    return false;
  }

  console.log("Sending cancel message to service worker for alarm:", alarmId);

  // Отправляем сообщение service worker для отмены уведомления
  swRegistration.active.postMessage({
    type: "CANCEL_ALARM",
    alarmId,
  });

  return true;
};

// Функция для планирования уведомлений для всех активных будильников
export const scheduleAllAlarmNotifications = async (
  alarms: Alarm[],
): Promise<void> => {
  console.log("Scheduling all active alarm notifications");

  const activeAlarms = alarms.filter((alarm) => alarm.active);
  console.log(`Found ${activeAlarms.length} active alarms to schedule`);

  for (const alarm of activeAlarms) {
    const result = await scheduleAlarmNotification(alarm);
    console.log(
      `Scheduled alarm ${alarm.id}: ${result ? "success" : "failed"}`,
    );
  }
};

// Функция для проверки, был ли SW зарегистрирован
export const checkServiceWorkerRegistration = async (): Promise<boolean> => {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers not supported");
      return false;
    }

    // Получить все регистрации SW
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log("Current service worker registrations:", registrations);

    return registrations.length > 0;
  } catch (error) {
    console.error("Error checking service worker registration:", error);
    return false;
  }
};

// Функция для регистрации сервис-воркера, если он не зарегистрирован
export const ensureServiceWorkerRegistered = async (): Promise<boolean> => {
  try {
    const isRegistered = await checkServiceWorkerRegistration();
    if (isRegistered) {
      console.log("Service worker already registered");
      return true;
    }

    console.log("Registering service worker...");
    const registration = await navigator.serviceWorker.register(
      "/pwa.service-worker.js",
      {
        scope: "/",
        type: "module",
      },
    );

    console.log("Service worker registered:", registration);
    return true;
  } catch (error) {
    console.error("Failed to register service worker:", error);
    return false;
  }
};
