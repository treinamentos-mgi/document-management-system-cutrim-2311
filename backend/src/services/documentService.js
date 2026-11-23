const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const fileRepository = require('../repositories/fileRepository');

function getSafeOriginalName(originalName) {
  const fileName = path.posix.basename(String(originalName).replace(/\\/g, '/'));
  const safeName = fileName.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return safeName || 'document';
}

function toPublicDocument({ storagePath, ...document }) {
  return document;
}

async function createDocument(file) {
  const document = {
    id: randomUUID(),
    originalName: getSafeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'default',
    storagePath: file.path,
  };

  try {
    documentRepository.save(document);
  } catch (error) {
    await fileRepository.remove(document.storagePath).catch(() => {});
    throw error;
  }

  return toPublicDocument(document);
}

function listDocuments() {
  return documentRepository.findAll().map(toPublicDocument);
}

function getDownload(id) {
  const document = documentRepository.findById(id);

  if (!document) {
    return null;
  }

  return {
    filePath: document.storagePath,
    originalName: document.originalName,
  };
}

module.exports = { createDocument, listDocuments, getDownload };