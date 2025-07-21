export async function compressImage(file, options = {}) {
  console.log("compressImage called")
  const { maxWidth = 1024, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality // JPEG 품질 (0.0 ~ 1.0)
      );
    };

    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(file);
  });
}
