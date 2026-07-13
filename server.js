const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const usuarioRoutes = require('./src/routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3001;

const trilhaRoutes = require('./src/routes/trilhas');
const moduloRoutes = require('./src/routes/modulos');
const aulaRoutes = require('./src/routes/aulas');
const progressoRoutes = require('./src/routes/progresso');

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/trilhas', trilhaRoutes);
app.use('/api/modulos', moduloRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/progresso', progressoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', projeto: 'PGRS Treinamentos' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});