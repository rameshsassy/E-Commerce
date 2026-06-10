/**
 * Compress and convert any image file to JPEG <= 100KB.
 * Iteratively reduces quality and dimensions if needed.
 * Returns the optimized File object.
 */
export async function compressAndStandardizeImage(file, targetSizeKB = 100) {
  const maxBytes = targetSizeKB * 1024;
  
  if (!file || !file.type.startsWith('image/')) {
    throw new Error("Only image files can be optimized.");
  }

  // Create an Image from the file
  const image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image could not be optimized. Please upload a different image."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Image could not be optimized. Please upload a different image."));
    reader.readAsDataURL(file);
  });

  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;
  
  // Resize if too large (e.g. limit max dimension to 1200px to maintain quality and keep compression fast)
  const maxDim = 1200;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  let quality = 0.90;
  let compressedBlob = null;
  let currentWidth = width;
  let currentHeight = height;

  // We iterate, reducing quality first, then scaling dimensions if necessary
  for (let attempt = 0; attempt < 30; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Image could not be optimized. Please upload a different image.");
    }
    
    // Draw white background (in case of transparent PNG/WEBP)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(image, 0, 0, currentWidth, currentHeight);

    compressedBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });

    if (!compressedBlob) {
      throw new Error("Image could not be optimized. Please upload a different image.");
    }

    if (compressedBlob.size <= maxBytes) {
      break;
    }

    // Iteration adjustment rules
    if (quality > 0.15) {
      quality -= 0.08;
    } else if (currentWidth > 150) {
      // Scale down dimensions if quality is already very low
      currentWidth = Math.max(150, Math.floor(currentWidth * 0.7));
      currentHeight = Math.max(150, Math.floor(currentHeight * 0.7));
      quality = 0.75; // reset quality to retry scaling
    } else {
      break;
    }
  }

  // Final fallback to absolute minimums if still larger than target
  if (compressedBlob && compressedBlob.size > maxBytes) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(currentWidth, 100);
    canvas.height = Math.min(currentHeight, 100);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      compressedBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.05);
      });
    }
  }

  if (!compressedBlob) {
    throw new Error("Image could not be optimized. Please upload a different image.");
  }

  // Check if size is within limits, otherwise fail
  if (compressedBlob.size > maxBytes) {
    throw new Error("Image could not be optimized. Please upload a different image.");
  }

  const newName = file.name ? file.name.replace(/\.[^/.]+$/, ".jpg") : "image.jpg";
  return new File([compressedBlob], newName, { type: "image/jpeg", lastModified: Date.now() });
}
