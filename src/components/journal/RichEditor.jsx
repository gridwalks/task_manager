import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, List, ListOrdered,
  Quote, Minus, RotateCcw, RotateCw,
} from 'lucide-react'

const TOOLBAR_BTN = (active) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, border: 'none', borderRadius: 4, cursor: 'pointer',
  background: active ? 'var(--surface-3, #e8e8f0)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--text-secondary)',
  transition: 'background 0.1s, color 0.1s',
  flexShrink: 0,
})

function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      style={{ ...TOOLBAR_BTN(active), opacity: disabled ? 0.3 : 1 }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />
}

function Toolbar({ editor }) {
  if (!editor) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
      padding: '5px 8px', borderBottom: '0.5px solid var(--border)',
      background: 'var(--surface-2)', borderRadius: 'var(--radius) var(--radius) 0 0',
    }}>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon size={13} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={13} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')} title="Bullet list">
        <List size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')} title="Ordered list">
        <ListOrdered size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false} title="Horizontal rule">
        <Minus size={13} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        active={false}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)">
        <RotateCcw size={13} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        active={false}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)">
        <RotateCw size={13} />
      </ToolbarBtn>
    </div>
  )
}

export default function RichEditor({ value, onChange, placeholder = 'Write your thoughts…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: [
          'outline: none',
          'min-height: 180px',
          'font-family: Georgia, "Times New Roman", serif',
          'font-size: 13px',
          'line-height: 1.7',
          'color: var(--text-primary)',
          'padding: 12px',
        ].join('; '),
      },
    },
  })

  // Sync external value changes (e.g. switching entries)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  return (
    <div style={{
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      flex: 1,
    }}>
      <Toolbar editor={editor} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <EditorContent editor={editor} style={{ height: '100%' }} />
      </div>
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .tiptap h2 { font-size: 16px; font-weight: 600; margin: 12px 0 4px; color: var(--text-primary); }
        .tiptap h3 { font-size: 14px; font-weight: 600; margin: 10px 0 4px; color: var(--text-primary); }
        .tiptap p { margin: 0 0 6px; }
        .tiptap ul, .tiptap ol { padding-left: 20px; margin: 4px 0 6px; }
        .tiptap li { margin-bottom: 2px; }
        .tiptap blockquote {
          border-left: 3px solid var(--accent);
          margin: 8px 0; padding: 4px 12px;
          color: var(--text-secondary);
          font-style: italic;
          background: var(--surface-2);
          border-radius: 0 var(--radius) var(--radius) 0;
        }
        .tiptap hr { border: none; border-top: 0.5px solid var(--border); margin: 12px 0; }
        .tiptap code { font-family: var(--mono); font-size: 11px; background: var(--surface-2); padding: 1px 4px; border-radius: 3px; }
        .tiptap pre { background: var(--surface-2); padding: 10px 12px; border-radius: var(--radius); font-family: var(--mono); font-size: 11px; overflow-x: auto; margin: 8px 0; }
        .tiptap strong { font-weight: 600; }
      `}</style>
    </div>
  )
}
