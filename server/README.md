# Chat with Your Notes - Server

This is the backend server for the "Chat with Your Notes" application, responsible for handling file uploads, document processing, AI interactions, and chat session management. It's built with Express, TypeScript, Prisma, and PostgreSQL, and designed for flexible integration with various Large Language Models (LLMs).

## Features

- 📂 **File Management API**: Handles upload, storage, and retrieval of PDF, TXT, and DOCX files.
- 🧠 **Document Processing**: Extracts text from documents, splits it into chunks, generates embeddings, and performs similarity search for context retrieval.
- 💬 **AI Integration**: Communicates with pluggable LLM providers (Google Gemini, OpenAI) to generate responses based on document content and chat history.
- 🚀 **Streaming Responses**: Delivers AI responses in real-time using Server-Sent Events (SSE).
- 📊 **Chat Session Management**: Stores and manages conversation history, allowing users to view, select, and delete past chat sessions.
- 💾 **Database Integration**: Utilizes PostgreSQL with Prisma ORM for robust data persistence.
- 🛡️ **Error Handling**: Robust error handling for file processing and AI interactions.

## Tech Stack

- **Runtime**: Node.js (with Bun for development/scripts)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **LLM Providers**: 
    - Google Gemini API (default)
    - OpenAI API
- **File Processing**: 
    - `pdf-parse` for PDF extraction
    - `mammoth` for DOCX extraction
    - LangChain (for `RecursiveCharacterTextSplitter`)
- **File Uploads**: Multer
- **Environment Management**: `dotenv`

## Prerequisites

- Node.js 18+ or Bun (recommended)
- PostgreSQL database
- API key for your chosen LLM provider (Google Gemini or OpenAI)

## Setup Instructions

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    bun install # or npm install or yarn install
    ```

3.  **Configure Environment Variables:**
    Copy the example environment file and update it with your database URL and LLM API key.
    ```bash
    cp env.example .env
    ```
    Edit the `.env` file:
    ```env
    # Database
    DATABASE_URL="postgresql://username:password@localhost:5432/chat_with_notes"

    # LLM Configuration (Choose one)
    GEMINI_API_KEY="your_google_gemini_api_key_here"
    OPENAI_API_KEY="your_openai_api_key_here"
    LLM_PROVIDER="gemini" # or "openai" - set your preferred LLM here

    # Server Configuration
    PORT=3001
    NODE_ENV=development

    # File Upload
    MAX_FILE_SIZE=10485760  # 10MB in bytes
    UPLOAD_DIR="./uploads"
    ```

4.  **Generate Prisma client:**
    ```bash
    bun run db:generate # or npm run db:generate
    ```

5.  **Run database migrations:**
    ```bash
    bun run db:migrate # or npm run db:migrate
    ```

6.  **Start the development server:**
    ```bash
    bun run dev # or npm run dev
    ```

## API Endpoints

### File Management
-   `POST /api/upload`: Uploads and processes a file.
-   `GET /api/files`: Retrieves a list of all uploaded files.
-   `DELETE /api/files/:fileId`: Deletes a specific file.

### Chat and Session Management
-   `GET /api/ask`: Initiates a streaming chat session with the AI (for a question about selected documents).
-   `GET /api/history/:chatSessionId`: Retrieves the conversation history for a specific chat session.
-   `GET /api/sessions`: Retrieves a list of all chat sessions.
-   `DELETE /api/sessions/:chatSessionId`: Deletes a specific chat session and all its associated messages.

## Development Scripts

-   `bun run dev`: Starts the development server with hot reload.
-   `bun run build`: Builds the application for production.
-   `bun run start`: Starts the production server.
-   `bun run db:generate`: Generates the Prisma client.
-   `bun run db:push`: Pushes the Prisma schema to the database (useful for quick prototyping).
-   `bun run db:migrate`: Runs database migrations.
-   `bun run db:studio`: Opens Prisma Studio for database inspection.
