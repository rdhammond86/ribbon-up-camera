
import React from 'react';
import CameraIcon from '@/components/CameraIcon';
import CameraButton from '@/components/CameraButton';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#fffbe2]">
      <div className="w-full max-w-md mx-auto text-center">
        <CameraIcon />
        
        <h1 className="text-4xl font-bold mb-6 text-gray-900">Ribbon Up Your Car</h1>
        
        <p className="text-lg mb-12 text-gray-800">
          Take photos of your car and make it stand out. Capture all the best angles, upgrades, and key details to showcase your vehicle.
        </p>
        
        <div className="space-y-4">
          <CameraButton text="Ribbon up my car" />
          
          <button className="text-gray-600 font-medium py-2 px-4 w-full text-center">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
