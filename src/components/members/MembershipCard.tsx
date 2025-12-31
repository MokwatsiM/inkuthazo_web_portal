import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { Download, ShieldCheck, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import type { Member } from "../../types";
import Button from "../ui/Button";

interface MembershipCardProps {
    member: Member;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ member }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

    // Convert avatar URL to data URL to avoid CORS issues
    useEffect(() => {
        const convertImageToDataUrl = async () => {
            if (!member.avatar_url) {
                setAvatarDataUrl(null);
                return;
            }

            try {
                const response = await fetch(member.avatar_url);
                const blob = await response.blob();
                const reader = new FileReader();

                reader.onloadend = () => {
                    setAvatarDataUrl(reader.result as string);
                };

                reader.readAsDataURL(blob);
            } catch (error) {
                console.error('Error converting avatar to data URL:', error);
                setAvatarDataUrl(null);
            }
        };

        convertImageToDataUrl();
    }, [member.avatar_url]);

    const downloadCard = async () => {
        if (!cardRef.current) return;

        try {
            // Wait for all images to load before capturing
            const images = cardRef.current.querySelectorAll('img');
            await Promise.all(
                Array.from(images).map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        // Set a timeout to prevent hanging
                        setTimeout(reject, 5000);
                    });
                })
            ).catch(() => {
                console.warn('Some images failed to load');
            });

            // Use a scale for better resolution and specific window size to prevent cutting
            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // Optimal scale for quality vs performance
                useCORS: true,
                allowTaint: false, // Changed to false for better CORS handling
                backgroundColor: '#4F46E5', // Fallback background color
                logging: false,
                imageTimeout: 15000, // Increased timeout for image loading
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
                <div className="relative h-full flex flex-col p-6 text-white box-border">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
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
                    <div className="flex items-center gap-5 mt-auto">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg bg-indigo-800/50">
                                {avatarDataUrl ? (
                                    <img
                                        src={avatarDataUrl}
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : member.avatar_url ? (
                                    <img
                                        src={member.avatar_url}
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
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
                    <div className="mt-6 flex justify-between items-end border-t border-white/20 pt-4">
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

            {/* Download Action */}
            <div className="w-full max-w-[400px]">
                <Button
                    onClick={downloadCard}
                    className="w-full py-4 group hover:shadow-lg transition-all"
                    variant="primary"
                    icon={Download}
                >
                    Download Digital Card
                </Button>
                <p className="text-center text-xs text-text-secondary dark:text-text-secondary-dark mt-3 px-4">
                    Save this card to your device to verify your membership offline.
                </p>
            </div>
        </div>
    );
};

export default MembershipCard;
