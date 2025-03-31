
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CameraIcon from '@/components/CameraIcon';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from '@/hooks/use-toast';
import { 
  requestSignedUrl, 
  uploadToSignedUrl,
  dataURLToBlob,
  getFileTypeFromDataURL
} from '@/services/awsService';

const Index = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = React.useState(false);

  const isWebEnvironment = () => {
    // Check if we're running in a web browser without native capabilities
    return !window.Capacitor || window.Capacitor.platform === 'web';
  };

  const processImage = async (imageDataUrl) => {
    setIsUploading(true);
    
    try {
      const fileType = getFileTypeFromDataURL(imageDataUrl);
      const fileName = `car-${Date.now()}.${fileType.split('/')[1] || 'jpg'}`;
      
      console.log(`Requesting signed URL for ${fileName}, type ${fileType}`);
      const response = await requestSignedUrl(fileName, fileType);
      console.log("Received signed URL response:", response);
      
      if (!response || !response.signedUrl || !response.imageId) {
        throw new Error("Invalid response from server");
      }
      
      const imageBlob = dataURLToBlob(imageDataUrl);
      console.log(`Uploading image blob: size ${imageBlob.size}, type ${imageBlob.type}`);
      
      const uploadSuccess = await uploadToSignedUrl(response.signedUrl, imageBlob);
      
      if (!uploadSuccess) {
        throw new Error("Upload failed");
      }
      
      // Navigate directly to result page with the image ID and original image
      navigate('/result', { 
        state: { 
          imageId: response.imageId,
          originalImage: imageDataUrl
        } 
      });
    } catch (error) {
      console.error("Error in upload process:", error);
      toast({
        title: "Upload Error",
        description: "There was a problem uploading your image. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleWebCamera = async () => {
    try {
      // For web browsers, use the browser's camera API
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video and canvas elements
      const video = document.createElement('video');
      video.srcObject = stream;
      video.style.display = 'none';
      document.body.appendChild(video);
      
      // Wait for video to start playing
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      // Create canvas to capture the image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image as data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      video.remove();
      canvas.remove();
      
      // Save the image to localStorage
      const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
      savedImages.push(imageDataUrl);
      localStorage.setItem('carImages', JSON.stringify(savedImages));
      
      // Process the image
      await processImage(imageDataUrl);
      
    } catch (error) {
      console.error("Error using web camera:", error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check your camera permissions.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleOpenCamera = async () => {
    if (isWebEnvironment()) {
      handleWebCamera();
      return;
    }
    
    try {
      // Request camera permissions
      await CapacitorCamera.requestPermissions();
      
      // Open the camera directly
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image && image.dataUrl) {
        // Save the image to localStorage
        const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
        savedImages.push(image.dataUrl);
        localStorage.setItem('carImages', JSON.stringify(savedImages));

        // Process the image
        await processImage(image.dataUrl);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      toast({
        title: "Camera Error",
        description: "Failed to open camera. Please check your camera permissions.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbe2]">
      <div className="w-full flex-grow-0 flex-shrink-0">
        <CameraIcon />
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Ribbon Up Your Car</h1>
          
          <p className="text-lg mb-12 text-gray-800">Time for some Motorway Magic, give your car the touch of class it deserves</p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleOpenCamera}
              disabled={isUploading}
              className="bg-black hover:bg-gray-800 text-white rounded-full py-6 px-8 w-full max-w-md mx-auto flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span>Ribbon up my car</span>
                </>
              )}
            </Button>
            
            <button className="text-gray-600 font-medium py-2 px-4 w-full text-center">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
