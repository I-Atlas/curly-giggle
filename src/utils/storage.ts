import type { Alarm } from "../types";

const STORAGE_KEY = "alarms";

// Интерфейс для сохраненного будильника (с датой в виде строки)
interface SavedAlarm extends Omit<Alarm, "time"> {
  time: string;
}

export const saveAlarms = (alarms: Alarm[]): void => {
  // Преобразуем даты в строки для хранения
  const alarmsToSave = alarms.map((alarm) => ({
    ...alarm,
    time: alarm.time.toISOString(),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarmsToSave));
};

export const loadAlarms = (): Alarm[] => {
  const savedAlarms = localStorage.getItem(STORAGE_KEY);
  if (!savedAlarms) return [];

  try {
    // Преобразуем строки обратно в даты
    const parsedAlarms = JSON.parse(savedAlarms) as SavedAlarm[];
    return parsedAlarms.map((alarm) => ({
      ...alarm,
      time: new Date(alarm.time),
    }));
  } catch (error) {
    console.error("Ошибка при загрузке будильников:", error);
    return [];
  }
};
