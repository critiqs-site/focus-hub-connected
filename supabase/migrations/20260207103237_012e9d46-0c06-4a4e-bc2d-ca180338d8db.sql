
-- Create storage bucket for physique rater uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('physique-uploads', 'physique-uploads', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload physique images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'physique-uploads' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Public read access for physique uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'physique-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own physique uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'physique-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
