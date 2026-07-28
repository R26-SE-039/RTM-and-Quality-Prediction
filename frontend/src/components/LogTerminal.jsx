import { useEffect, useRef } from "react";

const LEVEL_COLORS = {
  info: "text-green-400",
  success: "text-emerald-300",
  error: "text-red-400",
  tip: "text-yellow-300",
  warning: "text-yellow-300",
};

export default function LogTerminal({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [logs.length]);

  if (logs.length === 0) return null;

  return (
    <div className="mt-4 max-h-72 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-sm">
      {logs.map((entry, i) => (
        <div key={i} className={LEVEL_COLORS[entry.level] || "text-green-400"}>
          <span className="text-slate-500">[{entry.timestamp}]</span> {entry.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
