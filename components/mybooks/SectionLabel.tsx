"use client";

export default function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 mb-6 text-xs tracking-[0.3em] text-white/30 uppercase">
      {children}
      <div className="flex-1 h-[1px] bg-white/10" />
    </div>
  );
}