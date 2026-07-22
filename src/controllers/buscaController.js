const pool = require('../config/database');

// Busca global por palavra-chave em trilhas, módulos e aulas
const buscar = async (req, res) => {
  try {
    const { q } = req.query; // termo de busca
    const perfil = req.usuario.perfil;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ erro: 'Informe um termo com ao menos 2 caracteres' });
    }

    const termo = `%${q.trim()}%`;
    const ehGestor = perfil === 'admin' || perfil === 'gestor';

    // Busca em trilhas
    const filtroTrilha = ehGestor ? '' : `AND status = 'publicada'`;
    const trilhas = await pool.query(
      `SELECT id, titulo, descricao, 'trilha' as tipo
       FROM trilhas
       WHERE (titulo ILIKE $1 OR descricao ILIKE $1) ${filtroTrilha}
       ORDER BY titulo`,
      [termo]
    );

    // Busca em módulos
    const filtroModulo = ehGestor ? '' : `AND status = 'publicado'`;
    const modulos = await pool.query(
      `SELECT id, titulo, descricao, trilha_id, 'modulo' as tipo
       FROM modulos
       WHERE (titulo ILIKE $1 OR descricao ILIKE $1) ${filtroModulo}
       ORDER BY titulo`,
      [termo]
    );

    // Busca em aulas
    const aulas = await pool.query(
      `SELECT id, titulo, tipo as tipo_aula, modulo_id, 'aula' as tipo
       FROM aulas
       WHERE titulo ILIKE $1
       ORDER BY titulo`,
      [termo]
    );

    res.json({
      termo: q.trim(),
      total: trilhas.rows.length + modulos.rows.length + aulas.rows.length,
      resultados: {
        trilhas: trilhas.rows,
        modulos: modulos.rows,
        aulas: aulas.rows
      }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { buscar };