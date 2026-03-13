export async function compressImage(file: File, maxBytes = 1024 * 1024): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.1;
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}
