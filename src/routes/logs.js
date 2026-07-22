const express = require('express');
const router = express.Router();
const { listar } = require('../controllers/logController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

// Apenas admin e gestor consultam os logs
router.get('/', verificarToken, verificarPerfil('admin', 'gestor'), listar);

module.exports = router;