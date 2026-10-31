"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#F4A4B8", "#E8D5F2", "#B8E0D2", "#FFE5B4", "#C5E4F3", "#F8C8DC"];

type ConfettiProps = {
  show: boolean;
  message?: string;
  onDone?: () => void;
};

export function ConfettiBurst({ show, message = "Objectif atteint", onDone }: ConfettiProps) {
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    })),
  );

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {pieces.map((p) => (
              <motion.span
                key={p.id}
                className="absolute top-0 h-3 w-2 rounded-sm"
                style={{ left: `${p.x}%`, backgroundColor: p.color }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: "110vh", opacity: 0.2, rotate: p.rot }}
                transition={{ duration: 1.8, delay: p.delay, ease: "easeIn" }}
              />
            ))}
          </div>
          <motion.div
            className="relative z-10 rounded-3xl bg-card px-6 py-4 text-center shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <p className="text-lg font-extrabold text-rose-deep">{message}</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
