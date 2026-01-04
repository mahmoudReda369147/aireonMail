import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Sparkles, Loader2, FileSignature, Mail } from 'lucide-react';
import { generateDocument, generateResume, generateCoverLetter } from '../services/geminiService';
import { useToast } from '../components/common/Toast';
import html2pdf from 'html2pdf.js';

type DocumentType = 'document' | 'resume' | 'coverletter';

export const VeoStudio: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<DocumentType>('document');
  const [prompt, setPrompt] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [pdfDataUrl, setPdfDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConvertingToPdf, setIsConvertingToPdf] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const convertHtmlToPdf = async (html: string): Promise<string> => {
    // Create a temporary container for the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '20mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const opt = {
        margin: 0,
        filename: `${activeTab}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF and get blob
      const pdfBlob = await html2pdf().set(opt).from(tempDiv).output('blob');

      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfBlob);
      });

      return dataUrl;
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt to generate your document', 'error');
      return;
    }

    setIsGenerating(true);
    setPdfDataUrl('');

    try {
      let html = '';

      if (activeTab === 'document') {
        html = await generateDocument(prompt);
      } else if (activeTab === 'resume') {
        html = await generateResume(prompt);
      } else if (activeTab === 'coverletter') {
        html = await generateCoverLetter(prompt);
      }

      setGeneratedHtml(html);
      showToast('Document generated successfully!', 'success');

      // Convert to PDF
      setIsConvertingToPdf(true);
      const pdfUrl = await convertHtmlToPdf(html);
      setPdfDataUrl(pdfUrl);
      setIsConvertingToPdf(false);

    } catch (error) {
      console.error('Failed to generate document:', error);
      showToast('Failed to generate document. Please try again.', 'error');
      setIsConvertingToPdf(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedHtml) {
      showToast('Please generate a document first', 'error');
      return;
    }

    try {
      showToast('Preparing PDF download...', 'info');

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
      showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showToast('Failed to download PDF', 'error');
    }
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case 'document':
        return 'Example: Create a professional business proposal for a web development project worth $50,000. Include executive summary, project scope, timeline, and pricing...';
      case 'resume':
        return 'Example: Create a resume for a Senior Full Stack Developer with 5 years of experience in React, Node.js, TypeScript, AWS, and Docker. Include 3 previous positions at tech companies...';
      case 'coverletter':
        return 'Example: Create a cover letter for a Software Engineer position at Google. Highlight my 4 years of experience in distributed systems and my passion for building scalable applications...';
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
        return 'Document';
      case 'resume':
        return 'Resume/CV';
      case 'coverletter':
        return 'Cover Letter';
      default:
        return '';
    }
  };

  const tabs: DocumentType[] = ['document', 'resume', 'coverletter'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              Document Studio
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Create professional documents with AI-powered generation</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
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
                    setPdfDataUrl('');
                  }}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {getTabLabel(tab)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Prompt Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                {getTabLabel(activeTab)} Prompt
              </h2>

              {/* Prompt Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Describe your {getTabLabel(activeTab).toLowerCase()}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full h-64 bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate {getTabLabel(activeTab)}
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={!generatedHtml}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed border border-slate-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - PDF Preview Area */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden">
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  PDF Preview
                </h3>
              </div>

              <div className="h-[700px] overflow-auto bg-slate-800/30" ref={previewContainerRef}>
                {isGenerating || isConvertingToPdf ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="w-16 h-16 animate-spin text-purple-400 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 mb-2">
                      {isGenerating
                        ? `Generating your ${getTabLabel(activeTab).toLowerCase()}...`
                        : 'Converting to PDF...'}
                    </h3>
                    <p className="text-slate-600">This may take a few moments</p>
                  </div>
                ) : pdfDataUrl ? (
                  <div className="w-full h-full">
                    <embed
                      src={pdfDataUrl}
                      type="application/pdf"
                      className="w-full h-full"
                      style={{ minHeight: '700px' }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-slate-700">
                      <FileText className="w-16 h-16 opacity-30" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-400 mb-2">No Document Yet</h3>
                    <p className="text-slate-600 mb-6">Enter a prompt and click "Generate" to create your PDF document</p>

                    <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
                        <p className="text-sm text-slate-400">AI-Powered</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <FileText className="w-8 h-8 text-pink-400 mb-2" />
                        <p className="text-sm text-slate-400">PDF Output</p>
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
