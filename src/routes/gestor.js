const express = require('express');
const router = express.Router();
const { visaoGeral, progressoUsuarios, relatorioPDF } = require('../controllers/gestorController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

// Apenas admin e gestor acessam o painel
router.get('/visao-geral', verificarToken, verificarPerfil('admin', 'gestor'), visaoGeral);
router.get('/progresso-usuarios', verificarToken, verificarPerfil('admin', 'gestor'), progressoUsuarios);
router.get('/relatorio-pdf', verificarToken, verificarPerfil('admin', 'gestor'), relatorioPDF);

module.exports = router;