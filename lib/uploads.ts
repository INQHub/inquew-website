import { randomUUID } from "node:crypto";

// Client documents and case-study images live in the existing private
// "deliverable-files" bucket under their own prefixes, so no new bucket is needed.
export const CLIENT_UPLOAD_PREFIX = "client-uploads";
export const CASE_STUDY_PREFIX = "case-studies";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "txt", "png", "jpg", "jpeg", "webp"];
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

export function extensionOf(fileName: string) {
  return (fileName.split(".").pop() ?? "").toLowerCase();
}

export function isAllowedUpload(fileName: string) {
  return ALLOWED_EXTENSIONS.includes(extensionOf(fileName));
}

export function isAllowedImage(fileName: string) {
  return IMAGE_EXTENSIONS.includes(extensionOf(fileName));
}

/** Keeps the readable part of a file name but strips anything that could act as a path. */
export function safeFileName(fileName: string) {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(-120) || "file";
}

export function clientUploadPath(userId: string, fileName: string) {
  return `${CLIENT_UPLOAD_PREFIX}/${userId}/${randomUUID()}-${safeFileName(fileName)}`;
}

export function caseStudyImagePath(fileName: string) {
  return `${CASE_STUDY_PREFIX}/${randomUUID()}-${safeFileName(fileName)}`;
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
