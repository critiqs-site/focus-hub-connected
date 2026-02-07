
# Fix Physique Rater - Use Correct API Key and Gateway

## Problem

The physique-rater edge function is using `POLLINATIONS_API_KEY` with the Pollinations API endpoint. This is causing server errors. The user wants it to use the same setup as the therapist AI chat: the `LOVABLE_API_KEY` with the Lovable AI gateway.

## Solution

Update `supabase/functions/physique-rater/index.ts` to:

1. **Use `LOVABLE_API_KEY`** instead of `POLLINATIONS_API_KEY`
2. **Use the Lovable AI gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) instead of Pollinations
3. **Use model `openai-large`** as primary, with a **fallback to `openai-fast`** if the first call fails
4. Keep everything else the same (image URL upload flow, error handling, response parsing)

## Files

| File | Action |
|------|--------|
| `supabase/functions/physique-rater/index.ts` | Update API key, endpoint, model, add fallback |

## Technical Details

Key changes in the edge function:

- Replace `Deno.env.get("POLLINATIONS_API_KEY")` with `Deno.env.get("LOVABLE_API_KEY")`
- Replace `https://gen.pollinations.ai/v1/chat/completions` with `https://ai.gateway.lovable.dev/v1/chat/completions`
- Set model to `openai-large` for the primary attempt
- If the primary call fails (non-200 response or parse error), retry with model `openai-fast` as fallback
- The vision message format stays the same (OpenAI-compatible `image_url` content block)

```
Primary call: openai-large model
  |
  |-- Success --> parse & return
  |-- Fail --> Retry with openai-fast
                  |
                  |-- Success --> parse & return
                  |-- Fail --> return server error
```
