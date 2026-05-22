const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota de verificação — confirma que o servidor está rodando
app.get('/health', (req, res) => {
  res.json({ status: 'ok', projeto: 'PGRS Treinamentos' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});