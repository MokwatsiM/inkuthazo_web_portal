import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, ShieldCheck, Calendar, User, FileText } from "lucide-react";
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
                backgroundColor: '#4F46E5',
                logging: false,
                imageTimeout: 15000,
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
                backgroundColor: '#4F46E5', // Fallback background color
                logging: false,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                    // Force the cloned element to be visible and properly sized
                    const clonedElement = clonedDoc.querySelector('[data-card-capture]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.display = 'block';
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
            {/* Card Preview Container */}
            <div
                ref={cardRef}
                data-card-capture
                className="relative w-full max-w-[400px] h-[250px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02] flex flex-col"
            >
                {/* Premium Gradient Background - Using a solid fallback for canvas */}
                <div className="absolute inset-0 bg-indigo-900 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900"></div>

                {/* Geometric Background Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl opacity-50"></div>

                {/* Card Content Overlay - Added Padding to prevent cutting */}
                <div className="relative h-full flex flex-col p-5 text-white box-border">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            {/* Replaced backdrop-blur with solid opacity for canvas compatibility */}
                            <div className="p-2 bg-white/20 rounded-lg flex items-center justify-center border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg tracking-tight leading-none">INKUTHAZO</h3>
                                <span className="text-[10px] font-medium tracking-[0.2em] text-indigo-200 mt-1">SOCIAL CLUB</span>
                            </div>
                        </div>
                        {/* Replaced backdrop-blur with solid opacity for canvas compatibility */}
                        <div className="bg-white/20 px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center">
                            Digital Member
                        </div>
                    </div>

                    {/* Main Info Section */}
                    <div className="flex items-center gap-5 flex-1 py-2">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg bg-indigo-800/50">
                                {member.avatar_url ? (
                                    <img
                                        src={member.avatar_url}
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-indigo-600/50">
                                        {member.full_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm"></div>
                        </div>

                        {/* Member Details */}
                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                            <h4 className="text-xl font-bold leading-tight mb-2 break-words line-clamp-2">
                                {member.full_name}
                            </h4>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-white/80 text-[10px] font-semibold uppercase tracking-widest">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{member.role}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-[10px] font-semibold uppercase tracking-widest">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Joined {format(member.join_date.toDate(), "MMM yyyy")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between items-end border-t border-white/20 pt-3">
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Member ID</p>
                            <p className="text-sm font-mono font-bold tracking-[0.2em] text-white">
                                #{memberId}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="h-1 w-20 bg-white/20 rounded-full mb-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Verified</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Actions */}
            <div className="w-full max-w-[400px] space-y-3">
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
                    Download as PDF for best quality or PNG for quick sharing. PDF format is credit card sized for easy printing.
                </p>
            </div>
        </div>
    );
};

export default MembershipCard;
