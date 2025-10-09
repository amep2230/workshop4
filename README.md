# Next.js AI Image Editor

This project is a Next.js application that serves as an AI image editor. It allows users to upload images, input transformation prompts, and generate edited images using AI.

## Features

- Upload images for editing
- Input field for transformation prompts
- Generate images with a button click
- Display generated images with loading states

## Project Structure

```
nextjs-ai-image-editor
├── src
│   ├── app
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components
│   │   ├── Editor
│   │   │   ├── Canvas.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── index.tsx
│   │   └── ui
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── lib
│   │   ├── api.ts
│   │   └── utils.ts
│   └── types
│       └── index.ts
├── public
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nextjs-ai-image-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

- Navigate to `http://localhost:3000` in your browser.
- Use the upload form to select an image.
- Enter a transformation prompt in the textarea.
- Click the generate button to create the edited image.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.