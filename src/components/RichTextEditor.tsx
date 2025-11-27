"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4 text-gray-900',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 font-semibold text-gray-700 ${
            editor.isActive('bold') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 italic text-gray-700 ${
            editor.isActive('italic') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 line-through text-gray-700 ${
            editor.isActive('strike') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Strikethrough"
        >
          S
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 font-bold text-gray-700 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 font-bold text-gray-700 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 font-bold text-gray-700 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Heading 3"
        >
          H3
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 text-gray-700 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 text-gray-700 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={setLink}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 text-gray-700 ${
            editor.isActive('link') ? 'bg-gray-300' : 'bg-white'
          }`}
          title="Add Link"
        >
          🔗 Link
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-1.5 rounded hover:bg-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-1.5 rounded hover:bg-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[300px] max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
