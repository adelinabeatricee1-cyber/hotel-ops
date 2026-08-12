interface TrendPoint {
  label: string;
  adr: number;
  revpar: number;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 8;
const PADDING_BOTTOM = 28;
const PADDING_TOP = 24;

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.adr, p.revpar)));
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const groupWidth = (CHART_WIDTH - PADDING_LEFT) / points.length;
  const barWidth = Math.min(22, groupWidth / 3);

  function barHeight(value: number) {
    return maxValue > 0 ? (value / maxValue) * plotHeight : 0;
  }

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-olive-500" />
          ADR (tarif mediu/noapte vândută)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
          RevPAR (venit/cameră disponibilă)
        </span>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="mt-2 h-56 w-full"
        role="img"
        aria-label="Tendință ADR și RevPAR pe ultimele luni"
      >
        <line
          x1={PADDING_LEFT}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#e2e8f0"
        />
        {points.map((point, i) => {
          const groupX = PADDING_LEFT + i * groupWidth;
          const adrHeight = barHeight(point.adr);
          const revparHeight = barHeight(point.revpar);
          const baseY = CHART_HEIGHT - PADDING_BOTTOM;
          return (
            <g key={point.label}>
              <rect
                x={groupX + groupWidth / 2 - barWidth - 2}
                y={baseY - adrHeight}
                width={barWidth}
                height={adrHeight}
                rx={2}
                className="fill-olive-500"
              />
              <rect
                x={groupX + groupWidth / 2 + 2}
                y={baseY - revparHeight}
                width={barWidth}
                height={revparHeight}
                rx={2}
                className="fill-sky-400"
              />
              <text
                x={groupX + groupWidth / 2}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
