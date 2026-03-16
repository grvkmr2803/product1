"use client";

import { motion } from "framer-motion";

export default function ScoreBars({ scores, config }: any) {
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([name, val]: any) => (
        <div key={name}>
          <div className="flex justify-between text-xs">
            <span>{name}</span>
            <span style={{ color: config.primary }}>{val}%</span>
          </div>

          <div className="h-[3px] bg-white/10 rounded">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${val}%` }}
              className="h-full rounded"
              style={{
                background: `linear-gradient(90deg, ${config.primary}, ${config.secondary})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}