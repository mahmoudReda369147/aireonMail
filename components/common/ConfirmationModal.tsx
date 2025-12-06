import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

export const ConfirmationModal: React.FC = () => {
    const { confirmState, closeConfirm } = useAppContext();

    if (!confirmState.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1A1B2E] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full ${confirmState.variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {confirmState.variant === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-white">{confirmState.title}</h3>
                </div>
                
                <p className="text-slate-400 mb-8 leading-relaxed">
                    {confirmState.message}
                </p>

                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={closeConfirm}
                        className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            confirmState.onConfirm();
                            closeConfirm();
                        }}
                        className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 ${
                            confirmState.variant === 'danger' 
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' 
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                        }`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};