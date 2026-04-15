import type { FlowNodeColor, FlowNodeShape } from '@arqyx/shared';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { colorClassesFor } from './flow-colors.js';

export type FlowNodeData = {
  label: string;
  shape: FlowNodeShape;
  color: FlowNodeColor;
  description: string | null;
};

export function FlowNode({ data }: NodeProps) {
  const typed = data as FlowNodeData;
  switch (typed.shape) {
    case 'rectangle':
      return <RectangleNode data={typed} rounded={false} />;
    case 'rounded':
      return <RectangleNode data={typed} rounded={true} />;
    case 'diamond':
      return <DiamondNode data={typed} />;
    case 'circle':
      return <CircleNode data={typed} />;
    case 'note':
      return <NoteNode data={typed} />;
    default: {
      const exhaustive: never = typed.shape;
      return exhaustive;
    }
  }
}

type NodeSubProps = { data: FlowNodeData };

function RectangleNode({ data, rounded }: NodeSubProps & { rounded: boolean }) {
  const colors = colorClassesFor(data.color);
  const radius = rounded ? 'rounded-full' : 'rounded-md';
  return (
    <div className={`min-w-40 max-w-72 border shadow-sm ${radius} ${colors.container}`}>
      <Handle type="target" position={Position.Left} />
      <div className={`${radius} px-4 py-2 ${colors.headerBg}`}>
        <span className={`font-medium text-sm ${colors.text}`}>{data.label}</span>
      </div>
      {data.description ? (
        <p className={`px-4 pb-2 text-xs ${colors.text} opacity-80`}>{data.description}</p>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function DiamondNode({ data }: NodeSubProps) {
  const colors = colorClassesFor(data.color);
  return (
    <div className="relative flex h-28 w-40 items-center justify-center">
      <div
        className={`absolute inset-0 rotate-45 border shadow-sm ${colors.container}`}
        aria-hidden="true"
      />
      <Handle type="target" position={Position.Left} />
      <span className={`relative z-10 max-w-28 text-center font-medium text-xs ${colors.text}`}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function CircleNode({ data }: NodeSubProps) {
  const colors = colorClassesFor(data.color);
  return (
    <div
      className={`flex h-24 w-24 items-center justify-center rounded-full border shadow-sm ${colors.container}`}
    >
      <Handle type="target" position={Position.Left} />
      <span className={`text-center font-medium text-xs ${colors.text}`}>{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function NoteNode({ data }: NodeSubProps) {
  const colors = colorClassesFor(data.color === 'neutral' ? 'amber' : data.color);
  return (
    <div
      className={`min-w-40 max-w-60 border shadow-md ${colors.container}`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}
    >
      <Handle type="target" position={Position.Left} />
      <div className={`px-3 py-2 ${colors.text}`}>
        <p className="font-medium text-xs">{data.label}</p>
        {data.description ? <p className="mt-1 text-xs opacity-80">{data.description}</p> : null}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
