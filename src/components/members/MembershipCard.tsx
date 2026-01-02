import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, User, FileText } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import type { Member } from "../../types";
import Button from "../ui/Button";

interface MembershipCardProps {
    member: Member;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ member }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadAsPDF = async () => {
        if (!cardRef.current) return;

        setIsDownloading(true);
        try {
            // Convert images to base64 using fetch and blob to avoid CORS/taint issues
            const imgElements = cardRef.current.querySelectorAll('img');
            const originalSrcs = new Map<HTMLImageElement, string>();

            // Convert each Firebase Storage image to base64
            for (const img of Array.from(imgElements)) {
                if (!img.src || !img.src.includes('firebasestorage')) continue;

                try {
                    // Store original src
                    originalSrcs.set(img as HTMLImageElement, img.src);

                    // Fetch the image as a blob
                    const response = await fetch(img.src, {
                        mode: 'cors',
                        credentials: 'omit'
                    });

                    if (!response.ok) {
                        console.warn('Failed to fetch image:', response.status);
                        continue;
                    }

                    const blob = await response.blob();

                    // Convert blob to base64
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    // Replace image src with base64
                    img.src = base64;
                } catch (e) {
                    console.warn('Failed to convert image to base64:', e);
                }
            }

            // Small delay to ensure DOM is updated
            await new Promise(resolve => setTimeout(resolve, 150));

            // Capture the card as canvas with high quality
            const canvas = await html2canvas(cardRef.current, {
                scale: 4, // Higher scale for PDF quality
                useCORS: false,
                allowTaint: false,
                backgroundColor: '#FFFFFF',
                logging: false,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                   // Force the cloned element to be visible and properly sized
                    const clonedElement = clonedDoc.querySelector('[data-card-capture]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.display = 'flex';
                        clonedElement.style.flexDirection = 'row';
                        clonedElement.style.width = '323px';
                        clonedElement.style.height = '204px';

                        // Fix text elements to prevent cutoff
                        const textElements = clonedElement.querySelectorAll('h1, h2, p, span');
                        textElements.forEach((el) => {
                            const htmlEl = el as HTMLElement;
                            // Add extra padding to text elements to prevent cutoff
                            htmlEl.style.paddingBottom = '4px';
                            // Ensure line-height is sufficient
                            const currentLineHeight = window.getComputedStyle(htmlEl).lineHeight;
                            if (currentLineHeight === 'normal' || parseFloat(currentLineHeight) < 1.2) {
                                htmlEl.style.lineHeight = '2.8';
                            }
                        });

                        // Resize QR code for download
                        // const qrImage = clonedElement.querySelector('[data-qr-code]') as HTMLImageElement;
                        // if (qrImage) {
                        //     qrImage.style.width = '2rem'; // w-8
                        //     qrImage.style.height = '2rem'; // h-8
                        // }
                    }
                }
            });

            // Restore original image sources
            originalSrcs.forEach((src, img) => {
                img.src = src;
            });

            // Create PDF in credit card dimensions (85.6mm x 53.98mm)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [85.6, 53.98] // ISO/IEC 7810 ID-1 standard (credit card size)
            });

            // Convert canvas to image and add to PDF
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98, '', 'FAST');

            // Download the PDF
            pdf.save(`inkuthazo-membership-${member.full_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
        } catch (error) {
            console.error("Error generating membership card PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadCard = async () => {
        if (!cardRef.current) return;

        setIsDownloading(true);
        try {
            // Convert images to base64 using fetch and blob to avoid CORS/taint issues
            const imgElements = cardRef.current.querySelectorAll('img');
            const originalSrcs = new Map<HTMLImageElement, string>();

            // Convert each Firebase Storage image to base64
            for (const img of Array.from(imgElements)) {
                if (!img.src || !img.src.includes('firebasestorage')) continue;

                try {
                    // Store original src
                    originalSrcs.set(img as HTMLImageElement, img.src);

                    // Fetch the image as a blob
                    const response = await fetch(img.src, {
                        mode: 'cors',
                        credentials: 'omit'
                    });

                    if (!response.ok) {
                        console.warn('Failed to fetch image:', response.status);
                        continue;
                    }

                    const blob = await response.blob();

                    // Convert blob to base64
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    // Replace image src with base64
                    img.src = base64;
                } catch (e) {
                    console.warn('Failed to convert image to base64:', e);
                    // Continue without converting this image
                }
            }

            // Small delay to ensure DOM is updated
            await new Promise(resolve => setTimeout(resolve, 150));

            // Use a scale for better resolution and specific window size to prevent cutting
            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // Optimal scale for quality vs performance
                useCORS: false,
                allowTaint: false,
                backgroundColor: '#FFFFFF', // Fallback background color
                logging: false,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                    // Force the cloned element to be visible and properly sized
                    const clonedElement = clonedDoc.querySelector('[data-card-capture]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.display = 'flex';
                        clonedElement.style.flexDirection = 'row';
                        clonedElement.style.width = '323px';
                        clonedElement.style.height = '204px';

                        // Fix text elements to prevent cutoff
                        const textElements = clonedElement.querySelectorAll('h1, h2, p, span');
                        textElements.forEach((el) => {
                            const htmlEl = el as HTMLElement;
                            // Add extra padding to text elements to prevent cutoff
                            htmlEl.style.paddingBottom = '4px';
                            // Ensure line-height is sufficient
                            const currentLineHeight = window.getComputedStyle(htmlEl).lineHeight;
                            if (currentLineHeight === 'normal' || parseFloat(currentLineHeight) < 1.2) {
                                htmlEl.style.lineHeight = '2.8';
                            }
                        });

                        // Resize QR code for download
                        // const qrImage = clonedElement.querySelector('[data-qr-code]') as HTMLImageElement;
                        // if (qrImage) {
                        //     qrImage.style.width = '2rem'; // w-8
                        //     qrImage.style.height = '2rem'; // h-8
                        // }
                    }
                }
            });

            // Restore original image sources
            originalSrcs.forEach((src, img) => {
                img.src = src;
            });

            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `inkuthazo-membership-${member.full_name.replace(/\s+/g, "-").toLowerCase()}.png`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error("Error generating membership card image:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const memberId = member.id.substring(0, 8).toUpperCase();

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            {/* Card Preview Container - Credit Card Size (85.6mm x 53.98mm in landscape) */}
            <div
                ref={cardRef}
                data-card-capture
                className="w-full bg-white rounded-lg shadow-xl overflow-hidden border border-amber-700/70 flex"
                style={{
                    maxWidth: '323px', // 85.6mm = ~323px at 96dpi
                    height: '204px', // 53.98mm = ~204px at 96dpi
                }}
            >
                {/* Left Panel */}
                <div className="flex-1 flex flex-col">
                    {/* Top Bar */}
                    <div className="bg-teal-800 text-white px-2 py-1 flex items-center gap-1.5">
                        <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-white/95 overflow-hidden">
                            <img
                                src="/logo.png"
                                alt="Inkuthazo Logo"
                                className="h-4 w-4 object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-[11px] font-bold tracking-tight leading-tight">
                                INKUTHAZO SOCIAL CLUB
                            </h1>
                            <p className="text-[7px] text-teal-100 font-medium tracking-tight leading-tight">
                                "Inhlangano inamandla"- Unity is Strength
                            </p>
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 px-2 py-1.5 flex gap-10">
                        {/* Left: Member Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div className="space-y-1">
                                <div>
                                    <p className="text-[8px] font-medium text-slate-500 uppercase">Member Name</p>
                                    <p className="text-[11px] font-semibold text-slate-900 ">
                                        {member.full_name}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-medium text-slate-500 uppercase">Member No.</p>
                                        <p className="text-[10px] font-semibold tracking-tight text-slate-900">
                                            {memberId}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-medium text-slate-500 uppercase">Since</p>
                                        <p className="text-[10px] font-semibold tracking-tight text-slate-900">
                                            {format(member.join_date.toDate(), "MMMM yyyy")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-medium text-slate-500 uppercase leading-tight">Tier</p>
                                        <div className="flex items-center gap-0.5">
                                            <p className="text-[10px] font-semibold tracking-tight text-amber-700 capitalize leading-tight truncate">
                                                {member.role === 'admin' ? 'Admin' : member.role === 'dc_member' ? 'DC' : 'Member'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-medium text-slate-500 uppercase leading-tight">Status</p>
                                        <p className="text-[10px] font-semibold tracking-tight text-slate-900 capitalize leading-tight truncate">
                                            {member.status === 'approved' ? 'Active' : member.status}
                                            {/* {member.status} */}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-0.5 border-t border-slate-200">
                                <p className="text-[6px] text-slate-600 leading-tight truncate">
                                    {member.phone}
                                </p>
                                <p className="text-[6px] font-medium text-slate-600 leading-tight truncate">
                                www.inkuthazo.netlify.app
                                </p>
                            </div>
                        </div>

                        {/* Member Photo */}
                        {member.avatar_url ? (
                            <div className="flex items-center justify-center w-14 h-14 bg-slate-50 rounded border border-slate-100/80 overflow-hidden flex-shrink-0">
                                <img
                                    src={member.avatar_url}
                                    alt={member.full_name}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-14 h-14 bg-slate-50 rounded border border-slate-100/80 flex-shrink-0">
                                <div className="text-center opacity-40">
                                    <span className="text-xl font-semibold text-slate-500">
                                        {member.full_name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - QR Code */}
                <div className="w-20 border-l border-amber-700/60 bg-slate-50 flex flex-col justify-between flex-shrink-0">
                    <div className="flex-1 flex items-center justify-center p-1.5">
                        {/* QR Code */}
                        <div className="relative rounded border border-teal-800 bg-white p-1">
                            <img
                                data-qr-code
                                src="/qrcode.png"
                                alt="Membership QR Code"
                                className="w-16 h-16 object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>
                    </div>

                    <div className="px-1 pb-1 text-center">
                        <p className="text-[6px] font-medium tracking-tight text-slate-700 leading-tight">
                            Scan for more information
                        </p>
                       
                    </div>
                </div>
            </div>

            {/* Download Actions */}
            <div className="w-full max-w-[323px] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={downloadAsPDF}
                        className="py-4 group hover:shadow-lg transition-all"
                        variant="primary"
                        icon={FileText}
                        disabled={isDownloading}
                    >
                        {isDownloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                    <Button
                        onClick={downloadCard}
                        className="py-4 group hover:shadow-lg transition-all"
                        variant="secondary"
                        icon={Download}
                        disabled={isDownloading}
                    >
                        Download PNG
                    </Button>
                </div>
                <p className="text-center text-xs text-text-secondary dark:text-text-secondary-dark px-4">
                    Download as PDF for best quality and easy printing or PNG for quick digital sharing. Credit card size (85.6mm x 53.98mm).
                </p>
            </div>
        </div>
    );
};

export default MembershipCard;
