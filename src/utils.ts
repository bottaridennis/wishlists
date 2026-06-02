/**
 * Compresses an image file to a Base64 JPEG string with limited dimensions.
 * Max bounding box 400px, quality 0.7, typically results in a ~20-50KB string.
 */
export function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export to high/medium quality JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Formats a raw price into currency.
 */
export function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined || price === '') return '';
  const parsed = typeof price === 'number' ? price : parseFloat(price);
  if (isNaN(parsed)) return String(price); // Return as string if it's text like "Gratis" or non-numeric
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(parsed);
}

/**
 * Ensures a links has standard protocols before opening to prevent relative routing.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
