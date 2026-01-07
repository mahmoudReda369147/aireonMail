import React from 'react';
import { useUserTemplates, useDeleteTemplate } from '../apis/hooks';
import { mapUserTemplateToEmailTemplate } from '../apis/services';
import { LayoutTemplate, Plus, Edit3, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailTemplate } from '../types';

export const TemplatesPage: React.FC = () => {
    const { data, isLoading, error, refetch } = useUserTemplates();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const deleteTemplateMutation = useDeleteTemplate();
    const { requestConfirm } = useAppContext();

    // Map user templates to app EmailTemplate format
    const templates = data?.data.map(mapUserTemplateToEmailTemplate) || [];

    const handleCreate = () => {
        navigate('/templates/editor');
    };

    const handleEdit = (template: EmailTemplate) => {
        navigate('/templates/editor', { state: { template } });
    };

    const handleDelete = (id: string) => {
        const template = templates.find(t => t.id === id);
        const templateName = template?.name || 'this template';
        
        requestConfirm({
            title: 'Delete Template',
            message: `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await deleteTemplateMutation.mutateAsync(id);
                    showToast("Template deleted successfully", "success");
                } catch (error) {
                    console.error('Failed to delete template:', error);
                    showToast(error instanceof Error ? error.message : "Failed delete template", "error");
                }
            }
        });
    };

    const handleUse = (template: EmailTemplate) => {
        navigate('/compose', { state: { template } });
    };

    if (error) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <LayoutTemplate className="w-16 h-16 opacity-20 mb-4 mx-auto" />
                    <p className="text-xl mb-2">Failed to load templates</p>
                    <p className="text-sm mb-4">Please try again later</p>
                    <Button onClick={() => refetch()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto overflow-y-auto custom-scrollbar w-full">
            <div className="flex items-center justify-between mb-8 w-full">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <LayoutTemplate className="w-8 h-8 text-fuchsia-500" />
                        Templates
                    </h1>
                    <p className="text-slate-400 mt-2">Create and manage reusable email templates.</p>
                </div>
                <Button icon={Plus} onClick={handleCreate}>Create Template</Button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Loading templates...</p>
                    </div>
                </div>
            ) : (
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
                                    className="text-sm text-slate-500 line-clamp-3 mb-6 bg-black/20 p-3 rounded-xl border border-white/5 font-mono text-xs max-h-[100px] overflow-hidden"
                                    dangerouslySetInnerHTML={{ __html: template.body }}
                                />

                                <div className="mt-auto">
                                    <Button className="w-full" icon={Send} onClick={() => handleUse(template)}>Use Template</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};