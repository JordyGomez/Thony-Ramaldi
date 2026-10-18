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
    image: { opacity: [0.8, 1], y: [18, 0], scale: [1.015, 1] },
    soft: { opacity: [0.55, 1], y: [8, 0] },
  };
  return (
    <motion.div
      className={className}
      initial={false}
      animate={reduced ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
      whileInView={reduced ? undefined : variants[variant]}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduced ? 0 : variant === "image" ? motionTiming.image : motionTiming.reveal,
        delay: reduced ? 0 : delay,
        ease: editorialEase,
      }}
    >
      {children}
    </motion.div>
  );
}
