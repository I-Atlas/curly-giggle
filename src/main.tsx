import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Регистрация сервис-воркера
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/pwa.service-worker.js",
        {
          scope: "/",
          type: "module",
        },
      );

      console.log("Service Worker зарегистрирован:", registration.scope);

      // Подписываемся на обновления
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("Обновление Service Worker...");

        newWorker?.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log(
              "Новый Service Worker установлен и готов к использованию",
            );
          }
        });
      });
    } catch (error) {
      console.error("Ошибка при регистрации Service Worker:", error);
    }
  }
}

// Регистрируем сервис-воркер
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
