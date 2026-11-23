import { useState } from 'react';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    const uploaded = await onUpload(file);
    setIsUploading(false);

    if (uploaded) {
      setFile(null);
      form.reset();
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="upload-heading">
        <div>
          <p className="eyebrow">ENTRADA</p>
          <h2 id="upload-title">Adicionar documento</h2>
        </div>
        <span className="upload-index">01</span>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker" htmlFor="document-file">
          <input
            id="document-file"
            className="visually-hidden"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <span className="file-picker-action">Selecionar arquivo</span>
          <span className="file-picker-name">
            {file ? file.name : 'Nenhum arquivo selecionado'}
          </span>
          {file && <span className="file-picker-size">{formatFileSize(file.size)}</span>}
        </label>
        <button className="primary-button" type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
    </section>
  );
}