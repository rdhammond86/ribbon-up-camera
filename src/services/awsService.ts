
/**
 * Service for handling AWS image upload and processing
 */

interface SignedUrlResponse {
  signedUrl: string;
  resultLocation: string;
}

// Request a signed URL for uploading images
const requestSignedUrl = async (): Promise<SignedUrlResponse> => {
  try {
    const response = await fetch("https://bnoimgx3f4wrhldyehi43rohce0gngog.lambda-url.eu-west-1.on.aws/", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
        'Content-Type': 'image/jpeg',
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
  resultLocation: string, 
  maxAttempts = 10, 
  interval = 2000
): Promise<string | null> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Use the result location URL directly
      const response = await fetch(resultLocation);
      
      if (response.ok) {
        const data = await response.json();
        
        // If processing is complete, return the URL of the processed image
        if (data.status === 'completed') {
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

export {
  requestSignedUrl,
  uploadToSignedUrl,
  pollForResult,
  dataURLToBlob,
  type SignedUrlResponse
};
