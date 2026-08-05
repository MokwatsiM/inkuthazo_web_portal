import type { jsPDF } from "jspdf";

export interface PdfPreview {
  /** Object URL for the PDF blob — feed to an iframe/new tab. */
  url: string;
  filename: string;
  /** Revoke the object URL when the preview is closed. */
  revoke: () => void;
}

/**
 * Turn a generated jsPDF doc into a previewable blob URL. Remember to call
 * `revoke()` when done (e.g. when the preview modal closes) to free memory.
 */
export const createPdfPreview = (doc: jsPDF, filename: string): PdfPreview => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  return {
    url,
    filename,
    revoke: () => URL.revokeObjectURL(url),
  };
};

/** Directly download a generated doc without previewing. */
export const savePdf = (doc: jsPDF, filename: string): void => {
  doc.save(filename);
};
