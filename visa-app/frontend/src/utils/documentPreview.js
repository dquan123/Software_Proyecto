import { buildApiUrl } from "../config/api";

function isDocumentFileRoute(url) {
  try {
    const parsedUrl = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    );
    return /^\/documentos\/\d+\/archivo$/.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

export function getDocumentPreviewUrl(document) {
  if (!document?.archivo_url) return "";
  if (isDocumentFileRoute(document.archivo_url)) {
    const parsedUrl = new URL(
      document.archivo_url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    );
    return buildApiUrl(parsedUrl.pathname);
  }

  return document.archivo_url.startsWith("/")
    ? buildApiUrl(document.archivo_url)
    : document.archivo_url;
}

export function openDocumentPreview(document) {
  const previewUrl = getDocumentPreviewUrl(document);
  if (!previewUrl) return;
  window.open(previewUrl, "_blank", "noopener,noreferrer");
}
