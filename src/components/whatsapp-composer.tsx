"use client";

import { useState } from "react";
import { WhatsAppIcon } from "./icons";
import styles from "./whatsapp-composer.module.css";

const interests = [
  ["info", "Recibir más información", "Me gustaría recibir más información."],
  [
    "price",
    "Confirmar precio y disponibilidad",
    "¿Podrías confirmarme el precio y la disponibilidad?",
  ],
  ["visit", "Coordinar una visita", "Me gustaría coordinar una visita."],
  [
    "terms",
    "Conocer condiciones de pago",
    "¿Podrías explicarme las condiciones de pago?",
  ],
] as const;

/**
 * Prepara el mensaje de WhatsApp de una ficha y deja revisarlo y editarlo.
 * Esta página solo abre WhatsApp: el envío lo confirma la persona allí.
 */
export function WhatsAppComposer({
  number,
  advisor,
  property,
}: {
  number: string;
  advisor: string;
  property: {
    title: string;
    reference: string;
    operation: string;
    url: string;
    demo: boolean;
  };
}) {
  const compose = (sentence: string) =>
    `Hola ${advisor}, me interesa ${property.demo ? "la ficha de demostración" : "la propiedad"} ${property.title} (código ${property.reference}), en ${property.operation.toLowerCase()}. ${sentence}${property.url ? `\n${property.url}` : ""}`;
  const [interest, setInterest] = useState<string>(interests[0][0]);
  const [message, setMessage] = useState(() => compose(interests[0][2]));
  const [edited, setEdited] = useState(false);
  return (
    <details className={styles.composer}>
      <summary>Revisar el mensaje antes de abrir WhatsApp</summary>
      <label>
        <span>Qué quieres consultar</span>
        <select
          value={interest}
          onChange={(event) => {
            setInterest(event.target.value);
            const sentence = interests.find(
              ([id]) => id === event.target.value,
            )?.[2];
            // Un texto ya editado a mano no se sobrescribe.
            if (sentence && !edited) setMessage(compose(sentence));
          }}
        >
          {interests.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Mensaje</span>
        <textarea
          rows={6}
          maxLength={900}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setEdited(true);
          }}
        />
      </label>
      <a
        className="button"
        href={`https://wa.me/${number}?text=${encodeURIComponent(message.trim())}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!message.trim()}
        onClick={(event) => {
          if (!message.trim()) event.preventDefault();
        }}
      >
        <WhatsAppIcon width={18} height={18} /> Abrir WhatsApp con este mensaje
      </a>
      <small>
        Se abrirá WhatsApp con el texto preparado. El mensaje solo se envía
        cuando lo confirmes allí.
      </small>
    </details>
  );
}
