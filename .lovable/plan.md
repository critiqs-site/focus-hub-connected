

# AI Chat Overhaul: Non-Streaming, Faster Responses, and AI-Powered Todo Management

## Overview
Three major changes: (1) switch AI chat from streaming to non-streaming for faster perceived responses, (2) enable the AI to manage todos (add/delete/suggest) via interactive action buttons, and (3) make the physique rater rating stricter.

---

## 1. Switch AI Chat to Non-Streaming

**File:** `supabase/functions/ai-chat/index.ts`
- Remove `stream: true` from the Pollinations API call
- Wait for the full response, extract `choices[0].message.content`
- Return a simple JSON response `{ reply: "..." }` instead of SSE stream

**File:** `src/components/FloatingAIChat.tsx`
- Replace `streamChat` with a simple `supabase.functions.invoke("ai-chat", { body: ... })` call
- Parse `data.reply` and append as assistant message immediately
- No more SSE parsing, buffer management, or incremental rendering
- Much simpler, faster-feeling code

---

## 2. AI-Powered Todo Management (Add, Delete, Suggest)

This is the core new feature. The AI can understand user intent about their todos and respond with **action buttons** embedded in the chat.

### How it works

**Backend (`supabase/functions/ai-chat/index.ts`):**
- Enhance the system prompt to include detailed context about user's todos (with IDs, divider names)
- Instruct the AI to include special action markers in its response when the user asks to manage todos:
  - `[ACTION:DELETE:todoId:todoText]` — when user asks to delete a todo
  - `[ACTION:ADD:dividerName:todoText:iconName]` — when user asks to add a todo
  - `[ACTION:SUGGEST:dividerName:todoText:iconName]` — when AI suggests todos
  - `[ACTION:ADD_ALL]` — button to add all suggestions at once
- The AI sees the user's interests from the profile context to make personalized suggestions

**Frontend (`src/components/FloatingAIChat.tsx`):**
- Parse assistant messages for `[ACTION:...]` markers
- Replace them with styled, clickable buttons:
  - **Delete button**: Red-ish button like `Delete "Dinner for 10 Minutes"` -- on click, calls the delete handler and shows confirmation
  - **Add button**: Primary-colored button like `Add "Morning Jog"` -- on click, calls the add handler
  - **Add All button**: Adds all suggested todos at once
- After an action is performed, the button changes to a "Done" state (checkmark)
- Actions call the parent callbacks (`onDeleteTodo`, `onAddTodo`) passed from `Index.tsx`

**File: `src/pages/Index.tsx`:**
- Pass `handleAddTodo`, `handleDelete`, `handleDeleteDivider`, `dividers`, and `profile` data to `FloatingAIChat`
- Add profile interests to the context sent to the AI

### User Flow Examples

**Deleting a todo:**
1. User: "Can you see the dinner todo?"
2. AI: "Yeah I see **Dinner for 10 Minutes** in your Health section! Want me to do anything with it?"
3. User: "Can you delete it?"
4. AI: "Sure thing! [ACTION:DELETE:uuid:Dinner for 10 Minutes]"
5. User sees a button: `[Delete "Dinner for 10 Minutes"]`
6. User clicks -> confirmation -> deleted -> button shows checkmark

**Suggesting todos:**
1. User: "Can you suggest some habits for me?"
2. AI checks interests (e.g., Health & Fitness, Productivity) and current habits
3. AI: "Based on your interests, here are some habits: [ACTION:SUGGEST:Health:Cold shower 2 mins:Droplets] [ACTION:SUGGEST:Morning Routine:Journal 5 mins:BookOpen] [ACTION:SUGGEST:Growth:Practice a skill 15 mins:Target] [ACTION:ADD_ALL]"
4. User sees individual "Add" buttons for each + an "Add All" button at the bottom
5. Clicking "Add" on one adds just that habit; "Add All" adds all suggested habits

---

## 3. Enhanced Context for AI

**File:** `supabase/functions/ai-chat/index.ts`
- Include todo IDs and their divider names in the context (so AI can reference them for delete actions)
- Include user interests/profile info for personalized suggestions
- Update system prompt with action format instructions

**File:** `src/components/FloatingAIChat.tsx`
- Accept `profile` prop with interests
- Send profile/interests in the context payload

---

## Files Summary

| File | Changes |
|------|---------|
| `supabase/functions/ai-chat/index.ts` | Remove streaming, add action markers to prompt, include todo IDs in context |
| `src/components/FloatingAIChat.tsx` | Non-streaming fetch, parse action buttons, render interactive buttons, handle add/delete |
| `src/pages/Index.tsx` | Pass todo handlers and profile to FloatingAIChat |

---

## Technical Details

### Action Button Parsing

The assistant response text contains markers like:
```
[ACTION:DELETE:550e8400-e29b-41d4-a716-446655440000:Dinner for 10 Minutes]
```

The frontend splits the message on these markers and renders:
- Regular text as markdown
- Action markers as styled buttons

```text
Message flow:
  User asks "delete my dinner todo"
  -> Edge function sends to Pollinations (non-streaming)
  -> AI sees todo list with IDs, generates response with [ACTION:DELETE:id:name]
  -> Frontend receives JSON { reply: "Sure! [ACTION:DELETE:id:name]" }
  -> Parser splits into text + action components
  -> Renders: "Sure!" + [Delete "Dinner for 10 Minutes" button]
  -> User clicks -> onDeleteTodo(id) called -> button shows "Deleted"
```

### Non-Streaming Implementation

```text
Backend:
  POST to Pollinations with stream: false
  Get response.choices[0].message.content
  Return { reply: content }

Frontend:
  const { data } = await supabase.functions.invoke("ai-chat", { body: payload })
  setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
```

### Context Enhancement

The todo context sent to the AI will include:
```json
{
  "todos": [
    { "id": "uuid", "text": "Exercise 30 mins", "dividerName": "Health", "icon": "Dumbbell" }
  ],
  "dividers": [
    { "id": "uuid", "name": "Health", "icon": "Heart" }
  ],
  "interests": ["Health & Fitness", "Productivity"],
  "notes": [...]
}
```

This gives the AI enough info to reference specific todos by name and suggest appropriate new ones.

