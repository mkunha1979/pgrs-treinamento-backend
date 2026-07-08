const express = require('express');
const router = express.Router();
const { listar, buscarPorId, atualizar, desativar } = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

router.get('/', verificarToken, verificarPerfil('admin'), listar);
router.get('/:id', verificarToken, verificarPerfil('admin'), buscarPorId);
router.put('/:id', verificarToken, verificarPerfil('admin'), atualizar);
router.delete('/:id', verificarToken, verificarPerfil('admin'), desativar);

module.exports = router;