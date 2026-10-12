import { google } from "googleapis";
import { Readable } from "node:stream";

type UploadToDriveInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

const normalizePrivateKey = (privateKey: string) => {
  return privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
};

const hasOAuthUploadConfig = () => {
  return Boolean(
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  );
};

const hasServiceAccountUploadConfig = () => {
  return Boolean(
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
};

export const isGoogleDriveUploadConfigured = () => {
  return hasOAuthUploadConfig() || hasServiceAccountUploadConfig();
};

const getGoogleDriveAuth = () => {
  if (hasOAuthUploadConfig()) {
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    return oauth;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive não configurado");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: normalizePrivateKey(privateKey),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
};

export const uploadToGoogleDrive = async ({ buffer, filename, mimeType }: UploadToDriveInput) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId || !isGoogleDriveUploadConfigured()) {
    throw new Error("Google Drive não configurado");
  }

  const drive = google.drive({ version: "v3", auth: getGoogleDriveAuth() });

  const createdFile = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id,name,webViewLink,webContentLink",
    supportsAllDrives: true,
  });

  const fileId = createdFile.data.id;
  if (!fileId) {
    throw new Error("Google Drive não retornou o ID do arquivo");
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
    supportsAllDrives: true,
  });

  return {
    fileId,
    webViewLink: createdFile.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    publicUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
  };
};
