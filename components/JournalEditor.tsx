
import React, { useState, useRef, useEffect } from 'react';

interface ToolbarButtonProps {
  icon: string;
  onClick: () => void;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onClick, isActive }) => (
  <button 
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary/20 text-primary'
        : 'hover:bg-white/5 text-slate-400 hover:text-primary'
    }`}
  >
    <span className="material-symbols-outlined text-xl">{icon}</span>
  </button>
);

interface JournalEditorProps {
  initialContent?: string;
  onSave?: (content: string, wordCount: number, charCount: number) => void;
  appendRequest?: { id: number; text: string } | null;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialContent, onSave, appendRequest }) => {
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
    const lastAppendIdRef = useRef<number | null>(null);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        updateActiveFormats();
    };

    const updateCounts = () => {
        if (editorRef.current) {
            const text = editorRef.current.innerText || '';
            setCharCount(text.length);
            setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
        }
    };

    const handleSave = () => {
        const text = editorRef.current?.innerText ?? '';
        const wc = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const cc = text.length;
        onSave?.(text, wc, cc);
    };

    const updateActiveFormats = () => {
        const newActiveFormats: Record<string, boolean> = {};
        const formats = ['bold', 'italic', 'underline', 'strikeThrough'];
        formats.forEach(format => {
            newActiveFormats[format] = document.queryCommandState(format);
        });
        setActiveFormats(newActiveFormats);
    };

    useEffect(() => {
        const handleSelectionChange = () => {
            if (document.activeElement === editorRef.current) {
                updateActiveFormats();
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    useEffect(() => {
        if (!editorRef.current) return;
        if (typeof initialContent !== 'string') return;
        editorRef.current.innerText = initialContent;
        updateCounts();
    }, [initialContent]);

    useEffect(() => {
        if (!appendRequest) return;
        if (!editorRef.current) return;
        if (lastAppendIdRef.current === appendRequest.id) return;

        const current = editorRef.current.innerText || '';
        const trimmed = current.trim();
        const separator = trimmed.length > 0 && !current.endsWith('\n') ? '\n' : '';
        editorRef.current.innerText = current + separator + appendRequest.text;
        lastAppendIdRef.current = appendRequest.id;
        updateCounts();
    }, [appendRequest]);

    return (
        <div className="h-full bg-surface-dark/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-1 p-3 border-b border-white/5 bg-surface-dark/30 flex-wrap">
                <ToolbarButton icon="format_bold" onClick={() => handleFormat('bold')} isActive={activeFormats.bold} />
                <ToolbarButton icon="format_italic" onClick={() => handleFormat('italic')} isActive={activeFormats.italic} />
                <ToolbarButton icon="format_underlined" onClick={() => handleFormat('underline')} isActive={activeFormats.underline} />
                <ToolbarButton icon="format_strikethrough" onClick={() => handleFormat('strikeThrough')} isActive={activeFormats.strikeThrough} />
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <ToolbarButton icon="format_list_bulleted" onClick={() => handleFormat('insertUnorderedList')} />
                <ToolbarButton icon="format_list_numbered" onClick={() => handleFormat('insertOrderedList')} />
                <ToolbarButton icon="format_quote" onClick={() => handleFormat('formatBlock', 'blockquote')} />
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <ToolbarButton icon="format_clear" onClick={() => handleFormat('removeFormat')} />
                <div className="flex-1"></div>
                <span className="text-xs text-slate-500 font-medium px-2">Saved just now</span>
            </div>
            <div 
                ref={editorRef}
                contentEditable={true}
                onInput={updateCounts}
                onFocus={updateActiveFormats}
                className="flex-1 w-full bg-transparent border-none focus:ring-0 p-6 text-text-light text-lg leading-relaxed placeholder:text-slate-500 resize-none overflow-y-auto"
                data-placeholder="What's on your mind today, Alex? Let your thoughts flow freely..."
                style={{ minHeight: '200px' }}
            ></div>
            <div className="p-4 flex justify-between items-center bg-gradient-to-t from-surface-dark/50 to-transparent">
                <span className="text-xs text-slate-400 font-medium">{wordCount} words / {charCount} characters</span>
                <button onClick={handleSave} className="bg-primary hover:bg-secondary text-background-dark font-bold py-2 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(255,159,67,0.3)] hover:scale-105 flex items-center gap-2">
                    <span>Save Entry</span>
                    <span className="material-symbols-outlined text-sm">save</span>
                </button>
            </div>
        </div>
    );
};

export default JournalEditor;
