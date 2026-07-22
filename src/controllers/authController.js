const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { registrarLog } = require('../utils/registrarLog');

// Registrar novo usuário
const registrar = async (req, res) => {
  try {
    const { nome, email, senha, perfil, setor } = req.body;

    // Verifica se e-mail já existe
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    // Criptografa a senha
    const senha_hash = await bcrypt.hash(senha, 10);

    // Insere no banco
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, setor)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, perfil, setor`,
      [nome, email, senha_hash, perfil || 'servidor', setor]
    );

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso',
      usuario: resultado.rows[0]
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca usuário pelo e-mail
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const usuario = resultado.rows[0];

    // Verifica a senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await registrarLog(usuario.id, 'LOGIN', { email: usuario.email });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        setor: usuario.setor
      }
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { registrar, login };