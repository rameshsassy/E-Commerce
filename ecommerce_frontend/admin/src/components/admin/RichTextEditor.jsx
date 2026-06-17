import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, Unlink, List, ListOrdered, Undo2, Redo2, Type } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = "Type here..." }) {
  const editorRef = useRef(null);

  // Sync value from parent, but only if it's different from current HTML (to prevent cursor jumps)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleAddLink = () => {
    const selection = window.getSelection();
    let defaultUrl = "";
    if (selection && selection.rangeCount > 0) {
      const parent = selection.anchorNode.parentNode;
      if (parent && parent.tagName === 'A') {
        defaultUrl = parent.href;
      }
    }
    const url = prompt('Enter hyperlink URL:', defaultUrl || 'https://');
    if (url) {
      exec('createLink', url);
    }
  };

  const handleRemoveLink = () => {
    exec('unlink');
  };

  const changeFontSize = (direction) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Standard sizes: 1=x-small, 2=small, 3=normal, 4=large, 5=x-large, 6=xx-large, 7=xxx-large
    let currentSize = 3;
    const parent = selection.anchorNode.parentNode;
    if (parent && parent.tagName === 'FONT' && parent.size) {
      currentSize = parseInt(parent.size) || 3;
    }
    
    let newSize = currentSize;
    if (direction === 'increase') {
      newSize = Math.min(7, currentSize + 1);
    } else {
      newSize = Math.max(1, currentSize - 1);
    }
    
    exec('fontSize', newSize.toString());
  };

  return (
    <div className="border border-glass-border rounded-xl overflow-hidden bg-white/5 focus-within:border-primary transition-all">
      <style>{`
        .policy-rich-editor:empty:before {
          content: attr(placeholder);
          color: #94a3b8;
          opacity: 0.5;
          pointer-events: none;
          display: block;
        }
        .policy-rich-editor a {
          color: #6366f1;
          text-decoration: underline;
        }
        .policy-rich-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .policy-rich-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .policy-rich-editor li {
          display: list-item;
          margin: 0.25rem 0;
        }
        .policy-rich-editor h1 {
          font-size: 1.875rem;
          font-weight: 800;
          margin: 0.75rem 0;
        }
        .policy-rich-editor h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        .policy-rich-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }
      `}</style>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/5 border-b border-glass-border text-text-muted">
        <button type="button" onClick={() => exec('bold')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Bold"><Bold size={16} /></button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Italic"><Italic size={16} /></button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Underline"><Underline size={16} /></button>
        
        <div className="h-4 w-px bg-glass-border mx-1" />
        
        <button type="button" onClick={() => changeFontSize('increase')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Increase Font Size"><Type size={16} className="scale-110" /></button>
        <button type="button" onClick={() => changeFontSize('decrease')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Decrease Font Size"><Type size={16} className="scale-90" /></button>
        
        <div className="h-4 w-px bg-glass-border mx-1" />
        
        <button type="button" onClick={() => exec('formatBlock', '<p>')} className="px-2 py-1 rounded text-xs font-bold hover:bg-white/10 hover:text-white transition-colors" title="Paragraph">P</button>
        <button type="button" onClick={() => exec('formatBlock', '<h1>')} className="px-2 py-1 rounded text-xs font-bold hover:bg-white/10 hover:text-white transition-colors" title="Heading 1">H1</button>
        <button type="button" onClick={() => exec('formatBlock', '<h2>')} className="px-2 py-1 rounded text-xs font-bold hover:bg-white/10 hover:text-white transition-colors" title="Heading 2">H2</button>
        <button type="button" onClick={() => exec('formatBlock', '<h3>')} className="px-2 py-1 rounded text-xs font-bold hover:bg-white/10 hover:text-white transition-colors" title="Heading 3">H3</button>
        
        <div className="h-4 w-px bg-glass-border mx-1" />
        
        <button type="button" onClick={() => exec('justifyLeft')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Align Left"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => exec('justifyCenter')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Align Center"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => exec('justifyRight')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Align Right"><AlignRight size={16} /></button>
        <button type="button" onClick={() => exec('justifyFull')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Justify"><AlignJustify size={16} /></button>
        
        <div className="h-4 w-px bg-glass-border mx-1" />
        
        <button type="button" onClick={handleAddLink} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Add/Edit Link"><Link2 size={16} /></button>
        <button type="button" onClick={handleRemoveLink} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Remove Link"><Unlink size={16} /></button>
        
        <div className="h-4 w-px bg-glass-border mx-1" />
        
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Bullet List"><List size={16} /></button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Numbered List"><ListOrdered size={16} /></button>
        
        <div className="h-4 w-px bg-glass-border mx-1" />
        
        <button type="button" onClick={() => exec('undo')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Undo"><Undo2 size={16} /></button>
        <button type="button" onClick={() => exec('redo')} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors" title="Redo"><Redo2 size={16} /></button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[250px] max-h-[500px] overflow-y-auto outline-none text-white text-sm leading-relaxed policy-rich-editor max-w-none"
        style={{ caretColor: 'var(--color-primary)' }}
        placeholder={placeholder}
      />
    </div>
  );
}
