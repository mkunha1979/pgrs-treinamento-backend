const express = require('express');
const router = express.Router();
const { emitir, baixarPDF } = require('../controllers/certificadoController');
const { verificarToken } = require('../middlewares/auth');

router.post('/emitir', verificarToken, emitir);
router.get('/:codigo/pdf', baixarPDF); // PDF público (validável por qualquer um com o código)

module.exports = router;