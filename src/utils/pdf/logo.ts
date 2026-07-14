import { jsPDF } from "jspdf";
import logger from "../logger";

/**
 * Shared club-logo helpers for PDF generation (invoices, statements).
 * The logo is cached after the first load and preloaded in the browser.
 */

let logoCache: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

export const loadLogo = async (): Promise<HTMLImageElement> => {
  if (logoCache) {
    return logoCache;
  }

  if (logoLoadPromise) {
    return logoLoadPromise;
  }

  logoLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();

    const timeout = setTimeout(() => {
      reject(new Error("Logo loading timeout"));
    }, 2000); // 2 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      logoCache = img;
      resolve(img);
    };

    img.onerror = (e) => {
      clearTimeout(timeout);
      logger.error("Error loading logo:", e);
      reject(e);
    };

    img.src = "/logo.png";
  });

  return logoLoadPromise;
};

// Preload logo when module loads (browser only)
if (typeof window !== "undefined") {
  loadLogo().catch(() => {
    // Ignore errors during preload
  });
}

/** Draw the logo in the top-right corner (max 32mm wide, aspect kept). */
export const addLogo = async (doc: jsPDF): Promise<void> => {
  try {
    const img = await loadLogo();

    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = 32;
    const aspectRatio = img.width / img.height;
    const width = maxWidth;
    const height = width / aspectRatio;

    const x = pageWidth - width - 10;
    const y = 7;

    doc.addImage(img, "PNG", x, y, width, height);
  } catch (error) {
    logger.error("Error adding logo to PDF:", error);
    // Continue without logo if it fails to load
  }
};
