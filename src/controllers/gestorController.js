const pool = require('../config/database');

// Visão geral: métricas globais do sistema
const visaoGeral = async (req, res) => {
  try {
    const totalUsuarios = await pool.query(
      `SELECT COUNT(*) FROM usuarios WHERE perfil IN ('servidor', 'terceirizado')`
    );
    const totalTrilhas = await pool.query(
      `SELECT COUNT(*) FROM trilhas WHERE status = 'publicada'`
    );
    const totalCertificados = await pool.query('SELECT COUNT(*) FROM certificados');

    // Taxa de conclusão: usuários com pelo menos 1 certificado / total de usuários
    const usuariosComCertificado = await pool.query(
      `SELECT COUNT(DISTINCT usuario_id) FROM certificados`
    );

    const total = parseInt(totalUsuarios.rows[0].count);
    const comCert = parseInt(usuariosComCertificado.rows[0].count);
    const taxaConclusao = total > 0 ? Math.round((comCert / total) * 100) : 0;

    res.json({
      total_usuarios: total,
      trilhas_publicadas: parseInt(totalTrilhas.rows[0].count),
      certificados_emitidos: parseInt(totalCertificados.rows[0].count),
      taxa_conclusao: taxaConclusao
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Progresso detalhado de todos os usuários
const progressoUsuarios = async (req, res) => {
  try {
    const { setor, perfil } = req.query; // filtros opcionais

    // Busca usuários (com filtros opcionais)
    let queryUsuarios = `
      SELECT id, nome, email, perfil, setor
      FROM usuarios
      WHERE perfil IN ('servidor', 'terceirizado')
    `;
    const params = [];

    if (setor) {
      params.push(setor);
      queryUsuarios += ` AND setor = $${params.length}`;
    }
    if (perfil) {
      params.push(perfil);
      queryUsuarios += ` AND perfil = $${params.length}`;
    }
    queryUsuarios += ' ORDER BY nome ASC';

    const usuarios = await pool.query(queryUsuarios, params);

    // Para cada usuário, calcula quantas aulas concluiu e certificados
    const resultado = [];
    for (const usuario of usuarios.rows) {
      const aulasConcluidas = await pool.query(
        `SELECT COUNT(*) FROM progresso WHERE usuario_id = $1 AND concluida = true`,
        [usuario.id]
      );
      const certificados = await pool.query(
        `SELECT COUNT(*) FROM certificados WHERE usuario_id = $1`,
        [usuario.id]
      );

      resultado.push({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        setor: usuario.setor || 'Não informado',
        aulas_concluidas: parseInt(aulasConcluidas.rows[0].count),
        certificados: parseInt(certificados.rows[0].count),
        status: parseInt(certificados.rows[0].count) > 0
          ? 'Concluído'
          : parseInt(aulasConcluidas.rows[0].count) > 0
            ? 'Em andamento'
            : 'Não iniciado'
      });
    }

    res.json(resultado);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { visaoGeral, progressoUsuarios };