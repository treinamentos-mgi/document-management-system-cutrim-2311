import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import {
  listDocuments,
  uploadDocument,
  downloadDocument,
} from './services/documentApi.js';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    listDocuments(controller.signal)
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setNotice({ type: 'error', message: error.message });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  async function handleUpload(file) {
    setNotice(null);

    try {
      const document = await uploadDocument(file);
      setDocuments((currentDocuments) => [document, ...currentDocuments]);
      setNotice({ type: 'success', message: 'Documento enviado.' });
      return true;
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
      return false;
    }
  }

  async function handleDownload(document) {
    setNotice(null);

    try {
      const { blob, filename } = await downloadDocument(
        document.id,
        document.originalName,
      );
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  async function refreshDocuments() {
    setIsLoading(true);
    setNotice(null);

    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D/</span>
          <span className="brand-name">ARQUIVO <span>LOCAL</span></span>
        </a>
        <span className="workspace-label"><span className="status-dot" /> ESPAÇO PESSOAL</span>
      </header>

      <main className="page-content">
        <section className="page-heading" aria-labelledby="page-title">
          <p className="eyebrow">BIBLIOTECA <span>01 / DOCUMENTOS</span></p>
          <div className="heading-row">
            <h1 id="page-title">Seus documentos<span className="heading-period">.</span></h1>
            <p className="heading-note">ARMAZENAMENTO<br />LOCAL</p>
          </div>
        </section>

        {notice && (
          <div className={`notice notice-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
            <span>{notice.message}</span>
            <button
              className="notice-dismiss"
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        <UploadComponent onUpload={handleUpload} />

        <section className="library-section" aria-labelledby="library-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ARQUIVO</p>
              <h2 id="library-title">Documentos guardados</h2>
            </div>
            <span className="document-count">
              {documents.length.toString().padStart(2, '0')} ITENS
            </span>
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onRetry={refreshDocuments}
            onDownload={handleDownload}
          />
        </section>
      </main>
      <footer className="page-footer">
        <span>DMS <span className="footer-separator">/</span> DOCUMENTOS</span>
        <span>ARMAZENAMENTO LOCAL</span>
      </footer>
    </div>
  );
}