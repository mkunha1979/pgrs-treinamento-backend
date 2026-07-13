const express = require('express');
const router = express.Router();
const { marcarConcluida, desmarcarConcluida, progressoTrilha } = require('../controllers/progressoController');
const { verificarToken } = require('../middlewares/auth');

// Todas as rotas exigem login (cada usuário só mexe no próprio progresso)
router.post('/concluir', verificarToken, marcarConcluida);
router.post('/desmarcar', verificarToken, desmarcarConcluida);
router.get('/trilha/:trilha_id', verificarToken, progressoTrilha);

module.exports = router;