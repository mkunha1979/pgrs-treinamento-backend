const express = require('express');
const router = express.Router();
const { criar, listar, buscarPorId, atualizar, excluir, alterarStatus } = require('../controllers/trilhaController');
const { verificarToken } = require('../middlewares/auth');
const { verificarPerfil } = require('../middlewares/verificarPerfil');

// Listar e buscar: qualquer usuário logado (o filtro por perfil é feito no controller)
router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, buscarPorId);

// Criar, atualizar, excluir: apenas admin e gestor
router.post('/', verificarToken, verificarPerfil('admin', 'gestor'), criar);
router.put('/:id', verificarToken, verificarPerfil('admin', 'gestor'), atualizar);
router.delete('/:id', verificarToken, verificarPerfil('admin', 'gestor'), excluir);

// Publicar / arquivar trilha
router.patch('/:id/status', verificarToken, verificarPerfil('admin', 'gestor'), alterarStatus);

module.exports = router;