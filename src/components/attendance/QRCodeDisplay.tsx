import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Printer, Copy, CheckCircle, Clock, MapPin, Users } from "lucide-react";
import Button from "../ui/Button";
import type { AttendanceSession } from "../../types";
import { format } from "date-fns";
import { useNotifications } from "../../hooks/useNotifications";

interface QRCodeDisplayProps {
    session: AttendanceSession;
    isOpen: boolean;
    onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
    session,
    isOpen,
    onClose,
}) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useNotifications();

    if (!isOpen) return null;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(session.qr_code_data);
            showSuccess("QR code data copied to clipboard");
        } catch (error) {
            showError("Failed to copy to clipboard");
        }
    };

    const handleDownload = () => {
        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `attendance-qr-${session.id}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            showError("Unable to open print window. Please check your popup settings.");
            return;
        }

        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance QR Code - ${session.meeting_title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 400px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .details {
              margin-bottom: 20px;
              color: #666;
            }
            .qr-code {
              margin: 20px 0;
            }
            .instructions {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${session.meeting_title}</h1>
            <div class="details">
              <p>${format(session.meeting_date.toDate(), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
              ${session.venue ? `<p>Venue: ${session.venue}</p>` : ""}
            </div>
            <div class="qr-code">
              ${svgData}
            </div>
            <div class="instructions">
              <p>Scan this QR code with your phone to mark your attendance.</p>
              <p>Open the Inkuthazo portal, go to Attendance, and use the QR Scanner.</p>
            </div>
          </div>
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.print();
    };

    const expiresAt = session.expires_at.toDate();
    const isExpired = expiresAt < new Date();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Attendance QR Code
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Session Details */}
                        <div className="mb-4 text-center">
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {session.meeting_title}
                            </h4>
                            <div className="flex flex-col items-center space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {format(session.meeting_date.toDate(), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                                </div>
                                {session.venue && (
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {session.venue}
                                    </div>
                                )}
                                {session.max_attendees && (
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1" />
                                        Max {session.max_attendees} attendees
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div
                            ref={qrRef}
                            className="flex justify-center p-4 bg-white rounded-lg"
                        >
                            <QRCodeSVG
                                value={session.qr_code_data}
                                size={256}
                                level="H"
                                includeMargin
                            />
                        </div>

                        {/* Status */}
                        <div className="mt-4 text-center">
                            {isExpired ? (
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Expired
                                </div>
                            ) : !session.is_active ? (
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                                    Session Closed
                                </div>
                            ) : (
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Active until {format(expiresAt, "h:mm a")}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={handleCopyCode}
                                className="flex items-center"
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Code
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleDownload}
                                className="flex items-center"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handlePrint}
                                className="flex items-center"
                            >
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6">
                        <Button
                            variant="primary"
                            onClick={onClose}
                            className="w-full"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeDisplay;
