const pool = require('../config/database');

// Criar aula dentro de um módulo
const criar = async (req, res) => {
  try {
    const { modulo_id, titulo, tipo, conteudo_url, conteudo_texto, ordem } = req.body;

    // Verifica se o módulo existe
    const modulo = await pool.query('SELECT id FROM modulos WHERE id = $1', [modulo_id]);
    if (modulo.rows.length === 0) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }

    // Valida: aula de texto precisa de conteudo_texto, as outras precisam de URL
    if (tipo === 'texto' && !conteudo_texto) {
      return res.status(400).json({ erro: 'Aula do tipo texto precisa de conteudo_texto' });
    }
    if (tipo !== 'texto' && !conteudo_url) {
      return res.status(400).json({ erro: `Aula do tipo ${tipo} precisa de conteudo_url` });
    }

    const resultado = await pool.query(
      `INSERT INTO aulas (modulo_id, titulo, tipo, conteudo_url, conteudo_texto, ordem)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [modulo_id, titulo, tipo, conteudo_url, conteudo_texto, ordem || 1]
    );

    res.status(201).json({
      mensagem: 'Aula criada com sucesso',
      aula: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Listar aulas de um módulo (ordenadas)
const listarPorModulo = async (req, res) => {
  try {
    const { modulo_id } = req.params;
    const resultado = await pool.query(
      'SELECT * FROM aulas WHERE modulo_id = $1 ORDER BY ordem ASC',
      [modulo_id]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar aula por ID
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM aulas WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Atualizar aula
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, tipo, conteudo_url, conteudo_texto, ordem } = req.body;

    const resultado = await pool.query(
      `UPDATE aulas
       SET titulo = $1, tipo = $2, conteudo_url = $3, conteudo_texto = $4,
           ordem = $5, atualizado_em = NOW()
       WHERE id = $6
       RETURNING *`,
      [titulo, tipo, conteudo_url, conteudo_texto, ordem, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }
    res.json({ mensagem: 'Aula atualizada', aula: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Excluir aula
const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'DELETE FROM aulas WHERE id = $1 RETURNING id',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }
    res.json({ mensagem: 'Aula excluída com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { criar, listarPorModulo, buscarPorId, atualizar, excluir };