import { useState } from "react";
import { Loader2, Wand2, X } from "lucide-react";

interface RegenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => Promise<void>;
  isRegenerating: boolean;
}

export default function RegenerationDialog({ 
  isOpen, 
  onClose, 
  selectedCount, 
  onConfirm,
  isRegenerating
}: RegenerationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in">
      <div className="glass-panel rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] max-w-md w-full m-4 animate-up border-white/10">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-white">Selective Regeneration</h3>
          {!isRegenerating && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {isRegenerating ? (
          <div className="py-8 text-center">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Regenerating Artifacts...</h4>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              SpecForge is using surgical edits to regenerate only the selected {selectedCount} artifacts while preserving the rest of your project.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              You are about to regenerate <strong className="text-white font-bold">{selectedCount} stale artifacts</strong>.
              The AI will use the new specification context to update these items, while leaving unchecked items untouched.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white glass border-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                disabled={selectedCount === 0}
                className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <Wand2 className="w-4 h-4" />
                Regenerate Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
