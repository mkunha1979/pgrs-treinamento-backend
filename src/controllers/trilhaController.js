const pool = require('../config/database');

// Criar trilha
const criar = async (req, res) => {
  try {
    const { titulo, descricao, perfil_alvo } = req.body;
    const resultado = await pool.query(
      `INSERT INTO trilhas (titulo, descricao, perfil_alvo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [titulo, descricao, perfil_alvo]
    );
    res.status(201).json({
      mensagem: 'Trilha criada com sucesso',
      trilha: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Listar trilhas — filtra por perfil do usuário logado
const listar = async (req, res) => {
  try {
    const perfilUsuario = req.usuario.perfil;

    let resultado;
    // Admin e gestor veem todas as trilhas
    if (perfilUsuario === 'admin' || perfilUsuario === 'gestor') {
      resultado = await pool.query('SELECT * FROM trilhas ORDER BY criado_em DESC');
    } else {
      // Servidor/terceirizado veem apenas trilhas publicadas do seu perfil ou "todos"
      resultado = await pool.query(
        `SELECT * FROM trilhas
         WHERE status = 'publicada'
         AND (perfil_alvo = $1 OR perfil_alvo = 'todos')
         ORDER BY criado_em DESC`,
        [perfilUsuario]
      );
    }
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar trilha por ID
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM trilhas WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Trilha não encontrada' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar trilha
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, perfil_alvo, status } = req.body;
    const resultado = await pool.query(
      `UPDATE trilhas
       SET titulo = $1, descricao = $2, perfil_alvo = $3, status = $4, atualizado_em = NOW()
       WHERE id = $5
       RETURNING *`,
      [titulo, descricao, perfil_alvo, status, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Trilha não encontrada' });
    }
    res.json({ mensagem: 'Trilha atualizada', trilha: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Excluir trilha
const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'DELETE FROM trilhas WHERE id = $1 RETURNING id',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Trilha não encontrada' });
    }
    res.json({ mensagem: 'Trilha excluída com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Alterar status da trilha (publicar / arquivar / voltar a rascunho)
const alterarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ['rascunho', 'publicada', 'arquivada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        erro: `Status inválido. Use: ${statusValidos.join(', ')}`
      });
    }

    const resultado = await pool.query(
      `UPDATE trilhas SET status = $1, atualizado_em = NOW()
       WHERE id = $2 RETURNING id, titulo, status`,
      [status, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Trilha não encontrada' });
    }

    res.json({
      mensagem: `Trilha ${status} com sucesso`,
      trilha: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { criar, listar, buscarPorId, atualizar, excluir, alterarStatus };