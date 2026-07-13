const express = require('express');
const router = express.Router();
const { criar, listarPorTrilha, buscarPorId, atualizar, excluir, alterarStatus } = require('../controllers/moduloController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

// Listar módulos de uma trilha — qualquer usuário logado
router.get('/trilha/:trilha_id', verificarToken, listarPorTrilha);
router.get('/:id', verificarToken, buscarPorId);

// Criar, atualizar, excluir — apenas admin e gestor
router.post('/', verificarToken, verificarPerfil('admin', 'gestor'), criar);
router.put('/:id', verificarToken, verificarPerfil('admin', 'gestor'), atualizar);
router.delete('/:id', verificarToken, verificarPerfil('admin', 'gestor'), excluir);

router.patch('/:id/status', verificarToken, verificarPerfil('admin', 'gestor'), alterarStatus);

module.exports = router;