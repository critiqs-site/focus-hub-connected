

# Fix Physique Rater - Use Base64 Image Instead of URL

## Problem

The Pollinations API cannot access the image URLs from Supabase storage. The error is:
`"The provided image url can not be accessed. status code: 429"`

The AI model needs to receive the image data directly rather than fetching it from a URL.

## Solution

Send the image as a **base64 data URL** directly to the edge function, bypassing Supabase storage entirely. The OpenAI vision format supports `data:image/jpeg;base64,...` URLs natively.

## Changes

### 1. `src/components/PhysiqueRater.tsx`
- Remove the Supabase storage upload step entirely
- Read the file as a base64 data URL using `FileReader`
- Send the base64 string directly to the edge function in the request body
- Remove the `uploadToSupabase` function
- Simplify the flow: select file -> read as base64 -> send to edge function

### 2. `supabase/functions/physique-rater/index.ts`
- Accept `imageBase64` (a data URL string like `data:image/jpeg;base64,...`) instead of `imageUrl`
- Pass it directly to the Pollinations API as the `image_url` value (OpenAI vision format supports data URLs)
- No other changes needed to the AI call logic or response parsing

## Flow

```text
Before (broken):
  File -> Upload to Supabase Storage -> Get public URL -> Send URL to Pollinations -> Pollinations fails to fetch URL

After (fix):
  File -> Read as base64 data URL -> Send base64 to edge function -> Pass to Pollinations directly -> Works
```

## Technical Details

- The OpenAI-compatible vision API accepts both HTTP URLs and base64 data URLs in the `image_url.url` field
- Max file size remains 5MB (enforced client-side)
- The Supabase storage bucket (`physique-uploads`) is no longer needed for this feature but can remain for future use
