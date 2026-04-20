import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, XCircle } from 'lucide-react';
import type { ValidationResult } from '../engine/SimulationEngine';

interface ValidationPanelProps {
  result: ValidationResult | null;
  onDismiss: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ result, onDismiss }) => {
  return (
    <AnimatePresence>
      {result && (result.errors.length > 0 || result.warnings.length > 0) && (
        <motion.div
          key="validation-panel"
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="
            absolute top-4 left-1/2 -translate-x-1/2 z-50
            w-[400px] max-w-[90vw]
            rounded-2xl border border-rose-500/40 shadow-2xl
            bg-slate-900/95 backdrop-blur-md
            overflow-hidden
          "
        >
          {/* Title row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-rose-400 shrink-0" />
              <span className="text-sm font-bold text-rose-300">
                Workflow has {result.errors.length} error
                {result.errors.length !== 1 ? 's' : ''}
                {result.warnings.length > 0
                  ? ` · ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`
                  : ''}
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss validation errors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Error list */}
          {result.errors.length > 0 && (
            <ul className="px-4 py-3 space-y-2">
              {result.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <XCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-[12px] text-slate-300 leading-snug">{err}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Warning list */}
          {result.warnings.length > 0 && (
            <ul
              className={`px-4 pb-3 space-y-2 ${result.errors.length > 0 ? 'border-t border-slate-700/40 pt-3' : 'pt-3'}`}
            >
              {result.warnings.map((warn, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[12px] text-slate-400 leading-snug">{warn}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Fix hint */}
          <div className="px-4 pb-3 pt-0">
            <p className="text-[10px] text-slate-600 italic">
              Fix these issues on the canvas and try running the simulation again.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ValidationPanel;
