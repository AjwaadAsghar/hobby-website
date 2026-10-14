"use client";

import { motion, useReducedMotion } from "motion/react";

/** Soft fade between storefront pages. */
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
