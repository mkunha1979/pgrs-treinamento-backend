const pool = require('../config/database');

// Listar logs com filtros opcionais (usuário, ação, período)
const listar = async (req, res) => {
  try {
    const { usuario_id, acao, data_inicio, data_fim } = req.query;

    let query = `
      SELECT l.id, l.acao, l.detalhes, l.criado_em, u.nome, u.email
      FROM log_acessos l
      JOIN usuarios u ON u.id = l.usuario_id
      WHERE 1=1
    `;
    const params = [];

    if (usuario_id) {
      params.push(usuario_id);
      query += ` AND l.usuario_id = $${params.length}`;
    }
    if (acao) {
      params.push(acao);
      query += ` AND l.acao = $${params.length}`;
    }
    if (data_inicio) {
      params.push(data_inicio);
      query += ` AND l.criado_em >= $${params.length}`;
    }
    if (data_fim) {
      params.push(data_fim);
      query += ` AND l.criado_em <= $${params.length}`;
    }

    query += ' ORDER BY l.criado_em DESC LIMIT 100';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar };