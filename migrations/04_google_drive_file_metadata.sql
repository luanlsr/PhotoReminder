alter table public.photos
  add column if not exists drive_file_id text,
  add column if not exists drive_view_link text;

create index if not exists photos_drive_file_id_idx
  on public.photos (drive_file_id);
