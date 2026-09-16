// lib/image-converter.ts
// Fast client-side HTML5 Canvas WebP image conversion and compression (target: 50-100KB)

export interface WebPConversionResult {
  file: File;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  previewUrl: string;
}

const TARGET_MAX_BYTES = 100 * 1024; // 100 KB max limit

export async function convertImageToWebP(
  file: File,
  initialQuality = 0.72,
  maxDimension = 1080
): Promise<WebPConversionResult> {
  // If already WebP and within 100KB limit, return directly
  if (file.type === "image/webp" && file.size <= TARGET_MAX_BYTES) {
    return {
      file,
      originalSize: file.size,
      newSize: file.size,
      savedPercent: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new window.Image();

      img.onload = async () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Proportional scale down if exceeding maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve({
            file,
            originalSize: file.size,
            newSize: file.size,
            savedPercent: 0,
            previewUrl: URL.createObjectURL(file),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const getBlob = (q: number): Promise<Blob | null> =>
          new Promise((r) => canvas.toBlob(r, "image/webp", q));

        // Pass 1: WebP at initial quality
        let blob = await getBlob(initialQuality);

        // Pass 2: If still > 100KB, reduce quality to 0.55
        if (blob && blob.size > TARGET_MAX_BYTES) {
          blob = await getBlob(0.55);
        }

        // Pass 3: If still > 100KB, scale canvas down to fit within 50-100KB
        if (blob && blob.size > TARGET_MAX_BYTES) {
          const sCanvas = document.createElement("canvas");
          sCanvas.width = Math.round(width * 0.75);
          sCanvas.height = Math.round(height * 0.75);
          const sCtx = sCanvas.getContext("2d");
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);
            const sBlob = await new Promise<Blob | null>((r) =>
              sCanvas.toBlob(r, "image/webp", 0.5)
            );
            if (sBlob) blob = sBlob;
          }
        }

        if (!blob) {
          resolve({
            file,
            originalSize: file.size,
            newSize: file.size,
            savedPercent: 0,
            previewUrl: URL.createObjectURL(file),
          });
          return;
        }

        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
        const webpFile = new File([blob], `${baseName}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        });

        const savedPercent = Math.max(
          0,
          Math.round(((file.size - webpFile.size) / file.size) * 100)
        );

        resolve({
          file: webpFile,
          originalSize: file.size,
          newSize: webpFile.size,
          savedPercent,
          previewUrl: URL.createObjectURL(blob),
        });
      };

      img.onerror = () => {
        resolve({
          file,
          originalSize: file.size,
          newSize: file.size,
          savedPercent: 0,
          previewUrl: URL.createObjectURL(file),
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize: file.size,
        newSize: file.size,
        savedPercent: 0,
        previewUrl: URL.createObjectURL(file),
      });
    };

    reader.readAsDataURL(file);
  });
}
