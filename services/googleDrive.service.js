import { google } from "googleapis";
import fs from "fs";
import path from "path";

let driveClient = null;

/**
 * Check if the required Google Drive environment variables are set.
 */
export function isGoogleDriveConfigured() {
  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID;
  return Boolean(email && key && folder);
}

/**
 * Initializes and returns a Google Drive API client.
 */
export function getDriveClient() {
  if (driveClient) return driveClient;

  if (!isGoogleDriveConfigured()) {
    return null;
  }

  try {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"]
    );

    driveClient = google.drive({ version: "v3", auth });
    return driveClient;
  } catch (error) {
    console.error("[gdrive] Failed to initialize Google Drive client:", error.message);
    return null;
  }
}

/**
 * Uploads a local file to Google Drive and shares it publicly.
 * Deletes the local file afterwards to free server space.
 * 
 * @param {string} filePath - Absolute path to local file on disk
 * @param {string} mimeType - File MIME type (e.g. image/jpeg)
 * @param {string} originalName - Name of file on Google Drive
 * @returns {Promise<{fileId: string, url: string} | null>}
 */
export async function uploadFileToDrive(filePath, mimeType, originalName) {
  const drive = getDriveClient();
  if (!drive) {
    console.warn("[gdrive] Google Drive not initialized, skipping upload for:", filePath);
    return null;
  }

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file does not exist: ${filePath}`);
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const fileMetadata = {
      name: originalName || path.basename(filePath),
      parents: folderId ? [folderId] : [],
    };

    const media = {
      mimeType: mimeType || "image/jpeg",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error("Failed to retrieve file ID after upload");
    }

    // Share public permissions: anyone can read
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Clean up local file immediately to free server storage
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkErr) {
      console.warn("[gdrive] Could not delete temporary file from server:", filePath, unlinkErr.message);
    }

    return {
      fileId,
      url: `https://lh3.googleusercontent.com/d/${fileId}`,
    };
  } catch (error) {
    console.error("[gdrive] Upload error for", filePath, ":", error.message);
    return null;
  }
}
