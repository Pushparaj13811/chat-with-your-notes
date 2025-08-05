# Cloudinary Setup Guide

This guide will help you set up Cloudinary for cloud-based file storage in your Chat with Your Notes application.

## What is Cloudinary?

Cloudinary is a cloud-based service that provides solutions for image and video management, including:
- Cloud storage for files
- Automatic image/video optimization
- CDN delivery
- File transformations
- Secure uploads

## Why Use Cloudinary?

- **Scalability**: No local storage limitations
- **Reliability**: 99.9% uptime SLA
- **Performance**: Global CDN for fast file access
- **Security**: Secure uploads and access control
- **Cost-effective**: Generous free tier (25GB storage, 25GB bandwidth/month)

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [Cloudinary's website](https://cloudinary.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Get Your Credentials

After signing up, you'll find your credentials in the Dashboard:

1. Log in to your Cloudinary Dashboard
2. Look for the "Account Details" section
3. Note down:
   - **Cloud Name** (e.g., `my-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### 3. Configure Environment Variables

Add these variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 4. Test the Integration

1. Start your server: `bun run dev`
2. Upload a file through the application
3. Check your Cloudinary Dashboard to see the uploaded file
4. Verify the file appears in the `chat-notes` folder

## How It Works

### File Upload Flow

1. **Small Files (<5MB)**:
   - File is uploaded directly to Cloudinary
   - URL is stored in the database
   - Local file is deleted after processing

2. **Large Files (5MB-100MB)**:
   - File is split into chunks
   - Each chunk is uploaded to Cloudinary
   - Chunks are merged and the final file is uploaded
   - All temporary chunks are cleaned up

### Storage Structure

```
Cloudinary Account
├── chat-notes/           # Main folder for documents
│   ├── document1.pdf
│   ├── document2.docx
│   └── document3.txt
└── chat-notes/chunks/    # Temporary chunks for large files
    ├── file1_chunk_0
    ├── file1_chunk_1
    └── ...
```

### Database Schema

The `File` model now includes:
- `path`: Cloudinary URL (e.g., `https://res.cloudinary.com/your-cloud/...`)
- `cloudinaryPublicId`: Cloudinary public ID for file management

## Security Considerations

### API Key Security

- **Never commit API keys to version control**
- Use environment variables for all credentials
- Consider using Cloudinary's signed uploads for additional security

### Access Control

- Files are organized by device ID for privacy
- Each device can only access its own files
- Cloudinary URLs are public but files are organized securely

### File Cleanup

- Automatic cleanup of old chunk files (24 hours)
- Manual cleanup when files are deleted
- Database cascade deletion ensures consistency

## Monitoring and Maintenance

### Dashboard Monitoring

1. **Storage Usage**: Monitor your storage usage in the Cloudinary Dashboard
2. **Bandwidth**: Track bandwidth consumption
3. **File Count**: Monitor the number of files uploaded

### Cleanup Jobs

The application automatically runs cleanup jobs:
- **Every 6 hours**: Clean up old chunk files
- **On file deletion**: Remove files from Cloudinary
- **On upload completion**: Clean up temporary chunks

### Error Handling

- Failed uploads are automatically retried
- Partial uploads are cleaned up
- Database consistency is maintained

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**:
   - Check your Cloudinary credentials in `.env`
   - Verify your account is active

2. **"Upload failed" error**:
   - Check your internet connection
   - Verify file size limits
   - Check Cloudinary service status

3. **"File not found" error**:
   - Verify the file exists in Cloudinary
   - Check the public ID in the database

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed Cloudinary upload logs.

## Cost Optimization

### Free Tier Limits

- **25GB storage**
- **25GB bandwidth/month**
- **25,000 transformations/month**

### Optimization Tips

1. **File Compression**: Use appropriate file formats
2. **Chunk Size**: Optimize chunk sizes for your use case
3. **Cleanup**: Regular cleanup of unused files
4. **Monitoring**: Track usage to avoid overages

### Upgrade Considerations

If you exceed free tier limits:
- **Pro Plan**: $89/month for 225GB storage, 225GB bandwidth
- **Advanced Plan**: $224/month for 675GB storage, 675GB bandwidth
- **Custom Plans**: Contact Cloudinary for enterprise needs

## Migration from Local Storage

If you're migrating from local file storage:

1. **Backup existing files**: Ensure you have backups
2. **Update environment**: Add Cloudinary credentials
3. **Run migration**: Existing files will remain local
4. **Gradual migration**: New uploads will use Cloudinary

## Support

- **Cloudinary Documentation**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Cloudinary Support**: Available in the dashboard
- **Community Forum**: [https://support.cloudinary.com/](https://support.cloudinary.com/)

## Security Best Practices

1. **Environment Variables**: Never hardcode credentials
2. **Signed Uploads**: Use signed uploads for sensitive files
3. **Access Control**: Implement proper access controls
4. **Monitoring**: Monitor for unusual activity
5. **Backup**: Regular backups of your database

## Performance Tips

1. **CDN**: Cloudinary automatically serves files via CDN
2. **Optimization**: Use Cloudinary's optimization features
3. **Caching**: Leverage browser caching for static files
4. **Compression**: Enable gzip compression

---

For more information, visit the [Cloudinary documentation](https://cloudinary.com/documentation) or contact their support team. 