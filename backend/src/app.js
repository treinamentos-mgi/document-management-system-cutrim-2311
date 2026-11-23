// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error('A variável PORT deve ser um número entre 0 e 65535.');
}

app.use(express.json());
app.use(documentRoutes);

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) são registradas pelo roteador de documentos.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Erro interno do servidor.';

  if (error.name === 'MulterError') {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'O arquivo excede o limite permitido.'
      : 'Não foi possível processar o upload.';
  } else if (error.status === 404 && error.code === 'DOCUMENT_NOT_FOUND') {
    status = 404;
    code = 'DOCUMENT_NOT_FOUND';
    message = 'Documento não encontrado.';
  } else if (error.status === 400 && error.code === 'FILE_REQUIRED') {
    status = 400;
    code = 'FILE_REQUIRED';
    message = 'Envie um arquivo no campo file.';
  }

  return res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
