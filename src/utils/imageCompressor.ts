/**
 * Utility to compress images using the native HTML Canvas API.
 * Converts images to WebP format for optimal web performance.
 */
export const compressImageToWebP = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Calculate the new dimensions while preserving aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        // Create canvas and draw the resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context not available'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress and convert to WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File object with the original name but .webp extension
              const originalName = file.name.split('.')[0];
              const compressedFile = new File([blob], `${originalName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas toBlob conversion returned null'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
};
