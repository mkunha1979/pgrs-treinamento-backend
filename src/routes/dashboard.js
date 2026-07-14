const express = require('express');
const router = express.Router();
const { dashboardUsuario } = require('../controllers/dashboardController');
const { verificarToken } = require('../middlewares/auth');

router.get('/', verificarToken, dashboardUsuario);

module.exports = router;