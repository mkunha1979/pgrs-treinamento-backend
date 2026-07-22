const pool = require('../config/database');

// Notifica todos os usuários de um perfil sobre um novo conteúdo
const notificarPorPerfil = async (perfil_alvo, titulo, mensagem, link = null) => {
  try {
    // Busca usuários do perfil (ou todos, se for 'todos')
    let query;
    let params;
    if (perfil_alvo === 'todos') {
      query = `SELECT id FROM usuarios WHERE perfil IN ('servidor', 'terceirizado') AND ativo = true`;
      params = [];
    } else {
      query = `SELECT id FROM usuarios WHERE perfil = $1 AND ativo = true`;
      params = [perfil_alvo];
    }

    const usuarios = await pool.query(query, params);

    // Cria uma notificação para cada usuário
    for (const u of usuarios.rows) {
      await pool.query(
        `INSERT INTO notificacoes (usuario_id, titulo, mensagem, link)
         VALUES ($1, $2, $3, $4)`,
        [u.id, titulo, mensagem, link]
      );
    }

    return usuarios.rows.length;
  } catch (erro) {
    console.error('Erro ao notificar:', erro.message);
    return 0;
  }
};

module.exports = { notificarPorPerfil };