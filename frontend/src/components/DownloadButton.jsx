import { useState } from 'react';

export default function DownloadButton({ document, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    await onDownload(document);
    setIsDownloading(false);
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={`Baixar ${document.originalName}`}
    >
      {isDownloading ? 'Baixando...' : 'Baixar'}
      <span aria-hidden="true">↓</span>
    </button>
  );
}