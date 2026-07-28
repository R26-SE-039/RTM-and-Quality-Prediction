export default function ConcentricRings({ statement, branch, overall, size = 220 }) {
  const center = size / 2;
  const strokeWidth = 16;
  const rings = [
    { pct: overall, color: "#22c55e", radius: center - strokeWidth * 0.9 },
    { pct: branch, color: "#8b5cf6", radius: center - strokeWidth * 2.4 },
    { pct: statement, color: "#6366f1", radius: center - strokeWidth * 3.9 },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r) => {
        const circumference = 2 * Math.PI * r.radius;
        const dash = (Math.max(0, Math.min(100, r.pct)) / 100) * circumference;
        return (
          <g key={r.color} transform={`rotate(-90 ${center} ${center})`}>
            <circle cx={center} cy={center} r={r.radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
            {r.pct > 0 && (
              <circle
                cx={center}
                cy={center}
                r={r.radius}
                fill="none"
                stroke={r.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
