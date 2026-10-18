"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { editorialEase, motionTiming } from "@/lib/motion";

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "rise",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "image" | "soft";
}) {
  const reduced = useReducedMotion();
  const variants = {
    rise: { opacity: [0.65, 1], y: [22, 0] },
    image: { opacity: [0.7, 1], x: [-18, 0] },
    soft: { opacity: [0.55, 1], y: [8, 0] },
  };
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduced ? {} : variants[variant]}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: variant === "image" ? 0.9 : motionTiming.reveal,
        delay,
        ease: editorialEase,
      }}
    >
      {children}
    </motion.div>
  );
}
