
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CameraIcon from '@/components/CameraIcon';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();

  const handleOpenCamera = async () => {
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

        // Navigate to camera page with the captured image
        navigate('/camera', { state: { capturedImage: image.dataUrl } });
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      toast({
        title: "Camera Error",
        description: "Failed to open camera. Navigating to camera screen.",
        variant: "destructive",
      });
      // If camera fails, still navigate to the camera page as fallback
      navigate('/camera');
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
              className="bg-black hover:bg-gray-800 text-white rounded-full py-6 px-8 w-full max-w-md mx-auto flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
            >
              <Camera className="h-5 w-5" />
              <span>Ribbon up my car</span>
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
