import html2canvas from "html2canvas";

/**
 * Downloads a DOM element as an image.
 * @param {React.RefObject} ref - React ref pointing to the element to capture.
 * @param {string} filename - Output filename without extension.
 * @param {"jpeg"|"png"} format - Image format.
 */
export async function downloadVoucherImage(ref, filename = "voucher", format = "png") {
  if (!ref?.current) return;

  try {
    const canvas = await html2canvas(ref.current, {
      scale: 3, // High-res output
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const ext = format === "jpeg" ? "jpg" : "png";
    const dataURL = canvas.toDataURL(mimeType, 0.95);

    const link = document.createElement("a");
    link.download = `${filename}.${ext}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to download voucher image:", err);
    alert("Could not download the voucher image. Please try again.");
  }
}
