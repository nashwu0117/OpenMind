import { useEffect, useRef, useState } from 'react';
export function TextField(p: {
    value: string;
    onCommit: (v: string) => void;
    label: string;
    multiline?: boolean;
    placeholder?: string;
    disabled?: boolean;
}) { const [draft, setDraft] = useState(p.value); const cancel = useRef(false); useEffect(() => setDraft(p.value), [p.value]); const props = { 'aria-label': p.label, value: draft, placeholder: p.placeholder, disabled: p.disabled, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: () => { if (cancel.current) {
        cancel.current = false;
        return;
    } if (draft !== p.value)
        p.onCommit(draft); }, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Escape') {
        cancel.current = true;
        setDraft(p.value);
        (e.target as HTMLElement).blur();
    } if (e.key === 'Enter' && (!p.multiline || e.metaKey || e.ctrlKey))
        (e.target as HTMLElement).blur(); } }; return p.multiline ? <textarea rows={3} {...props}/> : <input {...props}/>; }
