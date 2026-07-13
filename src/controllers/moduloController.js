const pool = require('../config/database');

// Criar módulo dentro de uma trilha
const criar = async (req, res) => {
  try {
    const { trilha_id, titulo, descricao, ordem } = req.body;

    // Verifica se a trilha existe antes de criar o módulo
    const trilha = await pool.query('SELECT id FROM trilhas WHERE id = $1', [trilha_id]);
    if (trilha.rows.length === 0) {
      return res.status(404).json({ erro: 'Trilha não encontrada' });
    }

    const resultado = await pool.query(
      `INSERT INTO modulos (trilha_id, titulo, descricao, ordem)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trilha_id, titulo, descricao, ordem || 1]
    );

    res.status(201).json({
      mensagem: 'Módulo criado com sucesso',
      modulo: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Listar módulos de uma trilha específica (ordenados)
const listarPorTrilha = async (req, res) => {
  try {
    const { trilha_id } = req.params;
    const perfilUsuario = req.usuario.perfil;

    let query;
    // Admin e gestor veem todos os módulos (inclusive rascunhos)
    if (perfilUsuario === 'admin' || perfilUsuario === 'gestor') {
      query = `SELECT * FROM modulos WHERE trilha_id = $1 ORDER BY ordem ASC`;
    } else {
      // Usuários comuns veem apenas módulos publicados
      query = `SELECT * FROM modulos
               WHERE trilha_id = $1 AND status = 'publicado'
               ORDER BY ordem ASC`;
    }

    const resultado = await pool.query(query, [trilha_id]);
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar módulo por ID
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM modulos WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar módulo
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, ordem, status } = req.body;

    const resultado = await pool.query(
      `UPDATE modulos
       SET titulo = $1, descricao = $2, ordem = $3, status = $4, atualizado_em = NOW()
       WHERE id = $5
       RETURNING *`,
      [titulo, descricao, ordem, status, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }
    res.json({ mensagem: 'Módulo atualizado', modulo: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Excluir módulo
const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'DELETE FROM modulos WHERE id = $1 RETURNING id',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }
    res.json({ mensagem: 'Módulo excluído com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Alterar status do módulo
const alterarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ['rascunho', 'publicado', 'arquivado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        erro: `Status inválido. Use: ${statusValidos.join(', ')}`
      });
    }

    const resultado = await pool.query(
      `UPDATE modulos SET status = $1, atualizado_em = NOW()
       WHERE id = $2 RETURNING id, titulo, status`,
      [status, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }

    res.json({
      mensagem: `Módulo ${status} com sucesso`,
      modulo: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { criar, listarPorTrilha, buscarPorId, atualizar, excluir, alterarStatus };