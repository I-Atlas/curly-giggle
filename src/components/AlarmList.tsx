import React from "react";
import type { Alarm } from "../types";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
}

const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  onDelete,
  onToggle,
  onEdit,
}) => {
  // Функция для форматирования времени
  const formatTime = (time: Date) => {
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
  };

  if (alarms.length === 0) {
    return (
      <div className="text-center p-4">
        <p>У вас пока нет будильников. Создайте первый!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alarms.map((alarm) => (
        <div key={alarm.id} className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{alarm.name}</h3>
                <p className="text-2xl font-bold">{formatTime(alarm.time)}</p>
              </div>

              <div className="flex space-x-2 items-center">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={alarm.active}
                  onChange={() => onToggle(alarm.id)}
                />

                <button
                  className="btn btn-square btn-sm btn-outline"
                  onClick={() => onEdit(alarm)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                    />
                  </svg>
                </button>

                <button
                  className="btn btn-square btn-sm btn-outline btn-error"
                  onClick={() => onDelete(alarm.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-sm opacity-70 mt-1">
              {alarm.active ? (
                <span className="badge badge-success badge-sm">Активен</span>
              ) : (
                <span className="badge badge-ghost badge-sm">Отключен</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlarmList;
