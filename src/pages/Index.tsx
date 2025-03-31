
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CameraIcon from '@/components/CameraIcon';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const handleOpenCamera = () => {
    navigate('/camera');
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
