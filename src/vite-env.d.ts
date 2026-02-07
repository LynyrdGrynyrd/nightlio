/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    readonly VITE_MOCK_MODE?: string;
    // Add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Extend Window interface for Safari's webkitAudioContext
interface Window {
    webkitAudioContext?: typeof AudioContext;
}
