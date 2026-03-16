"use client";

import { useEffect, useRef, useCallback } from "react";

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  reflection: string | null;
  created_at: string;
  mode: "aether" | "obsidian";
};

type Props = {
  archetype: string | null;
  books: Book[];
  config: {
    primary: string;
    secondary: string;
  };
};

export default function ConstellationCanvas({
  archetype,
  books,
  config,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;

    canvas.width = parent?.clientWidth ?? 800;
    canvas.height = 260;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;

    /* ── Background Stars ── */

    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.4 + 0.3;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.45 + 0.1})`;

      ctx.fill();
    }

    /* ── Nodes ── */

    const nodes = [
      { x: W * 0.18, y: 90, label: "Dark Fiction" },
      { x: W * 0.5, y: 55, label: "Philosophy" },
      { x: W * 0.8, y: 92, label: "Romance" },
      { x: W * 0.33, y: 175, label: "Horror" },
      { x: W * 0.63, y: 185, label: "Literary" },
    ];

    /* ── Connections ── */

    const connections: [number, number][] = [
      [0, 1],
      [1, 2],
      [0, 3],
      [1, 4],
      [2, 4],
      [3, 4],
    ];

    connections.forEach(([a, b]) => {
      ctx.beginPath();

      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;

      ctx.stroke();
    });

    /* ── Node Rendering ── */

    nodes.forEach((node, i) => {
      const color = i % 2 === 0 ? config.primary : config.secondary;

      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        20
      );

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);

      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.28;

      ctx.fill();
      ctx.globalAlpha = 1;

      /* center dot */

      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);

      ctx.fillStyle = color;
      ctx.fill();

      /* label */

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";

      ctx.fillText(node.label, node.x, node.y + 22);
    });
  }, [config]);

  useEffect(() => {
    draw();

    window.addEventListener("resize", draw);

    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "260px",
        display: "block",
      }}
    />
  );
}