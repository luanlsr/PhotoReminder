# PhotoReminder

Álbum mobile para convidados compartilharem fotos e vídeos do casamento da Laís e do Luan.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Uploads no Google Drive

O app envia fotos e vídeos para uma pasta do Google Drive e salva no Supabase apenas o link e os metadados do arquivo.

Pasta criada para o casamento:

- Nome: `PhotoReminder - Casamento Laís e Luan`
- URL: [Google Drive](https://drive.google.com/drive/folders/19M0GI9bvSrm5WojotE78Jsv7TelCVfUr)
- ID para usar nas variáveis: `19M0GI9bvSrm5WojotE78Jsv7TelCVfUr`

### Configuração necessária para Drive pessoal

Conta de serviço não tem cota própria no `Meu Drive`. Para Gmail/Drive pessoal, use OAuth com refresh token da conta dona da pasta.

1. No Google Cloud, abra o mesmo projeto usado no OAuth do login.
2. Ative a API `Google Drive API`.
3. Gere um refresh token para sua conta Google com o escopo `https://www.googleapis.com/auth/drive.file`.
4. Configure estas variáveis no Vercel e no `.env` local:

```bash
GOOGLE_DRIVE_FOLDER_ID="19M0GI9bvSrm5WojotE78Jsv7TelCVfUr"
GOOGLE_CLIENT_ID="seu-oauth-client-id"
GOOGLE_CLIENT_SECRET="seu-oauth-client-secret"
GOOGLE_DRIVE_REFRESH_TOKEN="refresh-token-da-conta-dona-do-drive"
```

Enquanto essas variáveis não estiverem configuradas, o upload fica bloqueado. A partir desta versão, fotos e vídeos não são mais salvos no Supabase Storage.

Service Account só deve ser usada se a pasta estiver em um Shared Drive do Google Workspace. Nesse caso, também são aceitas as variáveis `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_PRIVATE_KEY`.

## Supabase

Execute as migrations da pasta `migrations/` no SQL Editor do Supabase. Para o Google Drive, execute especialmente:

- `migrations/04_google_drive_file_metadata.sql`

Ela adiciona os campos opcionais `drive_file_id` e `drive_view_link` na tabela `photos`.

Para começar a galeria do zero usando apenas Google Drive para arquivos novos, execute com cuidado:

- `migrations/05_reset_media_for_drive_only.sql`

Esse script apaga os registros antigos de `photos`, `likes` e `comments`, além dos objetos antigos do bucket `wedding-photos`.
