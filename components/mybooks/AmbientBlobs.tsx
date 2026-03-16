"use client";

export default function AmbientBlobs({ config }: any) {
  return (
    <>
      <div
        className="pointer-events-none fixed top-[-120px] left-[-120px] w-[520px] h-[520px] rounded-full"
        style={{
          background: config.blob1,
          filter: "blur(90px)",
          opacity: 0.16,
          transition: "background 1.2s ease",
          zIndex: 0,
        }}
      />

      <div
        className="pointer-events-none fixed bottom-[-60px] right-[-80px] w-[420px] h-[420px] rounded-full"
        style={{
          background: config.blob2,
          filter: "blur(80px)",
          opacity: 0.12,
          transition: "background 1.2s ease",
          zIndex: 0,
        }}
      />

      <div
        className="pointer-events-none fixed top-[40%] left-[48%] w-[220px] h-[220px] rounded-full"
        style={{
          background: config.primary,
          filter: "blur(100px)",
          opacity: 0.07,
          transition: "background 1.2s ease",
          zIndex: 0,
        }}
      />
    </>
  );
}