const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const usuarioRoutes = require('./src/routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3001;

const trilhaRoutes = require('./src/routes/trilhas');

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/trilhas', trilhaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', projeto: 'PGRS Treinamentos' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});