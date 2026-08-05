import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Download, ExternalLink } from "lucide-react";
import Button from "../ui/Button";

interface PdfPreviewModalProps {
  /** Object URL for the generated PDF blob (from URL.createObjectURL). */
  url: string;
  /** Suggested download filename, e.g. "june-report.pdf". */
  filename: string;
  onClose: () => void;
}

/** Coarse mobile check — mobile browsers can't render PDFs in an iframe. */
const isMobile = (): boolean =>
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/**
 * Full-screen modal that previews a generated PDF in an embedded viewer before
 * the user downloads it. On mobile (where iframes can't render PDFs) it shows
 * an "Open in new tab" action instead, which uses the browser's native viewer.
 */
const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  url,
  filename,
  onClose,
}) => {
  const mobile = isMobile();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Rendered in a portal on <body> so `fixed inset-0` fills the whole
  // viewport. Without this, a transformed ancestor (e.g. the statement Modal,
  // which uses `transform`) would trap the fixed element inside its small box.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${filename}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-surface-dark px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
          {filename}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {mobile && (
            <Button
              variant="secondary"
              icon={ExternalLink}
              onClick={openInNewTab}
              className="!py-1.5"
            >
              Open
            </Button>
          )}
          <Button icon={Download} onClick={handleDownload} className="!py-1.5">
            Download
          </Button>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 bg-gray-100 dark:bg-gray-900">
        {mobile ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
              Preview isn't supported in mobile browsers. Open the document in a
              new tab to view it, or download it directly.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" icon={ExternalLink} onClick={openInNewTab}>
                Open in new tab
              </Button>
              <Button icon={Download} onClick={handleDownload}>
                Download
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            src={url}
            title={`Preview of ${filename}`}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default PdfPreviewModal;
