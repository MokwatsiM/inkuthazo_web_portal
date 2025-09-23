import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { meetingService } from '../../services/meetingService';
import { useAuth } from '../../hooks/useAuth';
import type { QRValidationResponse } from '../../types/attendance';

interface QRScannerProps {
  onScanSuccess: (meeting: any) => void;
  onClose: () => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { userDetails } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationResult, setValidationResult] = useState<QRValidationResponse | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    initializeScanner();
    return () => {
      cleanup();
    };
  }, []);

  const initializeScanner = async () => {
    if (!videoRef.current || !userDetails?.id) return;

    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);

      if (!hasCamera) {
        setError('No camera found on this device');
        return;
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
        }
      );

      qrScannerRef.current = scanner;
      await scanner.start();
      setIsScanning(true);
    } catch (error) {
      console.error('Error initializing scanner:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const handleScanResult = async (data: string) => {
    if (!userDetails?.id) return;

    try {
      setError('');

      // Stop scanning while processing
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        setIsScanning(false);
      }

      const result = await meetingService.validateQRCode(data, userDetails.id);
      setValidationResult(result);

      if (result.valid && result.meeting) {
        setTimeout(() => {
          onScanSuccess(result.meeting);
        }, 1500); // Show success message for 1.5 seconds
      } else {
        setError(result.error || 'Invalid QR code');
        // Restart scanning after error
        setTimeout(() => {
          restartScanning();
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code');
      setTimeout(() => {
        restartScanning();
      }, 2000);
    }
  };

  const restartScanning = async () => {
    if (qrScannerRef.current && hasCamera) {
      try {
        await qrScannerRef.current.start();
        setIsScanning(true);
        setError('');
        setValidationResult(null);
      } catch (error) {
        console.error('Error restarting scanner:', error);
        setError('Failed to restart camera');
      }
    }
  };

  const cleanup = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Camera Not Available</h3>
            <Button variant="ghost" onClick={handleClose} className="!p-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              No camera found on this device. You cannot scan QR codes without a camera.
            </p>
            <Button onClick={handleClose} fullWidth>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-md max-h-screen">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-semibold">Scan QR Code</h3>
            <Button variant="ghost" onClick={handleClose} className="!p-2 text-white">
              <X className="w-6 h-6" />
            </Button>
          </div>
          <p className="text-white text-sm mt-2">
            Position the QR code within the scanner area
          </p>
        </div>

        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />

          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {!isScanning && !error && !validationResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {validationResult?.valid && validationResult.meeting && (
            <div className="bg-green-500 text-white p-4 rounded-lg mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-semibold">QR Code Valid!</p>
                <p className="text-sm">{validationResult.meeting.title}</p>
              </div>
            </div>
          )}

          {!isScanning && !error && !validationResult && (
            <Button onClick={restartScanning} fullWidth>
              Start Scanning
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerComponent;