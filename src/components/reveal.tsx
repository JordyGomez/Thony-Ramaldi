"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { editorialEase, motionTiming } from "@/lib/motion";
import { useSite, useExperienceReducedMotion } from "./site-provider";

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
  const reduced = useExperienceReducedMotion();
  const { settings } = useSite();
  const staticMotion = reduced || settings.experience.motion === "off";
  const depth = settings.experience.motion === "expressive" ? 1 : 0.3;
  const variants = {
    rise: {
      opacity: [0.7, 1],
      y: [26, 0],
      rotateX: [6 * depth, 0],
      transformPerspective: 1200,
    },
    image: {
      opacity: [0.8, 1],
      y: [24, 0],
      scale: [1.025, 1],
      rotateY: [-5 * depth, 0],
      transformPerspective: 1400,
    },
    soft: {
      opacity: [0.7, 1],
      y: [12, 0],
      rotateX: [3 * depth, 0],
      transformPerspective: 1200,
    },
  };
  return (
    <motion.div
      className={className}
      initial={false}
      animate={
        staticMotion
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotateX: 0,
              rotateY: 0,
              transformPerspective: 0,
            }
          : undefined
      }
      whileInView={staticMotion ? undefined : variants[variant]}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: staticMotion
          ? 0
          : variant === "image"
            ? motionTiming.image
            : motionTiming.reveal,
        delay: staticMotion ? 0 : delay,
        ease: editorialEase,
      }}
    >
      {children}
    </motion.div>
  );
}
