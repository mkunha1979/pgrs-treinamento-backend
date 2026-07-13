const pool = require('../config/database');

// Marcar aula como concluída
const marcarConcluida = async (req, res) => {
  try {
    const { aula_id } = req.body;
    const usuario_id = req.usuario.id;

    // Verifica se a aula existe
    const aula = await pool.query('SELECT id FROM aulas WHERE id = $1', [aula_id]);
    if (aula.rows.length === 0) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    // Insere ou atualiza o progresso (UPSERT)
    const resultado = await pool.query(
      `INSERT INTO progresso (usuario_id, aula_id, concluida, concluida_em)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (usuario_id, aula_id)
       DO UPDATE SET concluida = true, concluida_em = NOW()
       RETURNING *`,
      [usuario_id, aula_id]
    );

    res.json({
      mensagem: 'Aula marcada como concluída',
      progresso: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Desmarcar aula (caso o usuário queira revisar)
const desmarcarConcluida = async (req, res) => {
  try {
    const { aula_id } = req.body;
    const usuario_id = req.usuario.id;

    const resultado = await pool.query(
      `UPDATE progresso SET concluida = false, concluida_em = NULL
       WHERE usuario_id = $1 AND aula_id = $2
       RETURNING *`,
      [usuario_id, aula_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Progresso não encontrado' });
    }

    res.json({ mensagem: 'Aula desmarcada', progresso: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Progresso do usuário em uma trilha (com % e desbloqueio de módulos)
const progressoTrilha = async (req, res) => {
  try {
    const { trilha_id } = req.params;
    const usuario_id = req.usuario.id;

    // Busca todos os módulos publicados da trilha, ordenados
    const modulos = await pool.query(
      `SELECT id, titulo, ordem FROM modulos
       WHERE trilha_id = $1 AND status = 'publicado'
       ORDER BY ordem ASC`,
      [trilha_id]
    );

    const resultado = [];
    let moduloAnteriorCompleto = true; // o primeiro módulo sempre está desbloqueado

    for (const modulo of modulos.rows) {
      // Total de aulas do módulo
      const totalAulas = await pool.query(
        'SELECT COUNT(*) FROM aulas WHERE modulo_id = $1',
        [modulo.id]
      );
      const total = parseInt(totalAulas.rows[0].count);

      // Aulas concluídas pelo usuário nesse módulo
      const concluidas = await pool.query(
        `SELECT COUNT(*) FROM progresso p
         JOIN aulas a ON a.id = p.aula_id
         WHERE a.modulo_id = $1 AND p.usuario_id = $2 AND p.concluida = true`,
        [modulo.id, usuario_id]
      );
      const feitas = parseInt(concluidas.rows[0].count);

      const percentual = total > 0 ? Math.round((feitas / total) * 100) : 0;
      const completo = total > 0 && feitas === total;

      resultado.push({
        modulo_id: modulo.id,
        titulo: modulo.titulo,
        ordem: modulo.ordem,
        total_aulas: total,
        aulas_concluidas: feitas,
        percentual,
        completo,
        desbloqueado: moduloAnteriorCompleto
      });

      // O próximo módulo só desbloqueia se este estiver completo
      moduloAnteriorCompleto = completo;
    }

    // Percentual geral da trilha
    const totalGeral = resultado.reduce((soma, m) => soma + m.total_aulas, 0);
    const feitasGeral = resultado.reduce((soma, m) => soma + m.aulas_concluidas, 0);
    const percentualTrilha = totalGeral > 0
      ? Math.round((feitasGeral / totalGeral) * 100)
      : 0;

    res.json({
      trilha_id,
      percentual_trilha: percentualTrilha,
      trilha_completa: totalGeral > 0 && feitasGeral === totalGeral,
      modulos: resultado
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { marcarConcluida, desmarcarConcluida, progressoTrilha };