import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, Eraser,
  List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Quote, Code, 
  Heading1, Heading2, 
  Undo, Redo,
  Paperclip,
  Check, X, Image as ImageIcon, Trash2, Maximize2,
  Type, Highlighter
} from 'lucide-react';
import { Button } from './Button'; 
import { useAppContext } from '../../contexts/AppContext';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({ value, onChange, placeholder, className = '' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textColorRef = useRef<HTMLInputElement>(null);
  const bgColorRef = useRef<HTMLInputElement>(null);
  
  // State for editor interaction
  const [isFocused, setIsFocused] = useState(false);
  
  // State for Link Management
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // State for Image Management
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Confirmation Context
  const { requestConfirm } = useAppContext();

  // Sync external value changes safely
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
         if (editorRef.current.innerHTML === '<br>' && !value) return;
         editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle emitting changes
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' ? '' : html);
    }
  };

  // --- Core Editing Commands ---
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // --- Link Handling ---
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  };

  const handleLinkBtnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    saveSelection();
    setShowLinkInput(true);
    setLinkUrl('');
  };

  const applyLink = () => {
    restoreSelection();
    if (linkUrl) {
      execCommand('createLink', linkUrl);
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  // --- Image Handling ---
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
      const fileSize = (file.size / 1024).toFixed(1) + ' KB';
      const isImage = file.type.startsWith('image/');
      
      let attachmentHtml = '';
      
      if (isImage) {
          const url = URL.createObjectURL(file);
          // Default styling for new images
          attachmentHtml = `<img src="${url}" alt="${file.name}" style="max-width: 100%; width: 300px; border-radius: 8px; cursor: pointer;" />`;
      } else {
          attachmentHtml = `
            <div contenteditable="false" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px 12px; margin: 4px 0; font-family: sans-serif; user-select: none;">
               <span style="font-size: 18px;">📎</span>
               <div>
                 <div style="font-size: 13px; font-weight: 600; color: #fff;">${file.name}</div>
                 <div style="font-size: 10px; color: #ccc;">${fileSize} • ${file.type || 'Document'}</div>
               </div>
            </div>&nbsp;
          `;
      }
      
      editorRef.current.focus();
      // Insert HTML at cursor
      document.execCommand('insertHTML', false, attachmentHtml);
      document.execCommand('insertHTML', false, '<br>'); // Add break line
      handleInput();
      
      e.target.value = ''; // Reset input
    }
  };

  // Detect clicks on images to select them
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
        setSelectedImage(target as HTMLImageElement);
    } else {
        // Deselect if clicking elsewhere (unless clicking resize controls)
        setSelectedImage(null);
    }
  };

  // --- Image Resize & Align Logic ---
  
  const updateImageStyle = (styles: Partial<CSSStyleDeclaration>) => {
    if (selectedImage) {
        Object.assign(selectedImage.style, styles);
        handleInput();
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    if (!selectedImage) return;

    const startX = e.clientX;
    const startWidth = selectedImage.clientWidth;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
        const currentX = moveEvent.clientX;
        const diff = currentX - startX;
        const newWidth = Math.max(50, startWidth + diff); // Min width 50px
        selectedImage.style.width = `${newWidth}px`;
        // Auto height
        selectedImage.style.height = 'auto'; 
    };

    const onMouseUp = () => {
        setIsResizing(false);
        handleInput(); // Save state
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const alignImage = (align: 'left' | 'center' | 'right') => {
      if (!selectedImage) return;
      selectedImage.style.display = 'block';
      if (align === 'left') {
          selectedImage.style.marginLeft = '0';
          selectedImage.style.marginRight = 'auto';
      } else if (align === 'center') {
          selectedImage.style.marginLeft = 'auto';
          selectedImage.style.marginRight = 'auto';
      } else if (align === 'right') {
          selectedImage.style.marginLeft = 'auto';
          selectedImage.style.marginRight = '0';
      }
      handleInput();
  };

  const deleteSelectedImage = () => {
      requestConfirm({
          title: "Remove Image",
          message: "Are you sure you want to remove this image from the editor?",
          onConfirm: () => {
            if (selectedImage) {
                selectedImage.remove();
                setSelectedImage(null);
                handleInput();
            }
          },
          variant: 'danger'
      });
  };


  // --- UI Components ---

  const ToolbarButton = ({ icon: Icon, command, arg, title, isActive, onClick }: any) => (
    <button
      title={title}
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing focus from editor
        if (onClick) onClick(e);
        else execCommand(command, arg);
      }}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive 
            ? 'text-fuchsia-400 bg-fuchsia-500/10' 
            : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-glass-border mx-1 self-center" />;

  return (
    <div className={`flex flex-col relative bg-glass backdrop-blur-md border border-glass-border rounded-2xl transition-all group shadow-xl shadow-black/5 ${isFocused ? 'ring-1 ring-fuchsia-500/50 border-fuchsia-500/50' : ''} ${className}`}>
      
      {/* Hidden Color Inputs */}
      <input 
        type="color" 
        ref={textColorRef} 
        className="invisible absolute w-0 h-0 opacity-0" 
        onChange={(e) => execCommand('foreColor', e.target.value)}
        title="Text Color"
      />
      <input 
        type="color" 
        ref={bgColorRef} 
        className="invisible absolute w-0 h-0 opacity-0" 
        onChange={(e) => execCommand('hiliteColor', e.target.value)}
        title="Background Color"
      />

      {/* --- Main Toolbar --- */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-glass-border bg-white/5 rounded-t-2xl z-20 relative">
        <ToolbarButton icon={Undo} command="undo" title="Undo" />
        <ToolbarButton icon={Redo} command="redo" title="Redo" />
        <Divider />
        <ToolbarButton icon={Heading1} command="formatBlock" arg="H1" title="Heading 1" />
        <ToolbarButton icon={Heading2} command="formatBlock" arg="H2" title="Heading 2" />
        <Divider />
        <ToolbarButton icon={Bold} command="bold" title="Bold" />
        <ToolbarButton icon={Italic} command="italic" title="Italic" />
        <ToolbarButton icon={Underline} command="underline" title="Underline" />
        <ToolbarButton icon={Strikethrough} command="strikeThrough" title="Strikethrough" />
        <ToolbarButton icon={Eraser} command="removeFormat" title="Clear Formatting" />
        <Divider />
        <ToolbarButton icon={Type} title="Text Color" onClick={() => textColorRef.current?.click()} />
        <ToolbarButton icon={Highlighter} title="Highlight Color" onClick={() => bgColorRef.current?.click()} />
        <Divider />
        <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
        <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />
        <Divider />
        <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" />
        <Divider />
        <ToolbarButton icon={LinkIcon} onClick={handleLinkBtnClick} title="Insert Link" isActive={showLinkInput} />
        <ToolbarButton icon={Quote} command="formatBlock" arg="blockquote" title="Quote" />
        <ToolbarButton icon={Code} command="formatBlock" arg="pre" title="Code Block" />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-glass-border text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors ml-2"
        >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Attach</span>
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            multiple
        />
      </div>

      {/* --- Link Input Popover --- */}
      {showLinkInput && (
        <div className="absolute top-12 left-4 z-30 p-2 bg-[#1A1B2E] border border-glass-border rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 w-72">
           <input 
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-black/20 border border-glass-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-fuchsia-500"
              onKeyDown={(e) => e.key === 'Enter' && applyLink()}
           />
           <button onClick={applyLink} className="p-1.5 bg-fuchsia-500 hover:bg-fuchsia-600 rounded-lg text-white"><Check className="w-3 h-3" /></button>
           <button onClick={() => setShowLinkInput(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* --- Editable Area --- */}
      <div className="relative flex-1 bg-transparent rounded-b-2xl overflow-hidden min-h-[200px]">
        {!value && (
            <div className="absolute top-4 left-4 text-slate-600 pointer-events-none select-none text-sm font-light z-0">
                {placeholder || "Type your message..."}
            </div>
        )}
        
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onMouseDown={handleEditorClick}
            className="w-full h-full p-4 text-sm text-white focus:outline-none prose prose-invert prose-sm max-w-none 
            [&_blockquote]:border-l-4 [&_blockquote]:border-fuchsia-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-white/5 [&_blockquote]:py-1
            [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:text-white
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-white
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_a]:text-cyan-400 [&_a]:underline
            overflow-y-auto custom-scrollbar"
            style={{ minHeight: '200px' }}
        />

        {/* --- Image Selection Overlay --- */}
        {selectedImage && (
             <div 
                className="absolute pointer-events-none"
                style={{
                    top: selectedImage.offsetTop,
                    left: selectedImage.offsetLeft,
                    width: selectedImage.clientWidth,
                    height: selectedImage.clientHeight,
                    border: '2px solid #d946ef',
                    boxShadow: '0 0 10px rgba(217, 70, 239, 0.3)',
                    zIndex: 10
                }}
             >
                {/* Image Toolbar */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1A1B2E] border border-glass-border rounded-lg shadow-xl flex gap-1 p-1 pointer-events-auto">
                    <button onClick={() => alignImage('left')} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
                    <button onClick={() => alignImage('center')} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
                    <button onClick={() => alignImage('right')} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="Align Right"><AlignRight className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-white/10 self-center mx-1"></div>
                    <button onClick={deleteSelectedImage} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </div>

                {/* Resize Handle */}
                <div 
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-fuchsia-500 border-2 border-white rounded-full cursor-se-resize pointer-events-auto shadow-md hover:scale-125 transition-transform"
                    onMouseDown={handleResizeMouseDown}
                ></div>
             </div>
        )}
      </div>
    </div>
  );
};