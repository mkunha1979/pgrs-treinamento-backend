const express = require('express');
const router = express.Router();
const { criar, listarPorModulo, buscarPorId, atualizar, excluir } = require('../controllers/aulaController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

// Listar e buscar — qualquer usuário logado
router.get('/modulo/:modulo_id', verificarToken, listarPorModulo);
router.get('/:id', verificarToken, buscarPorId);

// Criar, atualizar, excluir — apenas admin e gestor
router.post('/', verificarToken, verificarPerfil('admin', 'gestor'), criar);
router.put('/:id', verificarToken, verificarPerfil('admin', 'gestor'), atualizar);
router.delete('/:id', verificarToken, verificarPerfil('admin', 'gestor'), excluir);

module.exports = router;