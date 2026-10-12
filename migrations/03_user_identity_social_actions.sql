-- Add stable Google/NextAuth identity fields for social interactions.
-- Run this in the Supabase SQL Editor before deploying the matching app code.

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE public.likes
  ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Keep old rows usable until every record is created with the Google sub.
UPDATE public.photos
SET user_id = COALESCE(user_id, guest_email)
WHERE user_id IS NULL;

UPDATE public.comments
SET user_id = COALESCE(user_id, guest_email)
WHERE user_id IS NULL;

UPDATE public.likes
SET user_id = COALESCE(user_id, guest_email)
WHERE user_id IS NULL;

UPDATE public.messages
SET user_id = COALESCE(user_id, guest_email)
WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS photos_user_id_idx ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS likes_photo_user_id_unique
ON public.likes(photo_id, user_id)
WHERE user_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
