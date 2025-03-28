
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Loader2, Upload, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  requestSignedUrl, 
  uploadToSignedUrl, 
  dataURLToBlob,
  getFileTypeFromDataURL
} from '@/services/awsService';

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageId, setImageId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request high-resolution camera stream with current facingMode
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
        }, 
        audio: false 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    startCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]); // Restart camera when facingMode changes

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Match canvas dimensions to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame on the canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL with high quality (1.0)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(imageDataUrl);

      // Save to localStorage (temporary solution)
      const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
      savedImages.push(imageDataUrl);
      localStorage.setItem('carImages', JSON.stringify(savedImages));

      toast({
        title: "Photo Captured",
        description: "Your car photo has been saved!",
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
      // Get file type from data URL
      const fileType = getFileTypeFromDataURL(capturedImage);
      // Generate a random file name
      const fileName = `car-${Date.now()}.${fileType.split('/')[1] || 'jpg'}`;
      
      // Step 1: Request signed URL
      setUploadProgress(20);
      console.log(`Requesting signed URL for ${fileName}, type ${fileType}`);
      const response = await requestSignedUrl(fileName, fileType);
      console.log("Received signed URL response:", response);
      setUploadProgress(40);
      
      if (!response || !response.signedUrl || !response.imageId) {
        throw new Error("Invalid response from server");
      }
      
      setImageId(response.imageId);
      
      // Step 2: Upload image to signed URL
      const imageBlob = dataURLToBlob(capturedImage);
      console.log(`Uploading image blob: size ${imageBlob.size}, type ${imageBlob.type}`);
      setUploadProgress(60);
      
      const uploadSuccess = await uploadToSignedUrl(response.signedUrl, imageBlob);
      setUploadProgress(80);
      
      if (!uploadSuccess) {
        throw new Error("Upload failed");
      }
      
      setUploadProgress(100);
      
      // Navigate to result page with the image ID
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCapturedImage(result);
        
        // Save to localStorage (temporary solution)
        const savedImages = JSON.parse(localStorage.getItem('carImages') || '[]');
        savedImages.push(result);
        localStorage.setItem('carImages', JSON.stringify(savedImages));

        toast({
          title: "Image Selected",
          description: "Your image has been loaded successfully!",
        });
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

  const handleSaveAndExit = () => {
    if (capturedImage) {
      // Here you could add more logic for saving if needed
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
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-[#fffbe2]">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <Button variant="ghost" className="text-lg font-medium" onClick={handleSaveAndExit}>
          Save & exit
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {!capturedImage ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover" 
          />
        )}
        
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        {/* Hidden file input */}
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />

        {/* Camera switch button - only show when camera is active */}
        {!capturedImage && (
          <Button 
            onClick={switchCamera}
            className="absolute top-4 right-4 rounded-full h-12 w-12 bg-black/30 backdrop-blur-sm hover:bg-black/50"
            size="icon"
          >
            <RefreshCw className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>

      {/* Upload Progress */}
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

      {/* Controls - Positioned below camera view */}
      <div className="p-6 flex flex-col items-center space-y-4">
        {!capturedImage ? (
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleUploadButtonClick}
              className="rounded-full h-16 w-16 flex items-center justify-center bg-white border-4 border-black"
            >
              <div className="rounded-full h-12 w-12 bg-black flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </Button>
            
            <Button 
              onClick={capturePhoto} 
              className="rounded-full h-16 w-16 flex items-center justify-center bg-white border-4 border-black"
            >
              <div className="rounded-full h-12 w-12 bg-black flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
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
