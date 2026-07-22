const express = require('express');
const router = express.Router();
const { listar, marcarLida, marcarTodasLidas } = require('../controllers/notificacaoController');
const { verificarToken } = require('../middlewares/auth');

router.get('/', verificarToken, listar);
router.patch('/:id/lida', verificarToken, marcarLida);
router.patch('/todas-lidas', verificarToken, marcarTodasLidas);

module.exports = router;