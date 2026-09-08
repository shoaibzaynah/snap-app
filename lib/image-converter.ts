// lib/image-converter.ts
// Fast client-side HTML5 Canvas WebP image conversion and compression

export interface WebPConversionResult {
  file: File;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  previewUrl: string;
}

/**
 * Automatically converts any uploaded image (JPEG, PNG, HEIC, GIF) to WebP format.
 * Scales down large photos (>1920px) to crisp HD for fast upload and immediate viewer loading.
 */
export async function convertImageToWebP(
  file: File,
  quality = 0.85,
  maxDimension = 1920
): Promise<WebPConversionResult> {
  // If already a small WebP file (< 500KB), return directly
  if (file.type === "image/webp" && file.size < 500 * 1024) {
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

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Proportional downscale if exceeding maxDimension (e.g. 12MP-48MP camera photos)
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
          // Fallback if context unavailable
          resolve({
            file,
            originalSize: file.size,
            newSize: file.size,
            savedPercent: 0,
            previewUrl: URL.createObjectURL(file),
          });
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
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

            // Generate clean WebP filename
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
          },
          "image/webp",
          quality
        );
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
