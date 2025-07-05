# Chat with Your Notes

A full-stack AI-powered application that allows you to upload documents and chat with them using Gemini AI. Built with React, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- 📄 **File Upload**: Support for PDF, TXT, and DOCX files
- 🤖 **AI Chat**: Ask questions about your documents using Gemini AI
- 🔍 **Vector Search**: Intelligent document retrieval using embeddings
- 🔄 **Multi-File Chat**: Engage with multiple documents simultaneously in a single conversation.
- 💬 **Chat Session Management**: View, select, and delete past chat sessions, with automatic file selection.
- 🎨 **Intuitive UI**: Clearly distinguished user/AI messages, expandable context accordions, and 'Thinking...' indicator during AI processing.
- 🧭 **Sidebar Navigation**: Easily switch between viewing uploaded files and chat history.
- 💾 **Database**: PostgreSQL with Prisma ORM
- 📱 **TypeScript**: Full type safety across the stack

## Tech Stack

### Backend
- **Runtime**: Node.js with Bun
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini API for embeddings and text generation
- **File Processing**: LangChain for text chunking
- **File Upload**: Multer for handling file uploads

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Google Gemini API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chat-with-your-notes
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
bun install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# - DATABASE_URL: Your PostgreSQL connection string
# - GEMINI_API_KEY: Your Google Gemini API key
# - PORT: Server port (default: 3001)

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chat_with_notes"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="./uploads"
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## API Endpoints

### File Management
- `POST /api/upload` - Upload and process a file
- `GET /api/files` - Get all uploaded files
- `DELETE /api/files/:fileId` - Delete a file

### Chat
- `POST /api/ask` - Ask a question about documents
- `GET /api/history/:chatSessionId` - Get conversation history for a specific session
- `GET /api/sessions` - Get all chat sessions
- `DELETE /api/sessions/:chatSessionId` - Delete a specific chat session and its messages

## Usage

1.  **Upload Documents**: Use the "Upload Document" button to add PDF, TXT, or DOCX files.
2.  **Select Files**: Go to the "Files" view in the sidebar to choose which documents to chat about. You can select multiple files for a single conversation.
3.  **Navigate Sessions**: Use the "Files" and "History" buttons in the sidebar to switch between your document list and past chat sessions. Selecting a chat session from the "History" view will automatically load its chat history and select the files that were part of that conversation.
4.  **Start a New Chat**: Click the "New Chat" button in the "History" view to clear the current session and start a fresh conversation.
5.  **Ask Questions**: Type your questions in the chat interface.
6.  **View Context**: Click on the "Context Chunk" accordions within AI responses to expand and see the relevant document chunks used to generate the answer.
7.  **Delete Sessions**: In the "History" view, click the trash icon next to a chat session to delete it along with all its messages.

## Development

### Backend Scripts
```bash
bun run dev          # Start development server with hot reload
bun run build        # Build for production
bun run start        # Start production server
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run database migrations
bun run db:studio    # Open Prisma Studio
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Project Structure

```
chat-with-your-notes/
├── server/                 # Backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Server entry point
│   ├── prisma/            # Database schema and migrations
│   └── uploads/           # Uploaded files storage
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ChatSessionList.tsx # Component for listing and managing chat sessions
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 