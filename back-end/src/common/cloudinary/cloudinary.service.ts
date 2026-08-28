import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload a file buffer to Cloudinary.
   * @param buffer  Raw file bytes (from Multer memoryStorage)
   * @param folder  Target Cloudinary folder (e.g. 'tatku-united/services')
   * @returns       { url, public_id }
   */
  uploadBuffer(
    buffer: Buffer,
    folder = 'tatku-united/services',
  ): Promise<{ url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve({ url: result.secure_url, public_id: result.public_id });
        },
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete an asset from Cloudinary by its public_id.
   */
  async deleteByPublicId(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
