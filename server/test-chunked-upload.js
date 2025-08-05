#!/usr/bin/env node

/**
 * Test script for chunked upload functionality
 * This script creates a test file and uploads it using the chunked upload API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_FILE_SIZE = 8 * 1024 * 1024; // 8MB test file
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

/**
 * Generate a test file with random content
 */
function generateTestFile(filePath, size) {
  console.log(`Generating test file: ${filePath} (${size} bytes)`);
  
  const chunk = Buffer.alloc(1024, 'A'); // 1KB chunk of 'A's
  const writeStream = fs.createWriteStream(filePath);
  
  let bytesWritten = 0;
  
  return new Promise((resolve, reject) => {
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
    
    function writeChunk() {
      if (bytesWritten >= size) {
        writeStream.end();
        return;
      }
      
      const remainingBytes = size - bytesWritten;
      const chunkToWrite = remainingBytes < chunk.length ? chunk.slice(0, remainingBytes) : chunk;
      
      if (writeStream.write(chunkToWrite)) {
        bytesWritten += chunkToWrite.length;
        process.stdout.write(`\rProgress: ${Math.round((bytesWritten / size) * 100)}%`);
        writeChunk();
      } else {
        writeStream.once('drain', () => {
          bytesWritten += chunkToWrite.length;
          process.stdout.write(`\rProgress: ${Math.round((bytesWritten / size) * 100)}%`);
          writeChunk();
        });
      }
    }
    
    writeChunk();
  });
}

/**
 * Split file into chunks
 */
function splitFileIntoChunks(filePath, chunkSize) {
  const fileBuffer = fs.readFileSync(filePath);
  const chunks = [];
  
  for (let i = 0; i < fileBuffer.length; i += chunkSize) {
    chunks.push(fileBuffer.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Initialize chunked upload
 */
async function initializeUpload(fileName, fileSize, mimeType) {
  const response = await fetch(`${API_BASE_URL}/upload-initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': 'test-device-123'
    },
    body: JSON.stringify({
      fileName,
      fileSize,
      mimeType
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to initialize upload: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Upload a chunk
 */
async function uploadChunk(chunk, chunkIndex, totalChunks, fileName, fileSize, mimeType) {
  const formData = new FormData();
  formData.append('chunk', new Blob([chunk]));
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('fileName', fileName);
  formData.append('fileSize', fileSize.toString());
  formData.append('mimeType', mimeType);
  
  const response = await fetch(`${API_BASE_URL}/upload-chunk`, {
    method: 'POST',
    headers: {
      'X-Device-ID': 'test-device-123'
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload chunk ${chunkIndex}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('🧪 Starting chunked upload test...\n');
    
    // Generate test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    await generateTestFile(testFilePath, TEST_FILE_SIZE);
    console.log('\n✅ Test file generated successfully\n');
    
    // Initialize upload
    console.log('📤 Initializing chunked upload...');
    const initResponse = await initializeUpload('test-file.txt', TEST_FILE_SIZE, 'text/plain');
    console.log('✅ Upload initialized:', initResponse.data);
    
    // Split file into chunks
    console.log('\n📦 Splitting file into chunks...');
    const chunks = splitFileIntoChunks(testFilePath, CHUNK_SIZE);
    console.log(`✅ File split into ${chunks.length} chunks\n`);
    
    // Upload chunks
    console.log('📤 Uploading chunks...');
    let chunkDirName = null;
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Uploading chunk ${i + 1}/${chunks.length}...`);
      
      const response = await uploadChunk(
        chunks[i],
        i,
        chunks.length,
        'test-file.txt',
        TEST_FILE_SIZE,
        'text/plain'
      );
      
      chunkDirName = response.data.chunkDirName;
      console.log(`✅ Chunk ${i + 1} uploaded successfully`);
      
      if (response.data.completed) {
        console.log('🎉 All chunks uploaded and file processed successfully!');
        console.log('File ID:', response.data.fileId);
        break;
      }
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Test file cleaned up');
    
    console.log('\n✅ Chunked upload test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest(); 