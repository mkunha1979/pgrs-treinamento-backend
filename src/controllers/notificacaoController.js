const pool = require('../config/database');

// Listar notificações do usuário logado
const listar = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const resultado = await pool.query(
      `SELECT * FROM notificacoes
       WHERE usuario_id = $1
       ORDER BY criado_em DESC
       LIMIT 50`,
      [usuario_id]
    );

    // Conta quantas não foram lidas
    const naoLidas = resultado.rows.filter(n => !n.lida).length;

    res.json({
      nao_lidas: naoLidas,
      notificacoes: resultado.rows
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Marcar uma notificação como lida
const marcarLida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const resultado = await pool.query(
      `UPDATE notificacoes SET lida = true
       WHERE id = $1 AND usuario_id = $2
       RETURNING *`,
      [id, usuario_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Notificação não encontrada' });
    }
    res.json({ mensagem: 'Notificação marcada como lida' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Marcar todas como lidas
const marcarTodasLidas = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    await pool.query(
      `UPDATE notificacoes SET lida = true WHERE usuario_id = $1 AND lida = false`,
      [usuario_id]
    );
    res.json({ mensagem: 'Todas as notificações marcadas como lidas' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, marcarLida, marcarTodasLidas };