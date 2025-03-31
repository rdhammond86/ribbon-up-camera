
/**
 * Service for handling AWS image upload and processing
 */

interface SignedUrlResponse {
  signedUrl: string;
  imageId: string;
}

interface ProcessingResult {
  status: string;
  processedImageUrl?: string;
}

// Base URL for the AWS Lambda service
const BASE_URL = "https://pjsphjtmgyradyzut3e5foiqom0shbhg.lambda-url.eu-west-1.on.aws";

// Request a signed URL for uploading images
const requestSignedUrl = async (fileName: string, fileType: string): Promise<SignedUrlResponse> => {
  try {
    // Using URL parameters instead of JSON body to avoid CORS preflight request
    // Changed parameter name from fileName to imageName as required by the server
    const encodedFileName = encodeURIComponent(fileName);
    const encodedFileType = encodeURIComponent(fileType);
    const url = `${BASE_URL}/upload?imageName=${encodedFileName}&fileType=${encodedFileType}`;
    
    console.log("Requesting signed URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',  // Using GET to avoid preflight requests
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get signed URL. Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Signed URL response:", data);
    
    return data;
  } catch (error) {
    console.error('Error requesting signed URL:', error);
    throw error;
  }
};

// Upload image to the signed URL
const uploadToSignedUrl = async (signedUrl: string, imageBlob: Blob): Promise<boolean> => {
  try {
    console.log("Uploading to signed URL:", signedUrl);
    console.log("Image blob type:", imageBlob.type, "size:", imageBlob.size);
    
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: imageBlob,
      headers: {
        'Content-Type': imageBlob.type,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to upload image. Status: ${response.status}, Response: ${errorText}`);
      return false;
    }
    
    console.log("Upload successful");
    return true;
  } catch (error) {
    console.error('Error uploading image:', error);
    return false;
  }
};

// Poll for the processed image result
const pollForResult = async (
  imageId: string, 
  maxAttempts = 10, 
  interval = 2000
): Promise<string | null> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Polling for result: ${BASE_URL}/image/${imageId}`);
      const response = await fetch(`${BASE_URL}/image/${imageId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: ProcessingResult = await response.json();
        console.log("Poll response:", data);
        
        // If processing is complete, return the URL of the processed image
        if (data.status === 'completed' && data.processedImageUrl) {
          return data.processedImageUrl;
        }
      } else {
        console.log(`Poll failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error polling for result:', error);
    }
    
    // Wait before trying again
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  // Return null if we couldn't get a result after maximum attempts
  console.log("Max polling attempts reached without result");
  return null;
};

// Helper to convert dataURL to Blob
const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

// Helper to extract file type from data URL
const getFileTypeFromDataURL = (dataURL: string): string => {
  const matches = dataURL.match(/^data:(.*?);base64/);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return 'image/jpeg'; // Default to JPEG if unable to determine
};

// New function: Resize image to specified max dimensions
const resizeImage = (dataUrl: string, maxWidth = 1920, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      // Only resize if the image exceeds maxWidth or maxHeight
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }
      
      // Create canvas for resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get file type from original data URL
      const fileType = getFileTypeFromDataURL(dataUrl);
      
      // Convert to data URL with quality 0.9 (90%)
      const resizedDataUrl = canvas.toDataURL(fileType, 0.9);
      console.log(`Image resized: ${img.width}x${img.height} -> ${width}x${height}`);
      
      resolve(resizedDataUrl);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    img.src = dataUrl;
  });
};

export {
  requestSignedUrl,
  uploadToSignedUrl,
  pollForResult,
  dataURLToBlob,
  getFileTypeFromDataURL,
  resizeImage,
  type SignedUrlResponse
};
