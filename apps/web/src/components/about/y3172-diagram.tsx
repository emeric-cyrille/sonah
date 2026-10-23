/**
 * Schéma du pipeline UIT-T Y.3172 (SRC → C → PP → M → P → D → SINK) appliqué à Sonah.
 * Deux dispositions SVG : horizontale (écrans larges) et verticale (mobile).
 */

interface PipelineNode {
  readonly code: string;
  readonly name: string;
  readonly sonah: string;
}

// Couleur par rôle : extrémités en indigo, modèle en or, politique en terre cuite
function nodeStyle(code: string): { box: string; badge: string; badgeText: string } {
  switch (code) {
    case 'SRC':
    case 'SINK':
      return {
        box: 'fill-paper-soft stroke-indigo',
        badge: 'fill-indigo',
        badgeText: 'fill-paper',
      };
    case 'M':
      return { box: 'fill-paper-soft stroke-[#b07a0c]', badge: 'fill-sun', badgeText: 'fill-ink' };
    case 'P':
      return { box: 'fill-paper-soft stroke-clay', badge: 'fill-clay', badgeText: 'fill-paper' };
    default:
      return { box: 'fill-paper-soft stroke-ink/40', badge: 'fill-ink', badgeText: 'fill-paper' };
  }
}

const NODE_W = 140;
const NODE_GAP = 22;
const H_WIDTH = 7 * NODE_W + 6 * NODE_GAP + 20;

function Horizontal({
  nodes,
  orchestrator,
}: {
  readonly nodes: readonly PipelineNode[];
  readonly orchestrator: string;
}): JSX.Element {
  return (
    <svg viewBox={`0 0 ${H_WIDTH} 300`} className="h-auto w-full" aria-hidden="true">
      <defs>
        <marker
          id="y3172-arrow-h"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" className="fill-ink" />
        </marker>
      </defs>
      {nodes.map((node, index) => {
        const x = 10 + index * (NODE_W + NODE_GAP);
        const style = nodeStyle(node.code);
        const lines = node.sonah.split(' · ');
        return (
          <g key={node.code}>
            <rect
              x={x}
              y={20}
              width={NODE_W}
              height={170}
              rx={18}
              strokeWidth={2}
              className={style.box}
            />
            <rect
              x={x + 14}
              y={34}
              width={node.code.length > 2 ? 56 : 40}
              height={26}
              rx={13}
              className={style.badge}
            />
            <text
              x={x + 14 + (node.code.length > 2 ? 28 : 20)}
              y={52}
              textAnchor="middle"
              className={`${style.badgeText} text-[13px] font-bold`}
            >
              {node.code}
            </text>
            <text x={x + 14} y={86} className="fill-ink text-[15px] font-semibold">
              {node.name}
            </text>
            {lines.map((line, lineIndex) => (
              <text
                key={line}
                x={x + 14}
                y={112 + lineIndex * 19}
                className="fill-ink-soft text-[12px]"
              >
                {line.length > 22 ? `${line.slice(0, 21)}…` : line}
                <title>{line}</title>
              </text>
            ))}
            {index < nodes.length - 1 && (
              <line
                x1={x + NODE_W + 2}
                y1={105}
                x2={x + NODE_W + NODE_GAP - 2}
                y2={105}
                strokeWidth={2}
                markerEnd="url(#y3172-arrow-h)"
                className="stroke-ink"
              />
            )}
            <line
              x1={x + NODE_W / 2}
              y1={190}
              x2={x + NODE_W / 2}
              y2={232}
              strokeDasharray="4 5"
              strokeWidth={1.5}
              className="stroke-ink/40"
            />
          </g>
        );
      })}
      <rect x={10} y={232} width={H_WIDTH - 20} height={52} rx={16} className="fill-night" />
      <text
        x={H_WIDTH / 2}
        y={264}
        textAnchor="middle"
        className="fill-paper text-[15px] font-semibold"
      >
        {orchestrator}
      </text>
    </svg>
  );
}

const V_NODE_H = 88;
const V_GAP = 26;

function Vertical({
  nodes,
  orchestrator,
}: {
  readonly nodes: readonly PipelineNode[];
  readonly orchestrator: string;
}): JSX.Element {
  const height = nodes.length * (V_NODE_H + V_GAP) + 70;
  return (
    <svg viewBox={`0 0 360 ${height}`} className="h-auto w-full" aria-hidden="true">
      <defs>
        <marker
          id="y3172-arrow-v"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" className="fill-ink" />
        </marker>
      </defs>
      {nodes.map((node, index) => {
        const y = 8 + index * (V_NODE_H + V_GAP);
        const style = nodeStyle(node.code);
        const lines = node.sonah.split(' · ');
        return (
          <g key={node.code}>
            <rect
              x={4}
              y={y}
              width={352}
              height={V_NODE_H}
              rx={16}
              strokeWidth={2}
              className={style.box}
            />
            <rect x={16} y={y + 14} width={58} height={26} rx={13} className={style.badge} />
            <text
              x={45}
              y={y + 32}
              textAnchor="middle"
              className={`${style.badgeText} text-[13px] font-bold`}
            >
              {node.code}
            </text>
            <text x={86} y={y + 32} className="fill-ink text-[15px] font-semibold">
              {node.name}
            </text>
            <text x={16} y={y + 60} className="fill-ink-soft text-[12.5px]">
              {lines.slice(0, 2).join(' · ')}
            </text>
            {lines.length > 2 && (
              <text x={16} y={y + 78} className="fill-ink-soft text-[12.5px]">
                {lines.slice(2).join(' · ')}
              </text>
            )}
            {index < nodes.length - 1 && (
              <line
                x1={180}
                y1={y + V_NODE_H + 2}
                x2={180}
                y2={y + V_NODE_H + V_GAP - 2}
                strokeWidth={2}
                markerEnd="url(#y3172-arrow-v)"
                className="stroke-ink"
              />
            )}
          </g>
        );
      })}
      <rect x={4} y={height - 62} width={352} height={54} rx={16} className="fill-night" />
      <text
        x={180}
        y={height - 30}
        textAnchor="middle"
        className="fill-paper text-[12.5px] font-semibold"
      >
        {orchestrator.length > 52 ? orchestrator.split(':')[0] : orchestrator}
      </text>
    </svg>
  );
}

export function Y3172Diagram({
  nodes,
  orchestrator,
  label,
}: {
  readonly nodes: readonly PipelineNode[];
  readonly orchestrator: string;
  readonly label: string;
}): JSX.Element {
  return (
    <figure
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-3xl border border-line bg-paper p-3 sm:p-5"
    >
      <div className="hidden md:block">
        <Horizontal nodes={nodes} orchestrator={orchestrator} />
      </div>
      <div className="md:hidden">
        <Vertical nodes={nodes} orchestrator={orchestrator} />
      </div>
    </figure>
  );
}
