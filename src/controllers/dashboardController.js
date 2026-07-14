const pool = require('../config/database');

// Dashboard do usuário logado — métricas consolidadas
const dashboardUsuario = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const perfil = req.usuario.perfil;

    // 1. Trilhas disponíveis para o perfil do usuário
    let trilhasDisponiveis;
    if (perfil === 'admin' || perfil === 'gestor') {
      trilhasDisponiveis = await pool.query('SELECT COUNT(*) FROM trilhas');
    } else {
      trilhasDisponiveis = await pool.query(
        `SELECT COUNT(*) FROM trilhas
         WHERE status = 'publicada'
         AND (perfil_alvo = $1 OR perfil_alvo = 'todos')`,
        [perfil]
      );
    }

    // 2. Total de aulas concluídas pelo usuário
    const aulasConcluidas = await pool.query(
      `SELECT COUNT(*) FROM progresso
       WHERE usuario_id = $1 AND concluida = true`,
      [usuario_id]
    );

    // 3. Certificados do usuário
    const certificados = await pool.query(
      'SELECT COUNT(*) FROM certificados WHERE usuario_id = $1',
      [usuario_id]
    );

    // 4. Trilha ativa mais recente (última aula concluída)
    const trilhaAtiva = await pool.query(
      `SELECT DISTINCT t.id, t.titulo, MAX(p.concluida_em) as ultima_atividade
       FROM progresso p
       JOIN aulas a ON a.id = p.aula_id
       JOIN modulos m ON m.id = a.modulo_id
       JOIN trilhas t ON t.id = m.trilha_id
       WHERE p.usuario_id = $1 AND p.concluida = true
       GROUP BY t.id, t.titulo
       ORDER BY ultima_atividade DESC
       LIMIT 1`,
      [usuario_id]
    );

    // Estimativa de horas de estudo (10 min por aula concluída)
    const totalAulas = parseInt(aulasConcluidas.rows[0].count);
    const minutosEstudo = totalAulas * 10;
    const horas = Math.floor(minutosEstudo / 60);
    const minutos = minutosEstudo % 60;

    res.json({
      trilhas_disponiveis: parseInt(trilhasDisponiveis.rows[0].count),
      aulas_concluidas: totalAulas,
      certificados: parseInt(certificados.rows[0].count),
      tempo_estudo: `${horas}h ${minutos}min`,
      trilha_ativa: trilhaAtiva.rows[0] || null
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { dashboardUsuario };