import { v2 as cloudinary } from "cloudinary";
import type {
  UploadApiResponse,
  DeleteApiResponse,
  ResourceType,
  UploadApiErrorResponse,
} from "cloudinary";
import { Readable } from "stream";
import { appConfig } from "../config/env";

class CloudinaryService {

  constructor() {
    this.initialize();
  }

  private initialize() {
    cloudinary.config({
      cloud_name: appConfig.cloudinary.cloudName,
      api_key: appConfig.cloudinary.apiKey,
      api_secret: appConfig.cloudinary.apiSecret,
      secure: appConfig.server.isProduction,
    });
    
    console.log('✅ Cloudinary service initialized successfully');
  }

  public async upload(
    fileBuffer: Buffer,
    originalName: string,
    folder: string = appConfig.cloudinary.folderName
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'raw',
          public_id: originalName.split('.')[0],
          overwrite: true,
          use_filename: true,
          unique_filename: false,
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  }

  public async uploadChunk(
    chunkBuffer: Buffer,
    chunkFileName: string,
    folder: string = 'chat-notes-chunks'
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: chunkFileName,
          resource_type: 'raw',
          use_filename: true,
          unique_filename: false,
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error) return reject(error);
          if (result) return resolve(result);
          reject(new Error('Cloudinary chunk upload failed: No result returned.'));
        }
      );
      Readable.from(chunkBuffer).pipe(uploadStream);
    });
  }

  public async mergeChunks(
    chunkPublicIds: string[],
    finalFileName: string,
    folder: string = 'chat-notes'
  ): Promise<UploadApiResponse> {
    const archiveParams: any = {
      target_public_id: finalFileName,
      public_ids: chunkPublicIds,
      target_tags: ['merged', 'chat-notes'],
      resource_type: 'raw',
      target_format: 'pdf',
      type: 'upload',
      folder: folder,
    };

    return cloudinary.uploader.create_archive(archiveParams as any);
  }

  public async delete(publicId: string, resourceType: ResourceType = 'image'): Promise<DeleteApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error: UploadApiErrorResponse | undefined, result?: DeleteApiResponse) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );
    });
  }

  public async deleteMultiple(publicIds: string[], resourceType: ResourceType = 'image'): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.api.delete_resources(
        publicIds,
        { resource_type: resourceType },
        (error: UploadApiErrorResponse | undefined, result?: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
  }
}

const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
