import '@testing-library/jest-dom'
import React from 'react';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: function (key: string) {
            return store[key] || null;
        },
        setItem: function (key: string, value: string) {
            store[key] = value.toString();
        },
        removeItem: function (key: string) {
            delete store[key];
        },
        clear: function () {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
    }),
});

// Mock indexedDB
(globalThis as Record<string, unknown>).indexedDB = {
    open: () => ({
        result: {
            objectStoreNames: { contains: () => false },
            createObjectStore: () => ({}),
            transaction: () => ({ objectStore: () => ({}) })
        },
        addEventListener: () => { },
        removeEventListener: () => { },
        onsuccess: null,
        onerror: null,
    }),
};

// Mock Notification
(globalThis as Record<string, unknown>).Notification = Object.assign(
    class { static requestPermission() { return Promise.resolve('granted' as NotificationPermission); } },
    { permission: 'default' as NotificationPermission }
);

// Mock fetch
globalThis.fetch = vi.fn(() => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: {
            get: () => null
        }
    } as unknown as Response);
});

// Mock @mdxeditor/editor
vi.mock('@mdxeditor/editor', () => ({
    MDXEditor: () => React.createElement('div', { 'data-testid': 'mock-mdx-editor' }, 'MDX Editor'),
    headingsPlugin: () => { },
    listsPlugin: () => { },
    quotePlugin: () => { },
    thematicBreakPlugin: () => { },
    markdownShortcutPlugin: () => { },
    linkPlugin: () => { },
    linkDialogPlugin: () => { },
    imagePlugin: () => { },
    tablePlugin: () => { },
    frontmatterPlugin: () => { },
    codeBlockPlugin: () => { },
    sandpackPlugin: () => { },
    codeMirrorPlugin: () => { },
    diffSourcePlugin: () => { },
    toolbarPlugin: () => { },
    directivesPlugin: () => { },
    AdmonitionDirectiveDescriptor: {},
    BlockTypeSelect: () => { },
    BoldItalicUnderlineToggles: () => { },
    CreateLink: () => { },
    InsertTable: () => { },
    InsertThematicBreak: () => { },
    ListsToggle: () => { },
    UndoRedo: () => { },
    CodeToggle: () => { },
    Separator: () => { },
}));
