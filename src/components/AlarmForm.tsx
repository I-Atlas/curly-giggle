import React, { useEffect, useState } from "react";
import type { Alarm } from "../types";

interface AlarmFormProps {
  onSubmit: (alarm: Alarm) => void;
  initialData?: Alarm | null;
  onCancel?: () => void;
}

const AlarmForm: React.FC<AlarmFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");
  const [active, setActive] = useState(true);

  // Установить начальные значения при редактировании
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setActive(initialData.active);

      const time = new Date(initialData.time);
      setHours(time.getHours().toString().padStart(2, "0"));
      setMinutes(time.getMinutes().toString().padStart(2, "0"));
      setSeconds(time.getSeconds().toString().padStart(2, "0"));
    } else {
      // Значения по умолчанию для нового будильника
      setName("");
      setActive(true);

      const now = new Date();
      setHours(now.getHours().toString().padStart(2, "0"));
      setMinutes(now.getMinutes().toString().padStart(2, "0"));
      setSeconds(now.getSeconds().toString().padStart(2, "0"));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Создаем объект Date с выбранным временем
    const alarmTime = new Date();
    alarmTime.setHours(parseInt(hours));
    alarmTime.setMinutes(parseInt(minutes));
    alarmTime.setSeconds(parseInt(seconds));
    alarmTime.setMilliseconds(0);

    // Если время уже прошло, устанавливаем на завтра
    const now = new Date();
    if (alarmTime < now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    if (initialData) {
      onSubmit({
        ...initialData,
        name,
        time: alarmTime,
        active,
      });
    } else {
      onSubmit({
        id: Date.now().toString(),
        name,
        time: alarmTime,
        active,
      });
    }

    // Сбросить форму, если не редактирование
    if (!initialData) {
      setName("");
    }
  };

  // Генерирует опции для селекторов времени
  const generateTimeOptions = (max: number) => {
    const options = [];
    for (let i = 0; i < max; i++) {
      const value = i.toString().padStart(2, "0");
      options.push(
        <option key={i} value={value}>
          {value}
        </option>,
      );
    }
    return options;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Название будильника</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Введите название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Время</span>
        </label>
        <div className="flex gap-2">
          <select
            className="select select-bordered flex-1"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          >
            {generateTimeOptions(24)}
          </select>
          <span className="self-center">:</span>
          <select
            className="select select-bordered flex-1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          >
            {generateTimeOptions(60)}
          </select>
          <span className="self-center">:</span>
          <select
            className="select select-bordered flex-1"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
          >
            {generateTimeOptions(60)}
          </select>
        </div>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Активен</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={active}
            onChange={() => setActive(!active)}
          />
        </label>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {initialData ? "Сохранить" : "Создать"}
        </button>
      </div>
    </form>
  );
};

export default AlarmForm;
