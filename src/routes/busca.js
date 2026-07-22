const express = require('express');
const router = express.Router();
const { buscar } = require('../controllers/buscaController');
const { verificarToken } = require('../middlewares/auth');

router.get('/', verificarToken, buscar);

module.exports = router;