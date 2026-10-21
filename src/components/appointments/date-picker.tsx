"use client";
import { useEffect, useState } from "react";
import { rdDay, rdDate, rdTime, type Slot } from "@/lib/appointments/types";
import styles from "./agenda.module.css";
type Day = { date: string; available: boolean; count: number };
function monthMove(month: string, offset: number) {
  const d = new Date(month + "-01T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 7);
}
export function AppointmentDatePicker({
  source,
  day,
  onDay,
  slot,
  onSlot,
  stage = "combined",
  horizon = 90,
}: {
  source: string;
  day: string;
  onDay: (day: string) => void;
  slot: string;
  onSlot: (slot: Slot) => void;
  stage?: "date" | "time" | "combined";
  horizon?: number;
}) {
  const [month, setMonth] = useState(
    () => day.slice(0, 7) || rdDay().slice(0, 7),
  );
  const [calendar, setCalendar] = useState<{
    key: string;
    days: Day[];
    error?: string;
  }>({ key: "", days: [] });
  const [times, setTimes] = useState<{
    key: string;
    slots: Slot[];
    error?: string;
  }>({ key: "", slots: [] });
  const monthKey = source + "&month=" + month + "-01",
    slotKey = source + "&day=" + day;
  const loading = stage !== "time" && calendar.key !== monthKey,
    slotLoading = !!day && stage !== "date" && times.key !== slotKey;
  const days = calendar.key === monthKey ? calendar.days : [],
    slots = times.key === slotKey ? times.slots : [];
  const error =
    (calendar.key === monthKey ? calendar.error : "") ||
    (times.key === slotKey ? times.error : "");
  useEffect(() => {
    if (stage === "time") return;
    const controller = new AbortController();
    fetch(monthKey, { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setCalendar({ key: monthKey, days: d.days || [] });
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setCalendar({
            key: monthKey,
            days: [],
            error: e.message || "No pudimos consultar las fechas.",
          });
      });
    return () => controller.abort();
  }, [monthKey, stage]);
  useEffect(() => {
    if (!day || stage === "date") return;
    const controller = new AbortController();
    fetch(slotKey, { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setTimes({ key: slotKey, slots: d.slots || [] });
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setTimes({
            key: slotKey,
            slots: [],
            error: e.message || "No pudimos consultar los horarios.",
          });
      });
    return () => controller.abort();
  }, [slotKey, day, stage]);
  const first = new Date(month + "-01T12:00:00Z"),
    offset = (first.getUTCDay() + 6) % 7,
    lastDay = new Date(
      first.getUTCFullYear(),
      first.getUTCMonth() + 1,
      0,
    ).getDate();
  const cells = Array.from(
    { length: Math.ceil((offset + lastDay) / 7) * 7 },
    (_, i) => i - offset + 1,
  );
  const limit = new Date(rdDay() + "T12:00:00Z");
  limit.setUTCDate(limit.getUTCDate() + horizon);
  return (
    <div aria-busy={loading || slotLoading}>
      {error && (
        <p role="alert" className={`${styles.notice} ${styles.error}`}>
          {error}
        </p>
      )}
      {stage !== "time" && (
        <>
          <div className={styles.calendarHead}>
            <button
              type="button"
              aria-label="Mes anterior"
              disabled={month <= rdDay().slice(0, 7)}
              onClick={() => setMonth(monthMove(month, -1))}
            >
              ‹
            </button>
            <strong aria-live="polite">
              {new Intl.DateTimeFormat("es-DO", {
                month: "long",
                year: "numeric",
                timeZone: "America/Santo_Domingo",
              }).format(first)}
            </strong>
            <button
              type="button"
              aria-label="Mes siguiente"
              disabled={month >= limit.toISOString().slice(0, 7)}
              onClick={() => setMonth(monthMove(month, 1))}
            >
              ›
            </button>
          </div>
          {loading && (
            <p role="status" className={styles.muted}>
              Consultando fechas disponibles…
            </p>
          )}
          <table
            className={styles.calendar}
            aria-label="Calendario de disponibilidad"
          >
            <thead>
              <tr>
                {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d, i) => (
                  <th key={i} scope="col">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, week) => (
                <tr key={week}>
                  {cells.slice(week * 7, week * 7 + 7).map((n, i) => {
                    const date = month + "-" + String(n).padStart(2, "0");
                    const available =
                      !loading &&
                      days.some((d) => d.date === date && d.available);
                    return (
                      <td key={i}>
                        {n > 0 && n <= lastDay && (
                          <button
                            type="button"
                            className={styles.day}
                            disabled={!available}
                            aria-label={
                              rdDate(date + "T12:00:00-04:00") +
                              (available ? " · Disponible" : " · No disponible")
                            }
                            aria-pressed={day === date}
                            onClick={() => onDay(date)}
                          >
                            {n}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.calendarLegend}>
            <span>Disponible</span>
            <span>No disponible</span>
          </div>
        </>
      )}
      {stage !== "date" && day && (
        <div>
          <p className={styles.muted}>
            {rdDate(day + "T12:00:00-04:00")} · Hora de República Dominicana
          </p>
          {slotLoading ? (
            <p role="status">Consultando horarios reales…</p>
          ) : slots.length ? (
            <div className={styles.slots} aria-label="Horarios disponibles">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.startsAt}
                  className={styles.slot}
                  aria-pressed={slot === s.startsAt}
                  onClick={() => onSlot(s)}
                >
                  {rdTime(s.startsAt)}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.notice}>
              No quedan horarios disponibles para esta fecha. Selecciona otro
              día.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
