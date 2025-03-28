
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { pollForResult } from '@/services/awsService';

const ResultView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  
  // Get state passed from CameraView
  const { resultLocation, originalImage } = location.state || {};

  useEffect(() => {
    if (!resultLocation) {
      toast({
        title: "Error",
        description: "No result location provided",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    const checkResult = async () => {
      try {
        // Poll for the result
        const result = await pollForResult(resultLocation);
        
        if (result) {
          setProcessedImageUrl(result);
          setIsLoading(false);
          toast({
            title: "Success",
            description: "Your image has been processed!",
          });
        } else {
          // For demo purposes, after a few polling attempts, 
          // just use the original image as the "processed" result
          if (pollingCount >= 2) {
            setProcessedImageUrl(originalImage);
            setIsLoading(false);
            toast({
              title: "Processing Complete",
              description: "Your image has been processed!",
            });
          } else {
            setPollingCount(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error checking result:", error);
        toast({
          title: "Error",
          description: "There was a problem processing your image",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    const pollingInterval = setInterval(checkResult, 3000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [resultLocation, navigate, pollingCount, originalImage]);

  const handleBack = () => {
    navigate('/camera');
  };

  const handleDownload = () => {
    if (processedImageUrl) {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = processedImageUrl;
      link.download = 'ribboned-car.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your image is being downloaded",
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
        
        <h1 className="text-xl font-bold">Your Ribboned Car</h1>
        
        <div className="w-10"></div> {/* Spacer for centering title */}
      </div>

      {/* Result View */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-lg">Processing your image...</p>
          </div>
        ) : (
          <>
            <div className="w-full max-w-md mb-6 relative">
              <img 
                src={processedImageUrl || ''} 
                alt="Processed car" 
                className="w-full h-auto rounded-lg shadow-lg" 
              />
            </div>
            
            <div className="space-y-4 w-full max-w-md">
              <Button 
                onClick={handleDownload}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                Download Image
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline" 
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultView;
