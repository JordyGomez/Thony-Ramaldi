"use client";
import { useSyncExternalStore } from "react";
// Reloj de presentación. No programa avisos ni ejecuta trabajo de la agenda.
let current = 0;
const snapshot = () => current;
const serverSnapshot = () => 0;
const subscribe = (listener: () => void) => {
  current = Date.now();
  const timer = setInterval(() => {
    current = Date.now();
    listener();
  }, 30000);
  return () => clearInterval(timer);
};
export function useAgendaClock() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
