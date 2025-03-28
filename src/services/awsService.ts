
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

// Request a signed URL for uploading images
const requestSignedUrl = async (fileName: string, fileType: string): Promise<SignedUrlResponse> => {
  try {
    const response = await fetch("https://bnoimgx3f4wrhldyehi43rohce0gngog.lambda-url.eu-west-1.on.aws/upload", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileType
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error requesting signed URL:', error);
    throw error;
  }
};

// Upload image to the signed URL
const uploadToSignedUrl = async (signedUrl: string, imageBlob: Blob): Promise<boolean> => {
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: imageBlob,
      headers: {
        'Content-Type': imageBlob.type,
      },
    });
    
    return response.ok;
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
  const baseUrl = "https://bnoimgx3f4wrhldyehi43rohce0gngog.lambda-url.eu-west-1.on.aws";
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${baseUrl}/image/${imageId}`);
      
      if (response.ok) {
        const data: ProcessingResult = await response.json();
        
        // If processing is complete, return the URL of the processed image
        if (data.status === 'completed' && data.processedImageUrl) {
          return data.processedImageUrl;
        }
      }
    } catch (error) {
      console.error('Error polling for result:', error);
    }
    
    // Wait before trying again
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  // Return null if we couldn't get a result after maximum attempts
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

export {
  requestSignedUrl,
  uploadToSignedUrl,
  pollForResult,
  dataURLToBlob,
  getFileTypeFromDataURL,
  type SignedUrlResponse
};
