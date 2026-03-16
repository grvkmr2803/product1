"use client";

import { motion, useScroll } from "framer-motion";

export default function ScrollBar({ config }: any) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      style={{
        scaleX: scrollYProgress,
        transformOrigin: "left",
        background: `linear-gradient(to right, ${config.primary}, ${config.secondary})`,
      }}
      className="fixed top-0 left-0 right-0 h-[2px] z-50"
    />
  );
}