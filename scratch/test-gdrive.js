/**
 * Test Google Drive Integration
 * Run with: node scratch/test-gdrive.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { isGoogleDriveConfigured, getDriveClient, uploadFileToDrive } from "../services/googleDrive.service.js";

async function testGDrive() {
  console.log("=== Testing Google Drive Integration ===");

  if (!isGoogleDriveConfigured()) {
    console.error("❌ Google Drive environment variables are NOT configured in your .env file!");
    console.log("Please set the following keys:");
    console.log(" - GOOGLE_DRIVE_CLIENT_EMAIL");
    console.log(" - GOOGLE_DRIVE_PRIVATE_KEY");
    console.log(" - GOOGLE_DRIVE_FOLDER_ID");
    process.exit(1);
  }

  console.log("✓ Found Google Drive environment variables.");
  console.log("- Client Email:", process.env.GOOGLE_DRIVE_CLIENT_EMAIL);
  console.log("- Folder ID:", process.env.GOOGLE_DRIVE_FOLDER_ID);

  console.log("\n1. Initializing Drive Client...");
  const drive = getDriveClient();
  if (!drive) {
    console.error("❌ Failed to initialize Google Drive client auth JWT.");
    process.exit(1);
  }
  console.log("✓ JWT Auth initialization successful.");

  console.log("\n2. Creating a temporary test file...");
  const testFilePath = path.join(process.cwd(), "scratch", "gdrive-test-temp.txt");
  fs.writeFileSync(testFilePath, `Google Drive integration test run at ${new Date().toISOString()}`);
  console.log(`✓ Temporary file created at: ${testFilePath}`);

  console.log("\n3. Uploading temporary file to Google Drive...");
  try {
    const result = await uploadFileToDrive(testFilePath, "text/plain", "aashansh-gdrive-test.txt");
    if (!result) {
      console.error("❌ Upload failed (returned null). Please verify permissions/keys.");
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      process.exit(1);
    }

    console.log("✓ Upload and sharing successful!");
    console.log("- File ID on Drive:", result.fileId);
    console.log("- Direct Access URL:", result.url);
    console.log("✓ Local file has been automatically deleted from the server.");
    console.log("\n🚀 Google Drive integration is fully operational!");
  } catch (error) {
    console.error("❌ An error occurred during verification:", error);
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testGDrive();
