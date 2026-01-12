/* eslint-env node, jest */
/* global global */
import '@testing-library/jest-dom'
import React from 'react';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return store[key] || null;
        },
        setItem: function (key, value) {
            store[key] = value.toString();
        },
        removeItem: function (key) {
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
    value: (query) => ({
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
global.indexedDB = {
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
global.Notification = class {
    constructor() { }
    static requestPermission() {
        return Promise.resolve('granted');
    }
};
global.Notification.permission = 'default';

// Mock fetch
global.fetch = vi.fn(() => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: {
            get: () => null
        }
    });
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
