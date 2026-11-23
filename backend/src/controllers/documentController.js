const documentService = require('../services/documentService');

async function upload(req, res) {
  if (!req.file) {
    const error = new Error('Arquivo obrigatório.');
    error.status = 400;
    error.code = 'FILE_REQUIRED';
    throw error;
  }

  const document = await documentService.createDocument(req.file);
  return res.status(201).json(document);
}

function list(req, res) {
  return res.status(200).json({ documents: documentService.listDocuments() });
}

function download(req, res, next) {
  const document = documentService.getDownload(req.params.id);

  if (!document) {
    const error = new Error('Documento não encontrado.');
    error.status = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    return next(error);
  }

  return res.download(
    document.filePath,
    document.originalName,
    { headers: { 'Content-Type': 'application/octet-stream' } },
    (error) => {
      if (!error) {
        return;
      }

      if (res.headersSent) {
        return next(error);
      }

      if (error.code === 'ENOENT') {
        error.status = 404;
        error.code = 'DOCUMENT_NOT_FOUND';
        error.message = 'Documento não encontrado.';
      }

      return next(error);
    },
  );
}

module.exports = { upload, list, download };