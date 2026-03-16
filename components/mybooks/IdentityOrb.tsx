"use client";

import { motion } from "framer-motion";

export default function IdentityOrb({
  config,
  archetype,
}: {
  config: any;
  archetype: string | null;
}) {
  return (
    <div className="relative w-[160px] h-[160px] flex-shrink-0">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-10px] rounded-full"
        style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
      >
        <div
          className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full"
          style={{ background: config.primary }}
        />
      </motion.div>

      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-[160px] h-[160px] rounded-full overflow-hidden"
        style={{
          background: `conic-gradient(from 0deg, ${config.primary}, ${config.secondary}, #050505, ${config.primary})`,
        }}
      />

      <div
        className="absolute inset-0 flex items-center justify-center text-center"
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.85)",
          padding: "20px",
        }}
      >
        {archetype ?? "Awakening"}
      </div>
    </div>
  );
}