import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import CameraIcon from '@/components/CameraIcon';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
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
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const isNativeMobile = () => {
    return typeof window !== 'undefined' && 
           window.hasOwnProperty('Capacitor') && 
           window['Capacitor']?.isNativePlatform();
  };

  const processImage = async (imageDataUrl: string) => {
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;
      if (imageDataUrl) {
        await processImage(imageDataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNativeCamera = async () => {
    try {
      await CapacitorCamera.requestPermissions();
      
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image && image.dataUrl) {
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

  const handleNativeGallery = async () => {
    try {
      await CapacitorCamera.requestPermissions();
      
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image && image.dataUrl) {
        await processImage(image.dataUrl);
      }
    } catch (error) {
      console.error("Error opening gallery:", error);
      toast({
        title: "Gallery Error",
        description: "Failed to open photo gallery. Please check your permissions.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleCameraAction = () => {
    if (isNativeMobile()) {
      handleNativeCamera();
    } else if (isMobile) {
      fileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleGalleryAction = () => {
    if (isNativeMobile()) {
      handleNativeGallery();
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handleSkip = () => {
    navigate('/result');
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
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture={isMobile ? "environment" : undefined}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {isMobile ? (
              <div className="flex flex-col space-y-4">
                <Button 
                  onClick={handleCameraAction}
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
                      <span>Take a Photo</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleGalleryAction}
                  disabled={isUploading}
                  variant="outline"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full py-4 px-6 w-3/4 mx-auto flex items-center justify-center gap-2 transition-all duration-300 shadow-md"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleCameraAction}
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
                    <Upload className="h-5 w-5" />
                    <span>Upload Photo</span>
                  </>
                )}
              </Button>
            )}
            
            <button 
              onClick={handleSkip} 
              className="text-gray-600 font-medium py-2 px-4 w-full text-center"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
