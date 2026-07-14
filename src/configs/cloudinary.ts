import { v2 as cloudinary } from 'cloudinary';

import { config } from './envImplement.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export type CloudinaryIncidentUpload = {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
};

export function uploadIncidentImage(buffer: Buffer): Promise<CloudinaryIncidentUpload> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'roadpulse-ghana/incidents',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary did not return an upload result'));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id, bytes: result.bytes, format: result.format });
      },
    );
    stream.end(buffer);
  });
}

export function deleteIncidentImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
