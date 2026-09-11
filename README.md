# Experiential Labs Workspace

A single, premium dashboard for every model on your Experiential Labs API key. Pick any model the API returns, chat, drop in a file, switch models mid-conversation, and keep going — no code changes, ever.

## What this is

- **Next.js 14** app router project — one process serves both the UI and a small secure backend.
- The backend (`app/api/*`) is the **only** place your API key is used. It reads `EXPERIENTIAL_LABS_API_KEY` from the server environment and proxies requests to `https://api.experientiallabs.ai/v1`. The key is never sent to, or readable from, the browser.
- `/api/models` fetches your live model list on every page load and normalizes whatever metadata the API includes — it never hardcodes model names or guesses capabilities from a model's name.
- `/api/chat` streams responses straight through from the API using server-sent events.
- `/api/files/parse` extracts text from uploaded PDFs server-side (everything else — code, text, images — is handled entirely in the browser).
- Conversations are stored in your browser's `localStorage`, so they persist across reloads on this device but aren't synced anywhere.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste in your real key:
#   EXPERIENTIAL_LABS_API_KEY=sk-...
npm run dev
```

Open http://localhost:3000.

For production:

```bash
npm run build
npm run start
```

## Using it

1. The model selector (top-left) loads your available models automatically. Click it, search, and pick one.
2. Type a message or drag a file into the composer — code, text, JSON, Markdown, images, PDFs, or PowerPoint files.
3. Send. The response streams in with Markdown rendering and syntax-highlighted code.
4. Switch models any time from the same selector — the conversation continues with the new model.
5. If a model rewrites a file you uploaded, ask it to keep referencing the file by name; when it does, a **Compare to original** toggle appears on that code block so you can see exactly what changed.
6. Everything else — Copy, Regenerate, Clear conversation, new chats in the sidebar — works the way you'd expect.

## How file handling works

| File type | Handling |
|---|---|
| Code, text, JSON, Markdown, YAML, etc. | Read directly in the browser and inlined into your message as a labeled code block, so the model sees the full file content. |
| Images (png/jpg/gif/webp/svg) | Sent as base64 image data. Works with any model the API reports (or that turns out) to support vision — if a model can't handle images, the API's error is surfaced clearly in the chat rather than failing silently. |
| PDFs | Text is extracted server-side and sent the same way as a text file. Scanned/image-only PDFs may not extract cleanly — you'll get a clear error if that happens. |
| PowerPoint (`.pptx`, `.pptm`) | Slide text is extracted in the browser and sent with slide boundaries. Older binary `.ppt` files must be saved as `.pptx` first. |
| Anything else | Rejected with an inline message rather than silently failing. |

A ~15MB per-file size cap and a ~120K character cap on extracted text keep any single upload from blowing out a model's context window; you'll see a "truncated" note on the file chip if a file was cut down.

## Error handling

Invalid/missing API key, unavailable or renamed models, rate limits, insufficient credits, unsupported file types, and models that reject a request (e.g. no vision support) all surface as specific, readable messages in the UI rather than generic failures — see `lib/api-errors.ts`.

## Project layout

```
app/
  api/models/route.ts      # GET  – fetch + normalize the live model list
  api/chat/route.ts        # POST – stream a chat completion
  api/files/parse/route.ts # POST – server-side PDF text extraction
  layout.tsx, page.tsx, globals.css
components/                # UI: Sidebar, ModelSelector, Composer, MessageBubble, CodeBlock, DiffBlock, ...
hooks/                     # useModels, useConversations, useChatStream
lib/                       # types, model normalization, error classification, storage, prompt
```

## Notes

- This is a personal/local tool by design (no auth, no multi-user database). If you want to deploy it somewhere shared, put it behind your own auth layer and consider swapping `localStorage` conversation storage for a real database.
- The diff view only appears when a model labels its rewritten code block with the original filename (the system prompt asks every model to do this). Most well-behaved models follow it; if one doesn't, you still get a normal syntax-highlighted code block.
