# Chat with Your Notes - Client

This is the frontend client for the "Chat with Your Notes" application, built with React, TypeScript, and Tailwind CSS. It provides an intuitive interface for uploading documents, chatting with AI, and managing chat sessions.

## Features

- 📄 **File Upload**: Upload PDF, TXT, and DOCX files.
- 🤖 **AI Chat Interface**: Engage in natural language conversations with AI about your documents.
- 🔄 **Multi-File Chat**: Select and chat with multiple documents simultaneously.
- 💬 **Chat Session Management**: View, select, and delete past chat sessions with associated files and history.
- 🎨 **Modern UI**: Clean and responsive design with clearly distinguished user/AI messages, expandable context accordions, and a "Thinking..." indicator during AI processing.
- 🧭 **Sidebar Navigation**: Easily switch between a list of uploaded files and chat history.
- ⚡ **Real-time Streaming**: AI responses are streamed in real-time for a smoother user experience.
- 📝 **Markdown Formatting**: AI responses are rendered with full Markdown support.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Markdown Rendering**: `react-markdown`, `rehype-raw`

## Prerequisites

- Node.js 18+ or Bun
- Access to the backend server (typically running on `http://localhost:3001`)

## Setup Instructions

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install # or bun install or yarn install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the `client/` directory based on `env.example` (if one exists, otherwise ensure `VITE_API_URL` is set).
    ```env
    VITE_API_URL=http://localhost:3001/api
    ```
4.  **Start the development server:**
    ```bash
    npm run dev # or bun dev or yarn dev
    ```

## Development Scripts

-   `npm run dev`: Starts the development server with hot reload.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Locally previews the production build.
-   `npm run lint`: Runs ESLint for code linting.
