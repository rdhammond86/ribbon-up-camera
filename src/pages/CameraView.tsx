
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Camera } from 'lucide-react';

const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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

      // Save to localStorage (temporary solution until backend is implemented)
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

      {/* Controls */}
      <div className="p-6 flex justify-center">
        <Button 
          onClick={capturePhoto} 
          className="rounded-full h-16 w-16 flex items-center justify-center bg-white border-4 border-black"
        >
          <div className="rounded-full h-12 w-12 bg-black flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </Button>
      </div>
    </div>
  );
};

export default CameraView;
