import type { Alarm } from "../types";

// Функция для проверки поддержки уведомлений
export const checkNotificationSupport = (): boolean => {
  return "Notification" in window && "serviceWorker" in navigator;
};

// Функция для запроса разрешения на уведомления
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!checkNotificationSupport()) return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Ошибка при запросе разрешения на уведомления:", error);
    return false;
  }
};

// Получение статуса разрешения на уведомления
export const getNotificationPermissionStatus = (): string => {
  if (!checkNotificationSupport()) return "unsupported";
  return Notification.permission;
};

// Получение активной регистрации service worker
export const getServiceWorkerRegistration =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) return null;

    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error("Ошибка при получении регистрации service worker:", error);
      return null;
    }
  };

// Функция для планирования уведомления будильника
export const scheduleAlarmNotification = async (
  alarm: Alarm,
): Promise<boolean> => {
  if (!alarm.active) return false;

  const swRegistration = await getServiceWorkerRegistration();
  if (!swRegistration) return false;

  // Отправляем сообщение service worker для планирования уведомления
  swRegistration.active?.postMessage({
    type: "SCHEDULE_ALARM",
    alarm: {
      id: alarm.id,
      name: alarm.name,
      time: alarm.time.toISOString(),
    },
  });

  return true;
};

// Функция для отмены запланированного уведомления
export const cancelAlarmNotification = async (
  alarmId: string,
): Promise<boolean> => {
  const swRegistration = await getServiceWorkerRegistration();
  if (!swRegistration) return false;

  // Отправляем сообщение service worker для отмены уведомления
  swRegistration.active?.postMessage({
    type: "CANCEL_ALARM",
    alarmId,
  });

  return true;
};

// Функция для планирования уведомлений для всех активных будильников
export const scheduleAllAlarmNotifications = async (
  alarms: Alarm[],
): Promise<void> => {
  const activeAlarms = alarms.filter((alarm) => alarm.active);

  for (const alarm of activeAlarms) {
    await scheduleAlarmNotification(alarm);
  }
};
