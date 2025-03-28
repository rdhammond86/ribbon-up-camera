
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CameraButtonProps {
  text: string;
}

const CameraButton: React.FC<CameraButtonProps> = ({ text }) => {
  const navigate = useNavigate();

  const handleOpenCamera = () => {
    navigate('/camera');
  };

  return (
    <Button 
      onClick={handleOpenCamera} 
      className="bg-black hover:bg-gray-800 text-white rounded-full py-6 px-8 w-full max-w-md mx-auto flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
    >
      <Camera className="h-5 w-5" />
      <span>{text}</span>
    </Button>
  );
};

export default CameraButton;
