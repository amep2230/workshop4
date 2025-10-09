// src/types/index.ts

export interface ImageUpload {
    file: File;
    prompt: string;
}

export interface GeneratedImage {
    url: string;
    loading: boolean;
}

export interface EditorState {
    image: GeneratedImage | null;
    prompt: string;
}