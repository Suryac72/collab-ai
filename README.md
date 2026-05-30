# ⟁ CollabAI — Real-time Collaborative Document Editor

A production-ready, real-time collaborative document editor with AI text rewriting powered by **Groq** (free tier), **NestJS**, **Socket.io**, and **React + Vite**.

---

## ✨ Features

- **Real-time collaboration** — multiple users edit the same document simultaneously
- **AI text rewriting** — highlight any text → click "Rewrite with AI" → Groq rewrites it professionally and broadcasts the result to all users instantly
- **Live user presence** — colored avatars, join/leave notifications
- **Rewrite diff panel** — see before/after comparison for every AI edit
- **Optimistic UI** — processing state shown to all connected clients
- **Conflict detection** — gracefully handles concurrent edits
- **Free-tier first** — Groq's free plan: 14,400 req/day, 500K tokens/day

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     React + Vite (5173)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useCollabEditor hook (socket.io-client)             │  │
│  │  CollaborativeEditor component                       │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────│──────────────────────────────────┘
                          │  WebSocket /editor namespace
┌─────────────────────────▼──────────────────────────────────┐
│                  NestJS Server (3001)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DocumentGateway (Socket.io)                         │  │
│  │   ├── document:join      → send doc state to client  │  │
│  │   ├── document:update    → broadcast to room         │  │
│  │   ├── ai:rewrite         → call GroqService          │  │
│  │   └── cursor:move        → broadcast to room         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  GroqService                                         │  │
│  │   └── rewriteProfessional(text) → Groq API (HTTPS)  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  DocumentService (in-memory Map)                     │  │
│  │   ├── getDocument(id)                                │  │
│  │   ├── updateDocument(id, content, user)              │  │
│  │   └── replaceText(id, original, replacement, user)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTPS REST
┌─────────────────────────▼──────────────────────────────────┐
│              Groq Cloud API (FREE tier)                     │
│              Model: llama-3.3-70b-versatile                 │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 AI Rewrite Data Flow

```
User selects text → clicks "Rewrite with AI"
        │
        ▼
[Frontend] emit('ai:rewrite', { docId, selectedText, selectionStart, selectionEnd, userName })
        │
        ▼
[Gateway] broadcast('ai:processing') → all clients show loading indicator
        │
        ▼
[GroqService] POST https://api.groq.com/openai/v1/chat/completions
        │      model: llama-3.3-70b-versatile, temp: 0.4, max_tokens: 1024
        ▼
[DocumentService] replaceText(docId, originalText, rewrittenText)
        │
        ▼
[Gateway] broadcast('document:ai:updated') → all clients receive:
        │   - full updated document
        │   - originalText + rewrittenText (for diff panel)
        │   - who rewrote it
        ▼
[All Frontend clients] update textarea + show diff panel
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- A **free** Groq API key → https://console.groq.com

### Backend

```bash
cd collab-editor-backend

# Install deps
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your GROQ_API_KEY

# Development (with hot reload)
npm run start:dev

# Production
npm run build && npm run start
```

### Frontend

```bash
cd collab-editor-frontend

# Install deps
npm install

# Configure environment
cp .env.example .env
# VITE_BACKEND_URL=http://localhost:3001  (default)

# Development
npm run dev

# Production build
npm run build && npm run preview
```

Open **http://localhost:5173** in two browser tabs to see real-time collaboration.

---

## 📡 WebSocket Events Reference

| Direction | Event | Payload | Description |
|---|---|---|---|
| C→S | `document:join` | `{ docId, userName }` | Join a document room |
| S→C | `document:init` | `{ document, color }` | Full doc state on join |
| C→S | `document:update` | `{ docId, content, userName }` | Text edit |
| S→C | `document:updated` | `{ document, updatedBy }` | Broadcast edit to room |
| C→S | `ai:rewrite` | `{ docId, selectedText, selectionStart, selectionEnd, userName }` | **Request AI rewrite** |
| S→C | `ai:processing` | `{ userName, originalText }` | All clients show loader |
| S→C | `document:ai:updated` | `{ document, originalText, rewrittenText, rewrittenBy }` | **AI result broadcast** |
| S→C | `ai:error` | `{ message }` | Error to requesting client |
| C→S | `cursor:move` | `{ docId, userName, position, color }` | Cursor position update |
| S→C | `users:list` | `{ users[] }` | Active users in room |

---

## 💰 Cost Analysis (Free Resources)

| Resource | Free Tier | Usage Here |
|---|---|---|
| **Groq API** | 14,400 req/day, 500K tokens/day | ~1 req per rewrite, ~200 tokens avg |
| **NestJS** | Open source | ✓ |
| **Socket.io** | Open source | ✓ |
| **React + Vite** | Open source | ✓ |
| **Model** | `llama-3.3-70b-versatile` | Free on Groq |

**Estimated cost for 100 AI rewrites/day: $0.00** (well within free tier)

---

## 🔧 Production Upgrades (Optional)

| Feature | Current | Production |
|---|---|---|
| Document store | In-memory Map | MongoDB / Redis |
| Auth | Random username | JWT / OAuth |
| Multi-doc | Single room | Dynamic room IDs |
| Persistence | None | MongoDB Atlas (free) |
| Deploy | Local | Railway / Fly.io / Render (free) |

---

## 📁 Project Structure

```
collab-editor-backend/
├── src/
│   ├── app.module.ts              # Root module
│   ├── main.ts                    # Bootstrap + CORS
│   └── document/
│       ├── document.module.ts     # Feature module
│       ├── document.gateway.ts    # ⭐ WebSocket gateway (all WS logic)
│       ├── document.service.ts    # In-memory document store
│       └── groq.service.ts        # ⭐ Groq API integration
├── .env.example
├── package.json
└── tsconfig.json

collab-editor-frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── hooks/
│   │   └── useCollabEditor.ts     # ⭐ All Socket.io client logic
│   └── components/
│       ├── CollaborativeEditor.tsx # ⭐ Main editor UI component
│       └── CollaborativeEditor.css # Dark editorial design
├── index.html
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```
