import { isGoogleDriveConfigured, uploadFileToDrive } from "../services/googleDrive.service.js";
import fs from "fs";

/**
 * Middleware to upload product images and variant images to Google Drive.
 * Replaces the local file path with the Google Drive direct URL in req.files.
 */
export async function uploadProductImagesToGoogleDrive(req, res, next) {
  try {
    if (!isGoogleDriveConfigured()) {
      console.warn("[gdrive] Google Drive credentials not set. Falling back to local storage.");
      return next();
    }

    const images = req.files?.images || [];
    const variantImages = req.files?.variantImages || [];

    // Upload main product images
    for (const file of images) {
      if (file.path && fs.existsSync(file.path)) {
        const uploadResult = await uploadFileToDrive(file.path, file.mimetype, file.filename);
        if (uploadResult) {
          file.path = uploadResult.url;
        }
      }
    }

    // Upload variant images
    for (const file of variantImages) {
      if (file.path && fs.existsSync(file.path)) {
        const uploadResult = await uploadFileToDrive(file.path, file.mimetype, file.filename);
        if (uploadResult) {
          file.path = uploadResult.url;
        }
      }
    }

    next();
  } catch (error) {
    console.error("[gdrive] Error in Google Drive upload middleware. Falling back to local:", error);
    next();
  }
}
