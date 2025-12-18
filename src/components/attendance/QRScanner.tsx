import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Keyboard, X, CheckCircle, AlertCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { validateQRCode, recordAttendance } from "../../services/attendanceService";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import type { AttendanceSession } from "../../types";

interface QRScannerProps {
    onSuccess?: (session: AttendanceSession) => void;
    onCancel?: () => void;
}

// Generate a unique ID for each scanner instance to avoid DOM conflicts
let scannerCounter = 0;

const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onCancel }) => {
    const { user, userDetails } = useAuth();
    const { showSuccess, showError } = useNotifications();

    const [isScanning, setIsScanning] = useState(false);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        session?: AttendanceSession;
    } | null>(null);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerIdRef = useRef<string>(`qr-reader-${++scannerCounter}`);
    const scannerContainerRef = useRef<HTMLDivElement | null>(null);
    const isMountedRef = useRef(true);
    const isStartingRef = useRef(false);

    // Cleanup function
    const cleanupScanner = useCallback(async () => {
        const scanner = html5QrCodeRef.current;
        if (!scanner) return;

        html5QrCodeRef.current = null;

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }
        } catch (error: any) {
            // Ignore all stop errors - these are common during unmount
            if (error?.name !== 'NotFoundError' && error?.name !== 'AbortError') {
                console.warn('Scanner stop error:', error);
            }
        }

        // Small delay to allow stop to fully complete
        await new Promise(resolve => setTimeout(resolve, 150));

        // Clear the scanner in a try-catch to handle any DOM conflicts
        try {
            scanner.clear();
        } catch (error: any) {
            // Silently ignore clear errors - DOM might already be cleaned up
        }
    }, []);

    // Use layoutEffect to ensure cleanup happens before React tries to remove DOM nodes
    useLayoutEffect(() => {
        isMountedRef.current = true;
        setScannerReady(true);

        // Suppress AbortError from media elements (common when navigating away during camera init)
        const handleGlobalError = (event: PromiseRejectionEvent) => {
            if (event.reason?.name === 'AbortError' &&
                event.reason?.message?.includes('play()')) {
                event.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', handleGlobalError);

        return () => {
            isMountedRef.current = false;
            window.removeEventListener('unhandledrejection', handleGlobalError);

            // Cleanup scanner synchronously before React removes DOM
            const scanner = html5QrCodeRef.current;
            if (scanner) {
                html5QrCodeRef.current = null;
                try {
                    if (scanner.isScanning) {
                        scanner.stop().catch(() => { });
                    }
                    // Clear scanner DOM immediately and synchronously
                    scanner.clear();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        };
    }, []);

    const startScanning = async () => {
        if (isStartingRef.current || isScanning) return;
        if (!scannerReady) return;

        isStartingRef.current = true;

        try {
            // Clean up any existing scanner first
            await cleanupScanner();

            // Small delay to ensure DOM is ready
            await new Promise((resolve) => setTimeout(resolve, 200));

            if (!isMountedRef.current) return;

            const scannerId = scannerIdRef.current;
            const container = document.getElementById(scannerId);
            if (!container) {
                throw new Error("Scanner container not found");
            }

            const html5QrCode = new Html5Qrcode(scannerId);
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                handleQRCodeScanned,
                () => {
                    // Ignore scan errors - fires when no QR in view
                }
            );

            if (isMountedRef.current) {
                setIsScanning(true);
            }
        } catch (error: any) {
            if (!isMountedRef.current) return;

            // Don't show error for AbortError or NotFoundError (common during unmount)
            if (error?.name === "AbortError" || error?.name === "NotFoundError") {
                return;
            }

            console.error("Failed to start scanner:", error);
            showError(
                error.message || "Unable to access camera. Please check permissions or use manual entry."
            );
            setShowManualInput(true);
        } finally {
            isStartingRef.current = false;
        }
    };

    const stopScanning = async () => {
        await cleanupScanner();
        if (isMountedRef.current) {
            setIsScanning(false);
        }
    };

    const handleQRCodeScanned = async (decodedText: string) => {
        // Stop scanning immediately to prevent multiple scans
        await stopScanning();
        await processQRCode(decodedText);
    };

    const processQRCode = async (qrCodeData: string) => {
        if (!user || !userDetails) {
            showError("You must be logged in to record attendance");
            return;
        }

        setIsProcessing(true);
        setResult(null);

        try {
            const validation = await validateQRCode(qrCodeData, user.uid);

            if (!validation.valid) {
                setResult({
                    success: false,
                    message: validation.error || "Invalid QR code",
                });
                return;
            }

            // Record attendance
            await recordAttendance({
                session_id: validation.session!.id,
                member_id: user.uid,
                member_name: userDetails.full_name,
                checked_in_at: Timestamp.now(),
                check_in_method: "qr_scan",
            });

            setResult({
                success: true,
                message: "Attendance recorded successfully!",
                session: validation.session,
            });

            showSuccess("Your attendance has been recorded");
            onSuccess?.(validation.session!);
        } catch (error: any) {
            console.error("Error processing QR code:", error);
            setResult({
                success: false,
                message: error.message || "Failed to record attendance",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode.trim()) {
            showError("Please enter a code");
            return;
        }
        await processQRCode(manualCode.trim());
    };

    const handleReset = () => {
        setResult(null);
        setManualCode("");
        setShowManualInput(false);
    };

    // If user is not logged in, show login required message
    if (!user) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Login Required
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        You must be logged in to scan attendance QR codes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Scan Attendance QR Code
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Point your camera at the QR code displayed at the meeting to mark your attendance.
                </p>
            </div>

            {/* Result Display */}
            {result && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-start ${result.success
                        ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                        }`}
                >
                    {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                        <p
                            className={`font-medium ${result.success
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                                }`}
                        >
                            {result.message}
                        </p>
                        {result.session && (
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Meeting: {result.session.meeting_title}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleReset}
                        className="ml-3 text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Scanner Area - Always rendered but hidden when not in use */}
            {!result && !showManualInput && (
                <div className="mb-6">
                    <div className="mx-auto max-w-sm bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative"
                        style={{ minHeight: "300px" }}
                    >
                        <div
                            id={scannerIdRef.current}
                            ref={scannerContainerRef}
                            suppressHydrationWarning
                        />
                        {!isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Click "Start Camera" to begin scanning
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manual Input Area */}
            {showManualInput && !result && (
                <div className="mb-6">
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Enter QR Code Data
                            </label>
                            <Input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="e.g., inkuthazo-abc123-xyz789"
                                disabled={isProcessing}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Ask the meeting organizer for the attendance code.
                            </p>
                        </div>
                        <Button type="submit" disabled={isProcessing || !manualCode.trim()}>
                            {isProcessing ? "Checking..." : "Submit"}
                        </Button>
                    </form>
                </div>
            )}

            {/* Processing State */}
            {isProcessing && (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400">Verifying attendance...</p>
                </div>
            )}

            {/* Action Buttons */}
            {!result && !isProcessing && (
                <div className="flex flex-wrap gap-3 justify-center">
                    {!showManualInput ? (
                        <>
                            {isScanning ? (
                                <Button variant="danger" onClick={stopScanning}>
                                    <CameraOff className="h-4 w-4 mr-2" />
                                    Stop Camera
                                </Button>
                            ) : (
                                <Button onClick={startScanning} disabled={!scannerReady}>
                                    <Camera className="h-4 w-4 mr-2" />
                                    Start Camera
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => setShowManualInput(true)}>
                                <Keyboard className="h-4 w-4 mr-2" />
                                Enter Code Manually
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowManualInput(false);
                                setManualCode("");
                            }}
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            Use Camera Instead
                        </Button>
                    )}
                    {onCancel && (
                        <Button variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
            )}

            {/* Success Actions */}
            {result?.success && (
                <div className="flex justify-center gap-3 mt-4">
                    <Button onClick={handleReset}>Scan Another</Button>
                    {onCancel && (
                        <Button variant="secondary" onClick={onCancel}>
                            Done
                        </Button>
                    )}
                </div>
            )}

            {/* Error Retry Actions */}
            {result && !result.success && (
                <div className="flex justify-center gap-3 mt-4">
                    <Button onClick={handleReset}>Try Again</Button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
