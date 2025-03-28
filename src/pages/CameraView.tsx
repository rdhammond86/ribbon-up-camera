
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  requestSignedUrl, 
  uploadToSignedUrl, 
  dataURLToBlob 
} from '@/services/awsService';

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultLocation, setResultLocation] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" }, 
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

    startCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

      // Convert canvas to data URL and set as captured image
      const imageDataUrl = canvas.toDataURL('image/png');
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
      // Step 1: Request signed URL
      const response = await requestSignedUrl();
      setUploadProgress(30);
      
      // Step 2: Upload image to signed URL
      const imageBlob = dataURLToBlob(capturedImage);
      const uploadSuccess = await uploadToSignedUrl(response.signedUrl, imageBlob);
      setUploadProgress(70);
      
      if (uploadSuccess) {
        setResultLocation(response.resultLocation);
        setUploadProgress(100);
        
        // Navigate to result page with the result location
        navigate('/result', { 
          state: { 
            resultLocation: response.resultLocation,
            originalImage: capturedImage 
          } 
        });
      } else {
        throw new Error("Upload failed");
      }
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
          <Button 
            onClick={capturePhoto} 
            className="rounded-full h-16 w-16 flex items-center justify-center bg-white border-4 border-black"
          >
            <div className="rounded-full h-12 w-12 bg-black flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </Button>
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
