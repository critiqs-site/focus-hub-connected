-- Fix physique-uploads storage policies

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public read access for physique uploads" ON storage.objects;

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can upload physique images" ON storage.objects;

-- Create owner-scoped SELECT policy
CREATE POLICY "Users can view own physique uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'physique-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create owner-scoped INSERT policy
CREATE POLICY "Users can upload to own physique folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'physique-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create owner-scoped UPDATE policy
CREATE POLICY "Users can update own physique uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'physique-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);