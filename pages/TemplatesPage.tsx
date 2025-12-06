import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { LayoutTemplate, Plus, Edit3, Trash2, Send, Copy } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import { EmailTemplate } from '../types';

export const TemplatesPage: React.FC = () => {
    const { templates, deleteTemplate, t, requestConfirm } = useAppContext();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleCreate = () => {
        navigate('/templates/editor');
    };

    const handleEdit = (template: EmailTemplate) => {
        navigate('/templates/editor', { state: { template } });
    };

    const handleDelete = (id: string) => {
        requestConfirm({
            title: "Delete Template",
            message: "Are you sure you want to delete this template? This action cannot be undone.",
            onConfirm: () => {
                deleteTemplate(id);
                showToast("Template deleted", "info");
            },
            variant: "danger"
        });
    };

    const handleUse = (template: EmailTemplate) => {
        navigate('/compose', { state: { template } });
    };

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <LayoutTemplate className="w-8 h-8 text-fuchsia-500" />
                        {t('menu.templates')}
                    </h1>
                    <p className="text-slate-400 mt-2">Create and manage reusable email templates.</p>
                </div>
                <Button icon={Plus} onClick={handleCreate}>Create Template</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 ? (
                     <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed border-glass-border rounded-3xl bg-glass">
                         <LayoutTemplate className="w-16 h-16 opacity-20 mb-4" />
                         <p>No templates found. Create your first one!</p>
                     </div>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className="bg-glass border border-glass-border rounded-3xl p-6 flex flex-col shadow-xl hover:border-slate-600 transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => handleEdit(template)} className="p-2 bg-black/50 hover:bg-fuchsia-500 text-white rounded-lg backdrop-blur-sm transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(template.id)} className="p-2 bg-black/50 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="mb-4">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded-md border border-fuchsia-500/20">{template.category}</span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2 truncate">{template.name}</h3>
                            <p className="text-sm text-slate-400 mb-1 font-medium truncate"><span className="text-slate-500">Subject:</span> {template.subject}</p>
                            
                            {/* Template Preview (HTML rendered safely) */}
                            <div 
                                className="text-sm text-slate-500 line-clamp-3 mb-6 bg-black/20 p-3 rounded-xl border border-white/5 font-mono text-xs overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: template.body }}
                            />

                            <div className="mt-auto">
                                <Button className="w-full" icon={Send} onClick={() => handleUse(template)}>Use Template</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}