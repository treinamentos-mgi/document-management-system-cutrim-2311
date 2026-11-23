import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';

function formatUploadDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function DocumentList({ documents, isLoading, onRetry, onDownload }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento ainda.</p>
        <button className="text-button" type="button" onClick={onRetry}>
          Atualizar lista
        </button>
      </div>
    );
  }

  return (
    <ul className="document-list" aria-label="Documentos guardados">
      {documents.map((document, index) => (
        <li className="document-row" key={document.id}>
          <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="document-mark" aria-hidden="true">DOC</span>
          <div className="document-info">
            <span className="document-name" title={document.originalName}>
              {document.originalName}
            </span>
            <span className="document-meta">
              {formatFileSize(document.size)} <span>·</span> {formatUploadDate(document.uploadedAt)}
            </span>
          </div>
          <DownloadButton document={document} onDownload={onDownload} />
        </li>
      ))}
    </ul>
  );
}