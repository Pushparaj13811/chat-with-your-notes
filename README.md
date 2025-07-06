# Chat with Your Notes

A full-stack AI-powered application that allows you to upload documents and chat with them using Google Gemini AI. Built with React 19, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- 📄 **File Upload**: Support for PDF, TXT, and DOCX files with intelligent text extraction
- 🤖 **AI Chat**: Ask questions about your documents using Google Gemini AI
- 🔍 **Vector Search**: Intelligent document retrieval using embeddings and cosine similarity
- 🔄 **Multi-File Chat**: Engage with multiple documents simultaneously in a single conversation
- 💬 **Chat Session Management**: View, select, and delete past chat sessions with automatic file selection
- 🧠 **Conversation Memory**: Advanced memory management with automatic conversation summarization
- 🎯 **Dynamic Questions**: AI-generated contextual questions based on document content
- 🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS, clearly distinguished user/AI messages
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- 💾 **Database**: PostgreSQL with Prisma ORM for robust data management
- 🔒 **Type Safety**: Full TypeScript implementation across the stack

## Tech Stack

### Backend
- **Runtime**: Node.js with Bun (or Node.js with tsx)
- **Framework**: Express.js 5.1 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini API (gemini-1.5-flash for text, embedding-001 for embeddings)
- **File Processing**: LangChain for text chunking, Mammoth for DOCX parsing
- **File Upload**: Multer for handling file uploads
- **Memory Management**: Custom conversation summarization and optimization

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Markdown**: React Markdown with rehype-raw
- **Build Tool**: Vite
- **UI Components**: Custom components with accordion, modals, and responsive design

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
# or with npm: npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# - DATABASE_URL: Your PostgreSQL connection string
# - GEMINI_API_KEY: Your Google Gemini API key
# - PORT: Server port (default: 3001)
# - MAX_FILE_SIZE: Maximum file size in bytes (default: 10MB)
# - UPLOAD_DIR: Directory for uploaded files (default: ./uploads)

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
# or with Node.js: bun run dev:node
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
- `POST /api/upload` - Upload and process a file (PDF, TXT, DOCX)
- `GET /api/files` - Get all uploaded files with metadata
- `DELETE /api/files/:fileId` - Delete a file and all associated data
- `GET /api/files/:fileId/questions` - Get AI-generated questions for a file

### Chat & Sessions
- `POST /api/ask` - Ask a question about documents
- `GET /api/history/:chatSessionId` - Get conversation history for a session
- `GET /api/sessions` - Get all chat sessions with memory statistics
- `DELETE /api/sessions/:chatSessionId` - Delete a chat session and all messages

### Memory Management
- `POST /api/sessions/:chatSessionId/summarize` - Manually summarize a conversation
- `DELETE /api/sessions/:chatSessionId/memory` - Clear conversation memory
- `GET /api/sessions/:chatSessionId/memory-stats` - Get memory statistics

## Usage

1. **Upload Documents**: Use the "Upload Document" button to add PDF, TXT, or DOCX files. The system will automatically extract text, generate embeddings, and create contextual questions.

2. **Select Files**: Go to the "Files" view in the sidebar to choose which documents to chat about. You can select multiple files for a single conversation.

3. **Dynamic Questions**: View AI-generated questions based on your document content to get started quickly.

4. **Navigate Sessions**: Use the "Files" and "History" buttons in the sidebar to switch between your document list and past chat sessions. Selecting a chat session will automatically load its history and select the associated files.

5. **Start a New Chat**: Click the "New Chat" button in the "History" view to clear the current session and start fresh.

6. **Ask Questions**: Type your questions in the chat interface. The AI will use conversation memory and document context to provide informed responses.

7. **View Context**: Click on the "Context Chunk" accordions within AI responses to see the relevant document chunks used to generate the answer.

8. **Memory Management**: Long conversations are automatically summarized to maintain context quality. You can manually trigger summarization or clear memory as needed.

9. **Delete Sessions**: In the "History" view, click the trash icon next to a chat session to delete it along with all its messages.

## Advanced Features

### Conversation Memory
- **Automatic Summarization**: Conversations with 15+ messages are automatically summarized
- **Memory Optimization**: Intelligent context management for long conversations
- **Memory Statistics**: Track conversation efficiency and memory usage
- **Manual Control**: Manually summarize or clear conversation memory

### Document Processing
- **Intelligent Chunking**: Documents are split into optimal chunks for better retrieval
- **Embedding Generation**: Each chunk is converted to vector embeddings for semantic search
- **Question Generation**: AI automatically generates 6 contextual questions per document
- **Multi-format Support**: PDF, TXT, and DOCX files with proper text extraction

### Vector Search
- **Cosine Similarity**: Advanced similarity matching for relevant content retrieval
- **Multi-file Search**: Search across multiple documents simultaneously
- **Context-Aware Responses**: AI responses include relevant document chunks as context

## Development

### Backend Scripts
```bash
bun run dev          # Start development server with hot reload
bun run dev:node     # Start with Node.js (tsx)
bun run build        # Build for production
bun run start        # Start production server
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run database migrations
bun run db:studio    # Open Prisma Studio
bun run db:push      # Push schema changes to database
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
│   │   ├── config/        # Configuration files (database, Gemini)
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (chat, file processing)
│   │   ├── utils/         # Utility functions (memory, text processing)
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Server entry point
│   ├── prisma/            # Database schema and migrations
│   └── uploads/           # Uploaded files storage
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ChatInterface.tsx      # Main chat interface
│   │   │   ├── FileList.tsx           # File selection and management
│   │   │   ├── ChatSessionList.tsx    # Session history management
│   │   │   ├── FileUpload.tsx         # File upload component
│   │   │   ├── UploadModal.tsx        # Upload modal
│   │   │   └── Accordion.tsx          # Context display component
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
└── README.md
```

## Database Schema

### Core Models
- **File**: Document metadata, file information, and generated questions
- **Chunk**: Text chunks with embeddings for vector search
- **ChatSession**: Conversation sessions with memory management
- **ChatMessage**: Individual messages with context and summarization status

### Key Features
- **Cascade Deletion**: Proper cleanup when files or sessions are deleted
- **Memory Tracking**: Message counts and summarization status
- **Context Storage**: Document chunks used for each response
- **Question Storage**: AI-generated questions per document

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following SOLID principles
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 