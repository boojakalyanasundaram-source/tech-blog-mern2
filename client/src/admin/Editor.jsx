import { useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Youtube from '@tiptap/extension-youtube';
import { api } from '../api';
import { useToast } from './Toast.jsx';

function Btn({ onClick, active, label, children, disabled }) {
  return (
    <button type="button" className={active ? 'is-active' : ''} onClick={onClick} aria-label={label} title={label} aria-pressed={active} disabled={disabled}>
      {children}
    </button>
  );
}

export default function Editor({ initialContent, onChange }) {
  const toast = useToast();
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: 'Start writing your article. Use headings (H2/H3) to build the table of contents.' }),
    ],
    content: initialContent || '',
    editorProps: { attributes: { class: 'prose', 'aria-label': 'Article content' } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return null;
  const chain = () => editor.chain().focus();

  const setLink = () => {
    const previous = editor.getAttributes('link').href || '';
    const url = window.prompt('Link address (leave empty to remove the link)', previous);
    if (url === null) return;
    if (url === '') chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addVideo = () => {
    const url = window.prompt('YouTube video address');
    if (url) chain().setYoutubeVideo({ src: url }).run();
  };

  const toggleCode = () => {
    if (editor.isActive('codeBlock')) return chain().toggleCodeBlock().run();
    const lang = window.prompt('Code language (for example js, python, html, bash). Leave empty for plain text', 'js');
    chain().toggleCodeBlock().run();
    if (lang) editor.chain().updateAttributes('codeBlock', { language: lang.trim() }).run();
    return undefined;
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { url } = await api.upload(file);
      const alt = window.prompt('Describe this image for screen readers and search engines', '') || '';
      chain().setImage({ src: url, alt }).run();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="editor">
      <div className="editor__bar" role="toolbar" aria-label="Formatting">
        <Btn label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</Btn>
        <Btn label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</Btn>
        <Btn label="Heading 4" active={editor.isActive('heading', { level: 4 })} onClick={() => chain().toggleHeading({ level: 4 }).run()}>H4</Btn>
        <span className="editor__sep" />
        <Btn label="Bold" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}><b>B</b></Btn>
        <Btn label="Italic" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}><i>I</i></Btn>
        <Btn label="Strikethrough" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}><s>S</s></Btn>
        <Btn label="Inline code" active={editor.isActive('code')} onClick={() => chain().toggleCode().run()}>{'</>'}</Btn>
        <Btn label="Link" active={editor.isActive('link')} onClick={setLink}>Link</Btn>
        <span className="editor__sep" />
        <Btn label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>List</Btn>
        <Btn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>1.</Btn>
        <Btn label="Quote" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}>Quote</Btn>
        <Btn label="Code block" active={editor.isActive('codeBlock')} onClick={toggleCode}>Code</Btn>
        <Btn label="Divider" onClick={() => chain().setHorizontalRule().run()}>Line</Btn>
        <span className="editor__sep" />
        <Btn label="Upload image" onClick={() => fileRef.current?.click()}>Image</Btn>
        <Btn label="Embed YouTube video" onClick={addVideo}>Video</Btn>
        <Btn label="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</Btn>
        {editor.isActive('table') && (
          <>
            <Btn label="Add column" onClick={() => chain().addColumnAfter().run()}>+Col</Btn>
            <Btn label="Add row" onClick={() => chain().addRowAfter().run()}>+Row</Btn>
            <Btn label="Delete column" onClick={() => chain().deleteColumn().run()}>-Col</Btn>
            <Btn label="Delete row" onClick={() => chain().deleteRow().run()}>-Row</Btn>
            <Btn label="Delete table" onClick={() => chain().deleteTable().run()}>Del table</Btn>
          </>
        )}
        <span className="editor__sep" />
        <Btn label="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>Undo</Btn>
        <Btn label="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>Redo</Btn>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden onChange={uploadImage} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
