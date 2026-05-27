import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  RemoveFormatting,
  ChevronDown,
} from 'lucide-react';
import { alertNoLinks, hasExternalLinks } from '../../utils/productContentValidation';

/** Font sizes 2, 4, 6, … 100 (px) for the text size dropdown */
const TEXT_SIZES = Array.from({ length: 50 }, (_, i) => {
  const n = 2 + i * 2;
  return { label: String(n), value: `${n}px` };
});

function ToolbarButton({ onMouseDown, title, children, active = false }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`w-8 h-8 flex items-center justify-center rounded hover:bg-[#E1E3E5] text-[#202223] ${
        active ? 'bg-[#E1E3E5]' : ''
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-6 bg-[#C9CCCF] mx-0.5" />;
}

function FontSizePicker({ saveSelection, applyFontSize }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapRef} className="relative mr-1 shrink-0">
      <button
        type="button"
        title="Font size (2–100) — select text, then pick a size"
        aria-label="Font size"
        aria-expanded={open}
        onMouseDown={(e) => {
          e.preventDefault();
          saveSelection();
        }}
        onClick={() => setOpen((prev) => !prev)}
        className="h-8 min-w-[72px] px-2 text-[12px] border border-[#C9CCCF] rounded bg-white text-[#202223] flex items-center justify-between gap-1 hover:bg-[#F1F2F3]"
      >
        <span>Size</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          className="absolute left-0 top-full mt-1 z-[200] w-[72px] max-h-[220px] overflow-y-auto overflow-x-hidden bg-white border border-[#C9CCCF] rounded-md shadow-lg py-1"
          role="listbox"
        >
          {TEXT_SIZES.map((f) => (
            <li key={f.value} role="option">
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-[13px] text-[#202223] hover:bg-[#EBF5FA] hover:text-[#005bd3]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  applyFontSize(f.value);
                  setOpen(false);
                }}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function normalizeEditorHtml(html) {
  const t = (html || '').trim();
  if (!t || t === '<br>' || t === '<div><br></div>') return '';
  return html;
}

function isEditorEmpty(editor) {
  const html = (editor?.innerHTML || '').trim();
  return !html || html === '<br>' || html === '<div><br></div>';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function ProductRichTextEditor({
  value,
  onChange,
  placeholder = 'Enter care instructions...',
}) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const lastValueRef = useRef(value || '');
  const [foreColor, setForeColor] = useState('#202223');
  const [backColor, setBackColor] = useState('#ffffff');

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    selectionRef.current = range.cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const saved = selectionRef.current;
    if (!saved) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(saved);
  }, []);

  const sync = useCallback(() => {
    if (!editorRef.current) return;
    const html = normalizeEditorHtml(editorRef.current.innerHTML);
    lastValueRef.current = html;
    onChange(html);
    saveSelection();
  }, [onChange, saveSelection]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (document.activeElement === editorRef.current) return;
    const next = value || '';
    if (lastValueRef.current === next && editorRef.current.innerHTML === next) return;
    editorRef.current.innerHTML = next;
    lastValueRef.current = next;
  }, [value]);

  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
      lastValueRef.current = value;
    }
  }, []);

  const applyFontSize = useCallback(
    (sizePx) => {
      const editor = editorRef.current;
      if (!editor || !sizePx) return;

      restoreSelection();

      const sel = window.getSelection();
      const selectedText = sel?.toString() || '';

      if (!selectedText) {
        document.execCommand(
          'insertHTML',
          false,
          `<span style="font-size: ${sizePx}">&#8203;</span>`
        );
      } else {
        document.execCommand(
          'insertHTML',
          false,
          `<span style="font-size: ${sizePx}">${escapeHtml(selectedText)}</span>`
        );
      }

      sync();
    },
    [restoreSelection, sync]
  );

  const runCommand = useCallback(
    (command, arg = null) => {
      const editor = editorRef.current;
      if (!editor) return;

      restoreSelection();

      if (command === 'insertUnorderedList' && isEditorEmpty(editor)) {
        document.execCommand('insertHTML', false, '<ul><li><br></li></ul>');
      } else if (command === 'insertOrderedList' && isEditorEmpty(editor)) {
        document.execCommand('insertHTML', false, '<ol><li><br></li></ol>');
      } else {
        document.execCommand(command, false, arg);
      }

      sync();
    },
    [restoreSelection, sync]
  );

  const toolbarMouseDown = (e, fn) => {
    e.preventDefault();
    saveSelection();
    fn();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text/plain') || '';
    const html = e.clipboardData?.getData('text/html') || '';
    if (hasExternalLinks(text) || hasExternalLinks(html)) {
      e.preventDefault();
      alertNoLinks();
      return;
    }
    e.preventDefault();
    restoreSelection();
    const plain = text.replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, plain);
    sync();
  };

  return (
    <div className="w-full bg-white flex flex-col border border-[#8C9196] rounded-md focus-within:ring-2 focus-within:ring-[#005bd3] focus-within:border-[#005bd3]">
      <div className="relative z-20 flex flex-wrap items-center gap-0.5 p-1.5 border-b border-[#E1E3E5] bg-[#F6F6F7] overflow-visible">
        <FontSizePicker saveSelection={saveSelection} applyFontSize={applyFontSize} />

        <ToolbarDivider />
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('bold'))}
          title="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('italic'))}
          title="Italic"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('underline'))}
          title="Underline"
        >
          <Underline size={16} />
        </ToolbarButton>

        <label
          className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-[#E1E3E5] cursor-pointer"
          title="Text color"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
        >
          <span className="text-[13px] font-bold underline" style={{ color: foreColor }}>
            A
          </span>
          <input
            type="color"
            value={foreColor}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => {
              setForeColor(e.target.value);
              runCommand('foreColor', e.target.value);
            }}
          />
        </label>
        <label
          className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-[#E1E3E5] cursor-pointer border border-[#C9CCCF]"
          title="Background color"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
        >
          <span className="w-4 h-4 rounded-sm border border-[#8C9196]" style={{ backgroundColor: backColor }} />
          <input
            type="color"
            value={backColor}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => {
              setBackColor(e.target.value);
              runCommand('hiliteColor', e.target.value);
            }}
          />
        </label>

        <ToolbarDivider />
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('justifyLeft'))}
          title="Align left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('justifyCenter'))}
          title="Align center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('justifyRight'))}
          title="Align right"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('justifyFull'))}
          title="Justify"
        >
          <AlignJustify size={16} />
        </ToolbarButton>

        <ToolbarDivider />
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('insertOrderedList'))}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('insertUnorderedList'))}
          title="Bulleted list"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('indent'))}
          title="Indent"
        >
          <IndentIncrease size={16} />
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('outdent'))}
          title="Outdent"
        >
          <IndentDecrease size={16} />
        </ToolbarButton>

        <ToolbarDivider />
        <ToolbarButton
          onMouseDown={(e) => toolbarMouseDown(e, () => runCommand('removeFormat'))}
          title="Clear formatting"
        >
          <RemoveFormatting size={16} />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        className="product-rich-editor p-3 min-h-[160px] max-h-[320px] overflow-y-auto overflow-x-hidden rounded-b-md outline-none text-[#202223] text-[14px] bg-white"
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={handlePaste}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        data-placeholder={placeholder}
      />
    </div>
  );
}
