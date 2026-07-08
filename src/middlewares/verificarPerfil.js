// Recebe os perfis permitidos e bloqueia quem não tiver permissão
const verificarPerfil = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        erro: 'Acesso negado. Você não tem permissão para esta ação.'
      });
    }
    next();
  };
};

module.exports = { verificarPerfil };