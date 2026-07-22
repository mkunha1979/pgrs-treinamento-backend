const pool = require('../config/database');

// Registra uma ação no log de acessos
// Não trava a aplicação se falhar — log é secundário
const registrarLog = async (usuario_id, acao, detalhes = {}) => {
  try {
    await pool.query(
      `INSERT INTO log_acessos (usuario_id, acao, detalhes)
       VALUES ($1, $2, $3)`,
      [usuario_id, acao, JSON.stringify(detalhes)]
    );
  } catch (erro) {
    console.error('Erro ao registrar log:', erro.message);
    // Não relança o erro — o log não deve quebrar a operação principal
  }
};

module.exports = { registrarLog };