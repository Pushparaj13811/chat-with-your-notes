import { v2 as cloudinary } from "cloudinary";
import type {
  UploadApiResponse,
  DeleteApiResponse,
  ResourceType,
  UploadApiErrorResponse,
  ConfigOptions,
} from "cloudinary";
import { appConfig } from "../config/env";

class CloudinaryService {
  private config: ConfigOptions;

  constructor() {
    this.config = this.initialize();
  }

  private initialize(): ConfigOptions {
    if (!appConfig.cloudinary.cloudName || !appConfig.cloudinary.apiKey || !appConfig.cloudinary.apiSecret) {
      throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
    }

    const configOptions: ConfigOptions = {
      cloud_name: appConfig.cloudinary.cloudName,
      api_key: appConfig.cloudinary.apiKey,
      api_secret: appConfig.cloudinary.apiSecret,
      secure: true,
    };

    // Configure cloudinary globally
    cloudinary.config(configOptions);

    // Verify configuration
    const verifyConfig = cloudinary.config();
    console.log('✅ Cloudinary service initialized successfully');
    console.log(`   Cloud Name: ${verifyConfig.cloud_name}`);
    console.log(`   API Key: ${verifyConfig.api_key?.substring(0, 6)}...`);
    console.log(`   API Secret: ${verifyConfig.api_secret ? '✅ Set' : '❌ Missing'}`);

    return configOptions;
  }

  public async upload(
    fileBuffer: Buffer,
    originalName: string,
    folder: string = appConfig.cloudinary.folderName
  ): Promise<UploadApiResponse> {
    // Re-configure cloudinary before upload to ensure credentials are set
    cloudinary.config(this.config);

    // Verify configuration
    const currentConfig = cloudinary.config();
    if (!currentConfig.api_key || !currentConfig.api_secret) {
      throw new Error('Cloudinary is not properly configured. Missing API credentials.');
    }

    console.log(`📤 Uploading to Cloudinary: ${originalName}`);
    console.log(`   Folder: ${folder}`);
    console.log(`   Config: ${currentConfig.cloud_name} (key: ${currentConfig.api_key?.substring(0, 6)}..., secret: ${currentConfig.api_secret ? 'present' : 'MISSING'})`);

    try {
      // Convert buffer to base64 data URI
      const base64File = `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`;

      // Use direct upload method instead of upload_stream for better compatibility
      const result = await cloudinary.uploader.upload(base64File, {
        folder: folder,
        resource_type: 'raw',
        public_id: originalName.split('.')[0],
        overwrite: true,
        use_filename: true,
        unique_filename: false,
      });

      console.log(`✅ File uploaded successfully: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  }

  public async uploadChunk(
    chunkBuffer: Buffer,
    chunkFileName: string,
    folder: string = 'chat-notes-chunks'
  ): Promise<UploadApiResponse> {
    // Re-configure cloudinary before upload
    cloudinary.config(this.config);

    try {
      // Convert buffer to base64 data URI
      const base64File = `data:application/octet-stream;base64,${chunkBuffer.toString('base64')}`;

      // Use direct upload method instead of upload_stream
      const result = await cloudinary.uploader.upload(base64File, {
        folder,
        public_id: chunkFileName,
        resource_type: 'raw',
        use_filename: true,
        unique_filename: false,
      });

      console.log(`✅ Chunk uploaded successfully: ${chunkFileName}`);
      return result;
    } catch (error) {
      console.error('❌ Cloudinary chunk upload error:', error);
      throw error;
    }
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
