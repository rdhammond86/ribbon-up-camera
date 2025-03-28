
import React from 'react';
import Lottie from 'lottie-react';
import cameraAnimation from '/e2be8d6a1168ca901ca3a329417a9f323d2b841f.mp4.lottie.json';

const CameraIcon: React.FC = () => {
  return (
    <div className="w-56 h-56 mx-auto mb-10">
      <Lottie 
        animationData={cameraAnimation} 
        loop={true}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default CameraIcon;
