import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Send, AlertCircle } from 'lucide-react';
import { generateWorkflow } from '../../../services/aiService';
import { useWorkflowStore } from '../../../store/workflowStore';

interface AiGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiGenerationModal: React.FC<AiGenerationModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadWorkflow } = useWorkflowStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const workflow = await generateWorkflow(prompt);
      loadWorkflow(workflow);
      onClose();
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating the workflow.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/60 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Sparkles className="text-blue-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Generate with Gemini</h2>
                  <p className="text-xs text-slate-400">Describe your workflow in natural language</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Your Requirements
                </label>
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., An employee onboarding process that starts with a webhook, followed by a manager approval. If approved, send a Slack message and create an IT ticket. If rejected, send an email."
                  className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-medium leading-relaxed"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  className="flex-[2] py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Generate Workflow
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer / Tip */}
            <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800/60">
              <p className="text-[10px] text-slate-500 text-center leading-relaxed italic">
                "Gemini can create nodes, labels, and complex logic based on your description."
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
