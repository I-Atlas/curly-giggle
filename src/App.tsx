import { useEffect, useState } from "react";
import AlarmForm from "./components/AlarmForm";
import AlarmList from "./components/AlarmList";
import type { Alarm } from "./types";
import {
  cancelAlarmNotification,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  scheduleAlarmNotification,
  scheduleAllAlarmNotifications,
} from "./utils/notifications";
import { loadAlarms, saveAlarms } from "./utils/storage";

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);

  // Запрос разрешения на уведомления и проверка статуса
  useEffect(() => {
    const checkNotificationPermission = async () => {
      const status = getNotificationPermissionStatus();
      setNotificationsEnabled(status === "granted");

      if (status !== "granted" && status !== "denied") {
        const granted = await requestNotificationPermission();
        setNotificationsEnabled(granted);
      }
    };

    checkNotificationPermission();
  }, []);

  // Загрузка будильников при монтировании
  useEffect(() => {
    const savedAlarms = loadAlarms();
    setAlarms(savedAlarms);

    // Планируем уведомления для всех активных будильников
    if (notificationsEnabled) {
      scheduleAllAlarmNotifications(savedAlarms);
    }
  }, [notificationsEnabled]);

  // Сохранение будильников при изменении
  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  // Проверка будильников каждую секунду (для визуального срабатывания в UI)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      alarms.forEach((alarm) => {
        if (alarm.active) {
          const alarmTime = new Date(alarm.time);
          if (
            now.getHours() === alarmTime.getHours() &&
            now.getMinutes() === alarmTime.getMinutes() &&
            now.getSeconds() === alarmTime.getSeconds()
          ) {
            // Действие будильника в UI (для случая, когда приложение открыто)
            console.log(`Сработал будильник: ${alarm.name}`);

            // Не показывать alert, если уведомление уже показывается через PWA
            if (!notificationsEnabled) {
              alert(`Сработал будильник: ${alarm.name}`);
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, notificationsEnabled]);

  const addAlarm = async (alarm: Omit<Alarm, "id">) => {
    const newAlarm = {
      ...alarm,
      id: Date.now().toString(),
    };

    setAlarms((prevAlarms) => {
      const updatedAlarms = [...prevAlarms, newAlarm];
      // Планируем уведомление для нового будильника
      if (notificationsEnabled && newAlarm.active) {
        scheduleAlarmNotification(newAlarm);
      }
      return updatedAlarms;
    });
  };

  const updateAlarm = async (updatedAlarm: Alarm) => {
    setAlarms((prevAlarms) => {
      const updatedAlarms = prevAlarms.map((alarm) =>
        alarm.id === updatedAlarm.id ? updatedAlarm : alarm,
      );

      // Обновляем уведомление для измененного будильника
      if (notificationsEnabled) {
        if (updatedAlarm.active) {
          scheduleAlarmNotification(updatedAlarm);
        } else {
          cancelAlarmNotification(updatedAlarm.id);
        }
      }

      return updatedAlarms;
    });

    setEditing(null);
  };

  const deleteAlarm = async (id: string) => {
    // Отменяем уведомление для удаляемого будильника
    if (notificationsEnabled) {
      await cancelAlarmNotification(id);
    }

    setAlarms(alarms.filter((alarm) => alarm.id !== id));
  };

  const toggleAlarm = async (id: string) => {
    setAlarms((prevAlarms) => {
      const updatedAlarms = prevAlarms.map((alarm) => {
        if (alarm.id === id) {
          const updatedAlarm = { ...alarm, active: !alarm.active };

          // Обновляем уведомление при изменении статуса
          if (notificationsEnabled) {
            if (updatedAlarm.active) {
              scheduleAlarmNotification(updatedAlarm);
            } else {
              cancelAlarmNotification(id);
            }
          }

          return updatedAlarm;
        }
        return alarm;
      });

      return updatedAlarms;
    });
  };

  // Запрос разрешения на уведомления
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);

    if (granted) {
      // Планируем уведомления для всех активных будильников
      scheduleAllAlarmNotifications(alarms);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Будильник</h1>

      {/* Сообщение о статусе уведомлений */}
      {notificationsEnabled ? (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Уведомления разрешены. Будильники будут работать даже если
            приложение закрыто.
          </span>
        </div>
      ) : (
        <div className="alert alert-warning mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            Уведомления не разрешены. Будильник будет работать только при
            открытом приложении.
          </span>
          <button className="btn btn-sm" onClick={handleRequestPermission}>
            Разрешить уведомления
          </button>
        </div>
      )}

      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title mb-4">
            {editing ? "Редактировать будильник" : "Создать новый будильник"}
          </h2>
          <AlarmForm
            onSubmit={editing ? updateAlarm : addAlarm}
            initialData={editing}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Мои будильники</h2>
          <AlarmList
            alarms={alarms}
            onDelete={deleteAlarm}
            onToggle={toggleAlarm}
            onEdit={setEditing}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
