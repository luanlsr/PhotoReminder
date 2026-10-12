-- ATENÇÃO: este reset é destrutivo.
-- Use apenas quando quiser remover da galeria todos os registros antigos
-- e começar do zero com arquivos novos salvos no Google Drive.
--
-- O app continuará usando o Supabase como banco de metadados:
-- photos.url, photos.drive_file_id e photos.drive_view_link.
-- O que deixa de ser usado é o Supabase Storage para fotos/vídeos.

begin;

delete from public.comments;
delete from public.likes;
delete from public.photos;

-- Remove metadados dos arquivos antigos do bucket de storage.
-- Se preferir manter os arquivos antigos armazenados no Supabase, não execute esta linha.
delete from storage.objects
where bucket_id = 'wedding-photos';

commit;
