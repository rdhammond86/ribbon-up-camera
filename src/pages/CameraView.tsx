
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Loader2, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  requestSignedUrl, 
  uploadToSignedUrl, 
  dataURLToBlob,
  getFileTypeFromDataURL,
  resizeImage
} from '@/services/awsService';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const CameraView = () => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageId, setImageId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if an image was passed from the index page
  useEffect(() => {
    if (location.state && location.state.capturedImage) {
      setCapturedImage(location.state.capturedImage);
    }
  }, [location.state]);

  // Initialize camera permissions
  const initializeCamera = async () => {
    try {
      await CapacitorCamera.requestPermissions();
    } catch (error) {
      console.error("Error requesting camera permissions:", error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Request permissions when component mounts
  React.useEffect(() => {
    initializeCamera();
  }, []);

  const takePicture = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image && image.dataUrl) {
        // Process and store the captured image
        setCapturedImage(image.dataUrl);
        
        const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
        savedImages.push(image.dataUrl);
        localStorage.setItem('carImages', JSON.stringify(savedImages));

        toast({
          title: "Photo Captured",
          description: "Your car photo has been saved!",
        });
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      toast({
        title: "Camera Error",
        description: "Failed to capture image.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleUpload = async () => {
    if (!capturedImage) {
      toast({
        title: "No Photo",
        description: "Please take a photo first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);
      
      const fileType = getFileTypeFromDataURL(capturedImage);
      const fileName = `car-${Date.now()}.${fileType.split('/')[1] || 'jpg'}`;
      
      setUploadProgress(40);
      console.log(`Requesting signed URL for ${fileName}, type ${fileType}`);
      const response = await requestSignedUrl(fileName, fileType);
      console.log("Received signed URL response:", response);
      setUploadProgress(50);
      
      if (!response || !response.signedUrl || !response.imageId) {
        throw new Error("Invalid response from server");
      }
      
      setImageId(response.imageId);
      
      const imageBlob = dataURLToBlob(capturedImage);
      console.log(`Uploading image blob: size ${imageBlob.size}, type ${imageBlob.type}`);
      setUploadProgress(70);
      
      const uploadSuccess = await uploadToSignedUrl(response.signedUrl, imageBlob);
      setUploadProgress(90);
      
      if (!uploadSuccess) {
        throw new Error("Upload failed");
      }
      
      setUploadProgress(100);
      
      navigate('/result', { 
        state: { 
          imageId: response.imageId,
          originalImage: capturedImage
        } 
      });
      
    } catch (error) {
      console.error("Error in upload process:", error);
      toast({
        title: "Upload Error",
        description: "There was a problem uploading your image. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        try {
          const resizedImage = await resizeImage(result, 1920, 1024);
          setCapturedImage(resizedImage);
          
          const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
          savedImages.push(resizedImage);
          localStorage.setItem('carImages', JSON.stringify(savedImages));

          toast({
            title: "Image Selected",
            description: "Your image has been loaded and resized successfully!",
          });
        } catch (error) {
          console.error("Error resizing uploaded image:", error);
          setCapturedImage(result);
          toast({
            title: "Image Selected",
            description: "Your image has been loaded (could not resize).",
          });
        }
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the selected file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const selectFromGallery = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image && image.dataUrl) {
        try {
          const resizedImage = await resizeImage(image.dataUrl, 1920, 1024);
          setCapturedImage(resizedImage);
          
          const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
          savedImages.push(resizedImage);
          localStorage.setItem('carImages', JSON.stringify(savedImages));

          toast({
            title: "Image Selected",
            description: "Your image has been loaded and resized successfully!",
          });
        } catch (error) {
          console.error("Error resizing gallery image:", error);
          setCapturedImage(image.dataUrl);
          toast({
            title: "Image Selected",
            description: "Your image has been loaded (could not resize).",
          });
        }
      }
    } catch (error) {
      console.error("Error selecting from gallery:", error);
      toast({
        title: "Gallery Error",
        description: "Failed to select image from gallery.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAndExit = () => {
    if (capturedImage) {
      navigate('/');
    } else {
      toast({
        title: "No Photo",
        description: "Please take a photo first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbe2]">
      <div className="flex justify-between items-center p-4 bg-[#fffbe2]">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="text-lg font-medium">Ribbon Up Your Car</div>
        
        <Button variant="ghost" className="text-lg font-medium" onClick={handleSaveAndExit}>
          Save & exit
        </Button>
      </div>

      <div className="flex-1 relative">
        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center p-4">
              <Camera className="h-16 w-16 mx-auto mb-4" />
              <p className="text-xl">Press the camera button below to take a photo</p>
            </div>
          </div>
        )}
        
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
      </div>

      {isUploading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
          <div className="text-white text-lg mb-4">Processing your image...</div>
          <div className="w-64 mb-2">
            <Progress value={uploadProgress} className="h-2" />
          </div>
          <div className="text-white">{uploadProgress}%</div>
        </div>
      )}

      <div className="p-6 flex flex-col items-center space-y-4">
        {!capturedImage ? (
          <div className="flex items-center space-x-6">
            <Button 
              onClick={handleUploadButtonClick}
              className="rounded-full h-16 w-16 flex items-center justify-center bg-white border-4 border-black"
            >
              <div className="rounded-full h-12 w-12 bg-black flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </Button>
            
            <Button 
              onClick={takePicture} 
              className="rounded-full h-20 w-20 flex items-center justify-center bg-white border-4 border-black"
            >
              <div className="rounded-full h-16 w-16 bg-black flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </Button>
            
            <Button 
              onClick={selectFromGallery}
              className="rounded-full h-16 w-16 flex items-center justify-center bg-white border-4 border-black"
            >
              <div className="rounded-full h-12 w-12 bg-black flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="flex justify-center space-x-4 w-full">
              <Button 
                onClick={() => setCapturedImage(null)} 
                variant="outline"
                className="rounded-full px-6 w-1/2"
              >
                Retake
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="rounded-full px-6 bg-black hover:bg-gray-800 w-1/2"
              >
                Do Magic
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
