export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
  console.warn('Cloudinary configuration missing. Media uploads will fail.');
}
