import { forwardRef, useImperativeHandle, useRef, ForwardedRef } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  Separator,
  MDXEditorMethods
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

// ========== Types ==========

export interface MarkdownAreaProps {
  onChange?: (markdown: string) => void;
  initialContent?: string;
}

export interface MarkdownAreaHandle {
  getMarkdown: () => string;
  getInstance: () => {
    setMarkdown: (newValue: string) => void;
  };
}

const DEFAULT_CONTENT = `# How was your day?

Write about your thoughts, feelings, and experiences...`;

// ========== Component ==========

const MarkdownArea = forwardRef(({ onChange, initialContent }: MarkdownAreaProps, ref: ForwardedRef<MarkdownAreaHandle>) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      return editorRef.current?.getMarkdown() || '';
    },
    getInstance: () => ({
      setMarkdown: (newValue: string) => {
        editorRef.current?.setMarkdown(newValue);
      }
    })
  }));

  return (
    <div className="border-none rounded-2xl overflow-hidden bg-card shadow-lg">
      <style>
        {`
          .mdx-editor {
            background-color: transparent !important;
          }
          .mdx-editor .prose {
            text-align: left !important;
            color: var(--foreground) !important;
            max-width: none !important;
          }
          .mdx-editor .prose * {
            text-align: left !important;
            color: inherit !important;
          }
          .mdx-editor [data-editor-type="root"] {
            text-align: left !important;
            color: var(--foreground) !important;
          }
          .mdx-editor [contenteditable] {
            text-align: left !important;
            color: var(--foreground) !important;
            min-height: 300px;
            padding: 1.5rem !important;
          }
          /* Force all editor text to follow the current foreground token */
          .mdx-editor [contenteditable],
          .mdx-editor [contenteditable] *,
          .mdx-editor .mdxeditor-rich-text-editor,
          .mdx-editor .mdxeditor-rich-text-editor * {
            color: var(--foreground) !important;
          }
          /* Headings */
          .mdx-editor h1, .mdx-editor h2, .mdx-editor h3 {
            color: var(--foreground) !important;
            font-weight: 700 !important;
          }
          /* Links */
          .mdx-editor a { 
            color: var(--primary) !important; 
            text-decoration: underline;
          }
          /* Code */
          .mdx-editor code { 
            color: var(--foreground) !important; 
            background: var(--muted) !important;
            border-radius: 4px;
            padding: 0.1em 0.3em;
          }
          .mdx-editor pre { 
            background: var(--muted) !important;
            padding: 1rem;
            border-radius: 8px;
          }
          /* Toolbar override - Dark theme support */
          .mdx-editor [role="toolbar"] {
             background-color: color-mix(in oklab, var(--muted) 50%, transparent) !important;
             border-bottom: 1px solid var(--border) !important;
          }
          /* Invert toolbar icons for dark backgrounds */
          .mdx-editor [role="toolbar"] button svg {
            filter: invert(1) brightness(1.2) !important;
          }
          /* Ensure disabled buttons (undo/redo) are also properly styled */
          .mdx-editor [role="toolbar"] button:disabled svg {
            filter: invert(1) brightness(0.6) !important;
            opacity: 0.5 !important;
          }
          .mdx-editor [role="toolbar"] button {
             color: var(--foreground) !important;
          }
          .mdx-editor [role="toolbar"] button:hover {
             background-color: var(--accent) !important;
          }
          /* Select dropdown text */
          .mdx-editor [role="toolbar"] select {
            color: var(--foreground) !important;
            background-color: var(--background) !important;
            border-color: var(--border) !important;
          }
        `}
      </style>
      <MDXEditor
        ref={editorRef}
        markdown={initialContent ?? DEFAULT_CONTENT}
        onChange={onChange}
        contentEditableClassName="prose"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <ListsToggle />
                <InsertTable />
                <InsertThematicBreak />
              </>
            )
          })
        ]}
        className="mdx-editor"
      />
    </div>
  );
});

MarkdownArea.displayName = 'MarkdownArea';
export default MarkdownArea;
