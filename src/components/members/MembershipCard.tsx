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
                scale: 2, // Higher scale for PDF quality
                useCORS: false,
                allowTaint: false,
                backgroundColor: '#FAF9F6',
                logging: false,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                    // Fix text rendering issues in the cloned document
                    const clonedElement = clonedDoc.querySelector('[data-card-capture]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.display = 'block';

                        // Fix text elements to prevent cutoff
                        const textElements = clonedElement.querySelectorAll('h4, p, span');
                        textElements.forEach((el) => {
                            const htmlEl = el as HTMLElement;
                            // Add extra padding to text elements to prevent cutoff
                            htmlEl.style.paddingBottom = '8px';
                            // Ensure line-height is sufficient
                            const currentLineHeight = window.getComputedStyle(htmlEl).lineHeight;
                            if (currentLineHeight === 'normal' || parseFloat(currentLineHeight) < 1.2) {
                                htmlEl.style.lineHeight = '1.8';
                            }
                        });
                    }
                }
            });

            // Restore original image sources
            originalSrcs.forEach((src, img) => {
                img.src = src;
            });

            // Create PDF in A4 landscape dimensions for the larger card
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4' // A4 landscape (297mm x 210mm)
            });

            // Calculate dimensions to fit card on page with margins
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const cardWidth = pageWidth - (margin * 2);
            const cardHeight = (canvas.height / canvas.width) * cardWidth;

            // Center the card vertically if there's extra space
            const yOffset = cardHeight < (pageHeight - margin * 2)
                ? (pageHeight - cardHeight) / 2
                : margin;

            // Convert canvas to image and add to PDF
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', margin, yOffset, cardWidth, cardHeight, '', 'FAST');

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
                backgroundColor: '#FAF9F6', // Fallback background color
                logging: false,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                    // Force the cloned element to be visible and properly sized
                    const clonedElement = clonedDoc.querySelector('[data-card-capture]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.display = 'block';

                        // Fix text elements to prevent cutoff
                        const textElements = clonedElement.querySelectorAll('h4, p, span');
                        textElements.forEach((el) => {
                            const htmlEl = el as HTMLElement;
                            // Add extra padding to text elements to prevent cutoff
                            htmlEl.style.paddingBottom = '8px';
                            // Ensure line-height is sufficient
                            const currentLineHeight = window.getComputedStyle(htmlEl).lineHeight;
                            if (currentLineHeight === 'normal' || parseFloat(currentLineHeight) < 1.2) {
                                htmlEl.style.lineHeight = '1.8';
                            }
                        });
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
        }
    };

    const memberId = member.id.substring(0, 8).toUpperCase();

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            {/* Card Preview Container - New Design */}
            <div
                ref={cardRef}
                data-card-capture
                className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border border-amber-700/70 flex flex-col md:flex-row"
            >
                {/* Left Panel */}
                <div className="flex-1 flex flex-col">
                    {/* Top Bar */}
                    <div className="bg-teal-800 text-white px-6 sm:px-10 py-5 flex items-start gap-4 md:gap-6">
                        <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-white/95 overflow-hidden">
                            <img
                                src="/logo.png"
                                alt="Inkuthazo Logo"
                                className="h-12 w-12 object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>

                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
                                INKUTHAZO SOCIAL CLUB
                            </h1>
                            <p className="text-xs sm:text-sm mt-1 text-teal-100 font-medium tracking-tight">
                                "Inhlangano inamandla" – Unity is Strength
                            </p>
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 px-6 sm:px-10 py-6 sm:py-8 flex flex-col gap-6">
                        {/* Top Member Info */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">Member Name</p>
                                    <p className="text-lg sm:text-xl font-semibold text-slate-900">
                                        {member.full_name}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-start sm:gap-12 gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase">Member No.</p>
                                        <p className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                                            #{memberId}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase">Member Since</p>
                                        <p className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                                            {format(member.join_date.toDate(), "MMMM yyyy")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Member Photo */}
                            {member.avatar_url ? (
                                <div className="hidden md:flex items-center justify-center w-40 h-32 bg-slate-50 rounded-xl border border-slate-100/80 overflow-hidden">
                                    <img
                                        src={member.avatar_url}
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            ) : (
                                <div className="hidden md:flex items-center justify-center w-40 h-32 bg-slate-50 rounded-xl border border-slate-100/80">
                                    <div className="text-center opacity-40">
                                        <div className="h-16 w-16 rounded-full border border-slate-300 mx-auto flex items-center justify-center bg-slate-200">
                                            <span className="text-2xl font-semibold text-slate-500">
                                                {member.full_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tier + Validity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                            <div className="space-y-3">
                                <p className="text-xs font-medium text-slate-500 uppercase">Membership Tier</p>
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                                    <p className="text-lg sm:text-xl font-semibold tracking-tight text-amber-700 capitalize">
                                        {member.role === 'admin' ? 'Administrator' : member.role === 'dc_member' ? 'DC Member' : 'Member'}
                                    </p>
                                </div>
                                <div className="h-px bg-amber-700 mt-2 w-40 sm:w-52"></div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                                <p className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 capitalize">
                                    {member.status}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p>
                                Contact: <span className="font-medium">{member.phone}</span>
                            </p>
                            <p className="truncate">
                                <span className="font-medium">https://inkuthazo.netlify.app/</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - QR Code */}
                <div className="w-full md:w-64 lg:w-72 border-t md:border-t-0 md:border-l border-amber-700/60 bg-slate-50 flex flex-col justify-between">
                    <div className="flex-1 flex items-center justify-center px-6 py-8">
                        {/* QR Code */}
                        <div className="relative rounded-2xl border-2 border-teal-800 bg-white p-3 sm:p-4 shadow-sm">
                            <img
                                src="/qrcode.png"
                                alt="Membership QR Code"
                                className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>
                    </div>

                    <div className="px-6 pb-5 pt-2 text-center space-y-1">
                        <p className="text-xs font-medium tracking-tight text-slate-700">
                            Scan for more information
                        </p>
                       
                    </div>
                </div>
            </div>

            {/* Download Actions */}
            <div className="w-full max-w-5xl space-y-3">
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
                    Download as PDF for best quality and easy printing or PNG for quick digital sharing.
                </p>
            </div>
        </div>
    );
};

export default MembershipCard;
