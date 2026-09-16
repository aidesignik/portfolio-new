import { IMAGE_EXT_TO_MIME, IMAGE_MIME_TO_EXT } from "./imageTypes";

// Same image types as photo uploads, plus PDF — vehicle registration papers
// and technical inspection certificates are commonly scanned as PDFs.
export const DOCUMENT_MIME_TO_EXT: Record<string, string> = {
  ...IMAGE_MIME_TO_EXT,
  "application/pdf": "pdf",
};

export const DOCUMENT_EXT_TO_MIME: Record<string, string> = {
  ...IMAGE_EXT_TO_MIME,
  pdf: "application/pdf",
};

export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
