import React from 'react';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { all, createLowlight } from 'lowlight';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, Strikethrough, Code, Underline as UnderlineIcon,
  List, ListOrdered,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Quote, Undo, Redo,
  Minus, CornerDownLeft, Link2, Unlink,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Highlighter, ImagePlus, CodeSquare, Paintbrush, Type
} from 'lucide-react';
import './RichEditor.css';

const lowlight = createLowlight(all);

const extensions = [
  TextStyle,
  Color,
  Underline,
  FontFamily,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-cyan-400 underline hover:text-cyan-300 cursor-pointer',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
  }),
  StarterKit.configure({
    codeBlock: false, // Disable default code block
  }),
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'javascript',
  }),
];

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface MenuBarProps {
  editor: Editor;
}

function MenuBar({ editor }: MenuBarProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = React.useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = React.useState(false);
  const [showFontPicker, setShowFontPicker] = React.useState(false);
  const [editorBgColor, setEditorBgColor] = React.useState('#0F1020');
  const [linkUrl, setLinkUrl] = React.useState('');
  const [showLinkInput, setShowLinkInput] = React.useState(false);

  const editorState = useEditorState({
    editor,
    selector: ctx => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isUnderline: ctx.editor.isActive('underline') ?? false,
        canUnderline: ctx.editor.can().chain().toggleUnderline().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
        isHeading4: ctx.editor.isActive('heading', { level: 4 }) ?? false,
        isHeading5: ctx.editor.isActive('heading', { level: 5 }) ?? false,
        isHeading6: ctx.editor.isActive('heading', { level: 6 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        isLink: ctx.editor.isActive('link') ?? false,
        isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }) ?? false,
        isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }) ?? false,
        isAlignRight: ctx.editor.isActive({ textAlign: 'right' }) ?? false,
        isAlignJustify: ctx.editor.isActive({ textAlign: 'justify' }) ?? false,
        isHighlight: ctx.editor.isActive('highlight') ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
      };
    },
  });

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    disabled,
    isActive,
    title
  }: {
    icon: any;
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive
          ? 'text-purple-400 bg-purple-500/10'
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-glass-border mx-1 self-center" />;

  const textColors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];
  const highlightColors = ['#fef08a', '#fed7aa', '#fecaca', '#ddd6fe', '#bfdbfe', '#bbf7d0', '#fbcfe8'];
  const bgColors = ['#0F1020', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d4059', '#1f4037', '#000000', '#1e1e1e', '#2c3e50', '#34495e', '#ffffff'];
  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Comic Sans', value: 'Comic Sans MS, cursive' },
    { name: 'Impact', value: 'Impact, fantasy' },
    { name: 'Trebuchet', value: 'Trebuchet MS, sans-serif' },
    { name: 'Palatino', value: 'Palatino, serif' },
    { name: 'Garamond', value: 'Garamond, serif' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-glass-border bg-white/5 rounded-t-2xl">
      <ToolbarButton
        icon={Undo}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editorState.canUndo}
        title="Undo"
      />
      <ToolbarButton
        icon={Redo}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editorState.canRedo}
        title="Redo"
      />
      <Divider />
      <ToolbarButton
        icon={Heading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editorState.isHeading1}
        title="Heading 1"
      />
      <ToolbarButton
        icon={Heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editorState.isHeading2}
        title="Heading 2"
      />
      <ToolbarButton
        icon={Heading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editorState.isHeading3}
        title="Heading 3"
      />
      <Divider />
      <ToolbarButton
        icon={Bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editorState.canBold}
        isActive={editorState.isBold}
        title="Bold"
      />
      <ToolbarButton
        icon={Italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editorState.canItalic}
        isActive={editorState.isItalic}
        title="Italic"
      />
      <ToolbarButton
        icon={UnderlineIcon}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editorState.canUnderline}
        isActive={editorState.isUnderline}
        title="Underline"
      />
      <ToolbarButton
        icon={Strikethrough}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editorState.canStrike}
        isActive={editorState.isStrike}
        title="Strikethrough"
      />
      <ToolbarButton
        icon={Code}
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editorState.canCode}
        isActive={editorState.isCode}
        title="Inline Code"
      />
      <Divider />

      {/* Text Color */}
      <div className="relative">
        <ToolbarButton
          icon={Palette}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-glass-border rounded-lg shadow-lg z-10 flex gap-1">
            {textColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded border border-glass-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative">
        <ToolbarButton
          icon={Highlighter}
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          isActive={editorState.isHighlight}
          title="Highlight"
        />
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-glass-border rounded-lg shadow-lg z-10 flex gap-1">
            {highlightColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color }).run();
                  setShowHighlightPicker(false);
                }}
                className="w-6 h-6 rounded border border-glass-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setShowHighlightPicker(false);
              }}
              className="w-6 h-6 rounded border border-glass-border hover:scale-110 transition-transform bg-black/20 text-white text-xs flex items-center justify-center"
              title="Remove highlight"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Page Background Color */}
      <div className="relative">
        <ToolbarButton
          icon={Paintbrush}
          onClick={() => setShowBgColorPicker(!showBgColorPicker)}
          title="Page Background"
        />
        {showBgColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-glass-border rounded-lg shadow-lg z-10 grid grid-cols-4 gap-1">
            {bgColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setEditorBgColor(color);
                  const editorElement = editor.view.dom.closest('.tiptap-editor');
                  if (editorElement) {
                    (editorElement as HTMLElement).style.backgroundColor = color;
                  }
                  setShowBgColorPicker(false);
                }}
                className="w-8 h-8 rounded border border-glass-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Font Family */}
      <div className="relative">
        <ToolbarButton
          icon={Type}
          onClick={() => setShowFontPicker(!showFontPicker)}
          title="Font Family"
        />
        {showFontPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-glass-border rounded-lg shadow-lg z-10 w-48 max-h-64 overflow-y-auto custom-scrollbar">
            {fontFamilies.map((font) => (
              <button
                key={font.value}
                onClick={() => {
                  editor.chain().focus().setFontFamily(font.value).run();
                  setShowFontPicker(false);
                }}
                className="w-full text-left px-3 py-2 rounded text-sm text-white hover:bg-purple-500/20 transition-colors"
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Text Alignment */}
      <ToolbarButton
        icon={AlignLeft}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editorState.isAlignLeft}
        title="Align Left"
      />
      <ToolbarButton
        icon={AlignCenter}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editorState.isAlignCenter}
        title="Align Center"
      />
      <ToolbarButton
        icon={AlignRight}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editorState.isAlignRight}
        title="Align Right"
      />
      <ToolbarButton
        icon={AlignJustify}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editorState.isAlignJustify}
        title="Justify"
      />

      <Divider />

      <ToolbarButton
        icon={List}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editorState.isBulletList}
        title="Bullet List"
      />
      <ToolbarButton
        icon={ListOrdered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editorState.isOrderedList}
        title="Numbered List"
      />
      <Divider />

      {/* Link */}
      <div className="relative">
        {editorState.isLink ? (
          <ToolbarButton
            icon={Unlink}
            onClick={() => editor.chain().focus().unsetLink().run()}
            isActive={true}
            title="Remove Link"
          />
        ) : (
          <ToolbarButton
            icon={Link2}
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="Add Link"
          />
        )}
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-glass-border rounded-lg shadow-lg z-10 flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="px-2 py-1 bg-black/20 border border-glass-border rounded text-white text-sm w-48 focus:outline-none focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLink();
                if (e.key === 'Escape') setShowLinkInput(false);
              }}
            />
            <button
              onClick={addLink}
              className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <ToolbarButton
        icon={ImagePlus}
        onClick={addImage}
        title="Insert Image"
      />

      {/* Code Block */}
      <ToolbarButton
        icon={CodeSquare}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editorState.isCodeBlock}
        title="Code Block"
      />

      <Divider />

      <ToolbarButton
        icon={Quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editorState.isBlockquote}
        title="Quote"
      />
      <ToolbarButton
        icon={Minus}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      />
      <ToolbarButton
        icon={CornerDownLeft}
        onClick={() => editor.chain().focus().setHardBreak().run()}
        title="Hard Break"
      />
    </div>
  );
}

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = ''
}) => {
  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  // Update editor content when value changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex flex-col bg-glass backdrop-blur-md border border-glass-border rounded-2xl overflow-hidden ${className}`}>
      <MenuBar editor={editor} />
      <div className="relative">
        {!value && (
          <div className="absolute top-4 left-4 text-slate-500 pointer-events-none select-none text-sm">
            {placeholder}
          </div>
        )}
        <EditorContent
          editor={editor}
          className="tiptap-editor text-white text-sm overflow-y-auto custom-scrollbar"
        />
      </div>
    </div>
  );
};
