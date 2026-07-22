const express = require('express');
const router = express.Router();
const { listar, exportarCSV } = require('../controllers/logController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

// Apenas admin e gestor consultam os logs
router.get('/', verificarToken, verificarPerfil('admin', 'gestor'), listar);
router.get('/exportar-csv', verificarToken, verificarPerfil('admin', 'gestor'), exportarCSV);

module.exports = router;