import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from 'reactflow';
import { useWorkflowStore } from '../../../store/workflowStore';
import { cn } from '../../../utils/cn';

export interface LabeledEdgeData {
  label?: string;
}

const LabeledEdge: React.FC<EdgeProps<LabeledEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  style,
}) => {
  const { updateEdgeLabel } = useWorkflowStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commitLabel = useCallback(() => {
    setIsEditing(false);
    updateEdgeLabel(id, draft.trim());
  }, [id, draft, updateEdgeLabel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitLabel();
    if (e.key === 'Escape') {
      setDraft(data?.label ?? '');
      setIsEditing(false);
    }
  };

  const displayLabel = data?.label?.trim();

  return (
    <>
      {/* BaseEdge must receive stroke via style — ReactFlow API requirement */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          /* eslint-disable-next-line react/forbid-component-props */
          stroke: selected ? '#818cf8' : '#6366f1',
          strokeWidth: selected ? 2.5 : 2,
          filter: selected ? 'drop-shadow(0 0 4px #6366f1aa)' : undefined,
        }}
      />

      <EdgeLabelRenderer>
        {/* EdgeLabelRenderer requires absolute + transform positioning — ReactFlow API */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown}
              className="edge-label-input"
              placeholder="Label…"
            />
          ) : (
            <button
              onClick={() => {
                setDraft(data?.label ?? '');
                setIsEditing(true);
              }}
              title="Click to name this connection"
              className={cn(
                'edge-label-btn',
                displayLabel
                  ? selected
                    ? 'edge-label-btn--labeled-selected'
                    : 'edge-label-btn--labeled'
                  : 'edge-label-btn--empty'
              )}
            >
              {displayLabel ? (
                <span>{displayLabel}</span>
              ) : (
                <span className="edge-label-btn__hint">+ label</span>
              )}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default LabeledEdge;
