const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { storageDirectory } = require('../repositories/fileRepository');

const defaultMaxFileSize = 10 * 1024 * 1024;
const configuredMaxFileSize = process.env.MAX_FILE_SIZE_BYTES === undefined
  ? defaultMaxFileSize
  : Number(process.env.MAX_FILE_SIZE_BYTES);

if (!Number.isSafeInteger(configuredMaxFileSize) || configuredMaxFileSize <= 0) {
  throw new Error('A variável MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: configuredMaxFileSize },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;