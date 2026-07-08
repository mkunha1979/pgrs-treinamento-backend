const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const listar = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, email, perfil, setor, ativo, criado_em
       FROM usuarios ORDER BY criado_em DESC`
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `SELECT id, nome, email, perfil, setor, ativo, criado_em
       FROM usuarios WHERE id = $1`,
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, perfil, setor } = req.body;
    const resultado = await pool.query(
      `UPDATE usuarios
       SET nome = $1, perfil = $2, setor = $3, atualizado_em = NOW()
       WHERE id = $4
       RETURNING id, nome, email, perfil, setor, ativo`,
      [nome, perfil, setor, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json({ mensagem: 'Usuário atualizado', usuario: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const desativar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `UPDATE usuarios SET ativo = false, atualizado_em = NOW()
       WHERE id = $1 RETURNING id, nome, ativo`,
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json({ mensagem: 'Usuário desativado', usuario: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, buscarPorId, atualizar, desativar };