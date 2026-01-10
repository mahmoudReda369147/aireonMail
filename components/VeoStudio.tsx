import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Sparkles, Loader2, FileSignature, Mail, Upload } from 'lucide-react';
import { generateDocument, generateResume, generateCoverLetter } from '../services/geminiService';
import { useToast } from '../components/common/Toast';
import { useAppContext } from '../contexts/AppContext';
import html2pdf from 'html2pdf.js';
import { uploadPdf } from '../apis/services';

type DocumentType = 'document' | 'resume' | 'coverletter';

export const VeoStudio: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useAppContext();
  const [activeTab, setActiveTab] = useState<DocumentType>('document');
  const [prompt, setPrompt] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast(t('veo_studio.please_enter_prompt'), 'error');
      return;
    }

    setIsGenerating(true);
    setUploadedPdfUrl('');

    try {
      let html = '';

      if (activeTab === 'document') {
        html = await generateDocument(prompt);
      } else if (activeTab === 'resume') {
        html = await generateResume(prompt);
        console.log("html", html);
      } else if (activeTab === 'coverletter') {
        html = await generateCoverLetter(prompt);
      }

      setGeneratedHtml(html);
      showToast(t('veo_studio.document_generated_success'), 'success');

      // Upload PDF to backend
      setIsUploading(true);
      showToast(t('veo_studio.converting_uploading_pdf'), 'info');

      const response = await uploadPdf({ html });
      console.log('Uploaded PDF URL:', response.url);

      setUploadedPdfUrl(response.url);
      setIsUploading(false);

      showToast(t('veo_studio.pdf_uploaded_success'), 'success');

    } catch (error) {
      console.error('Failed to generate document:', error);
      showToast(t('veo_studio.failed_generate_document'), 'error');
      setIsUploading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedHtml) {
      showToast(t('veo_studio.please_generate_document_first'), 'error');
      return;
    }

    try {
      showToast(t('veo_studio.preparing_pdf_download'), 'info');

      // Create temporary container
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatedHtml;
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const opt = {
        margin: 0,
        filename: `${activeTab}-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(tempDiv).save();

      document.body.removeChild(tempDiv);
      showToast(t('veo_studio.pdf_downloaded_success'), 'success');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showToast(t('veo_studio.failed_download_pdf'), 'error');
    }
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case 'document':
        return t('veo_studio.document_placeholder');
      case 'resume':
        return t('veo_studio.resume_placeholder');
      case 'coverletter':
        return t('veo_studio.cover_letter_placeholder');
      default:
        return '';
    }
  };

  const getTabIcon = (tab: DocumentType) => {
    switch (tab) {
      case 'document':
        return FileText;
      case 'resume':
        return FileSignature;
      case 'coverletter':
        return Mail;
      default:
        return FileText;
    }
  };

  const getTabLabel = (tab: DocumentType) => {
    switch (tab) {
      case 'document':
        return t('veo_studio.document');
      case 'resume':
        return t('veo_studio.resume_cv');
      case 'coverletter':
        return t('veo_studio.cover_letter');
      default:
        return '';
    }
  };

  const tabs: DocumentType[] = ['document', 'resume', 'coverletter'];

  return (
    <div className="flex flex-col h-full bg-transparent w-full">
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-glass backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">{t('veo_studio.title')}</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400">{t('veo_studio.subtitle')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-3 justify-center">
            {tabs.map((tab) => {
              const Icon = getTabIcon(tab);
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPrompt('');
                    setGeneratedHtml('');
                    setUploadedPdfUrl('');
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-surface border border-glass-border text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {getTabLabel(tab)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6  mx-auto">
          {/* Left Column - Prompt Input */}
          <div className="space-y-6">
            <div className="bg-glass border border-glass-border rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{getTabLabel(activeTab)} {t('veo_studio.prompt_label')}</h3>
                  <p className="text-xs text-slate-400">{t('veo_studio.describe_what_to_create')}</p>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    {t('veo_studio.description')}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full h-64 bg-black/20 border border-glass-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('veo_studio.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('veo_studio.generate_document')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={!generatedHtml}
                  className="w-full py-3 px-4 bg-surface hover:bg-surface/80 disabled:bg-surface/50 disabled:cursor-not-allowed border border-glass-border text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  {t('veo_studio.download_pdf')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - PDF Preview Area */}
          <div className="space-y-6">
            <div className="bg-glass border border-glass-border rounded-3xl overflow-hidden ">
              <div className="bg-surface/50 px-6 py-4 border-b border-glass-border">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  {t('veo_studio.pdf_preview')}
                </h3>
              </div>

              <div className="h-[800px] overflow-auto bg-black/20" ref={previewContainerRef}>
                {isGenerating || isUploading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">
                      {isGenerating
                        ? t('veo_studio.generating_document')
                        : t('veo_studio.converting_uploading')}
                    </h3>
                    <p className="text-slate-500 text-sm">{t('veo_studio.may_take_moments')}</p>
                  </div>
                ) : uploadedPdfUrl ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="bg-surface/50 px-4 py-3 border-b border-glass-border flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Upload className="w-4 h-4 text-green-400" />
                        <span className="font-medium">{t('veo_studio.uploaded_cloud_storage')}</span>
                      </div>
                      <a
                        href={uploadedPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium underline"
                      >
                        {t('veo_studio.open_new_tab')}
                      </a>
                    </div>
                    <embed
                      src={uploadedPdfUrl}
                      type="application/pdf"
                      className="w-full flex-1"
                      style={{ minHeight: '550px' }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                    <div className="w-24 h-24 bg-surface/50 rounded-full flex items-center justify-center mb-6 border-2 border-glass-border">
                      <FileText className="w-12 h-12 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">{t('veo_studio.no_document_yet')}</h3>
                    <p className="text-slate-500 text-sm text-center max-w-md mb-8">{t('veo_studio.enter_prompt_generate')}</p>

                    <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                      <div className="bg-surface/50 rounded-xl p-4 border border-glass-border">
                        <Sparkles className="w-6 h-6 text-purple-400 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">{t('veo_studio.ai_powered')}</p>
                      </div>
                      <div className="bg-surface/50 rounded-xl p-4 border border-glass-border">
                        <FileText className="w-6 h-6 text-pink-400 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">{t('veo_studio.pdf_output')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
