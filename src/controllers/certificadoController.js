const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');

// Gerar código de validação único
const gerarCodigo = () => {
  return 'CERT-' + crypto.randomBytes(6).toString('hex').toUpperCase();
};

// Emitir certificado (verifica se a trilha está completa)
const emitir = async (req, res) => {
  try {
    const { trilha_id } = req.body;
    const usuario_id = req.usuario.id;

    // Busca dados do usuário e da trilha
    const usuario = await pool.query('SELECT nome FROM usuarios WHERE id = $1', [usuario_id]);
    const trilha = await pool.query('SELECT titulo FROM trilhas WHERE id = $1', [trilha_id]);

    if (trilha.rows.length === 0) {
      return res.status(404).json({ erro: 'Trilha não encontrada' });
    }

    // Verifica se a trilha está 100% completa
    const modulos = await pool.query(
      `SELECT id FROM modulos WHERE trilha_id = $1 AND status = 'publicado'`,
      [trilha_id]
    );

    let totalAulas = 0;
    let aulasConcluidas = 0;

    for (const modulo of modulos.rows) {
      const total = await pool.query('SELECT COUNT(*) FROM aulas WHERE modulo_id = $1', [modulo.id]);
      const feitas = await pool.query(
        `SELECT COUNT(*) FROM progresso p
         JOIN aulas a ON a.id = p.aula_id
         WHERE a.modulo_id = $1 AND p.usuario_id = $2 AND p.concluida = true`,
        [modulo.id, usuario_id]
      );
      totalAulas += parseInt(total.rows[0].count);
      aulasConcluidas += parseInt(feitas.rows[0].count);
    }

    if (totalAulas === 0 || aulasConcluidas < totalAulas) {
      return res.status(400).json({
        erro: 'Trilha ainda não foi concluída',
        progresso: `${aulasConcluidas}/${totalAulas} aulas`
      });
    }

    // Verifica se já existe certificado
    let certificado = await pool.query(
      'SELECT * FROM certificados WHERE usuario_id = $1 AND trilha_id = $2',
      [usuario_id, trilha_id]
    );

    // Se não existe, cria
    if (certificado.rows.length === 0) {
      const codigo = gerarCodigo();
      certificado = await pool.query(
        `INSERT INTO certificados (usuario_id, trilha_id, codigo_validacao)
         VALUES ($1, $2, $3) RETURNING *`,
        [usuario_id, trilha_id, codigo]
      );
    }

    res.json({
      mensagem: 'Certificado disponível',
      certificado: {
        codigo_validacao: certificado.rows[0].codigo_validacao,
        usuario: usuario.rows[0].nome,
        trilha: trilha.rows[0].titulo,
        emitido_em: certificado.rows[0].emitido_em
      }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Baixar o PDF do certificado
const baixarPDF = async (req, res) => {
  try {
    const { codigo } = req.params;

    const resultado = await pool.query(
      `SELECT c.codigo_validacao, c.emitido_em, u.nome, t.titulo
       FROM certificados c
       JOIN usuarios u ON u.id = c.usuario_id
       JOIN trilhas t ON t.id = c.trilha_id
       WHERE c.codigo_validacao = $1`,
      [codigo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Certificado não encontrado' });
    }

    const cert = resultado.rows[0];
    const dataFormatada = new Date(cert.emitido_em).toLocaleDateString('pt-BR');

    // Cria o PDF
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificado-${codigo}.pdf"`);
    doc.pipe(res);

    // Moldura
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3).stroke('#1B4332');
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(1).stroke('#2D6A4F');

    // Título
    doc.fontSize(40).fillColor('#1B4332').font('Helvetica-Bold')
       .text('CERTIFICADO', 0, 90, { align: 'center' });

    doc.fontSize(14).fillColor('#333').font('Helvetica')
       .text('DE CONCLUSÃO', 0, 140, { align: 'center', characterSpacing: 3 });

    // Corpo
    doc.fontSize(16).fillColor('#333').font('Helvetica')
       .text('Certificamos que', 0, 200, { align: 'center' });

    doc.fontSize(30).fillColor('#1B4332').font('Helvetica-Bold')
       .text(cert.nome, 0, 230, { align: 'center' });

    doc.fontSize(16).fillColor('#333').font('Helvetica')
       .text('concluiu com êxito a trilha de capacitação', 0, 285, { align: 'center' });

    doc.fontSize(20).fillColor('#2D6A4F').font('Helvetica-Bold')
       .text(cert.titulo, 0, 315, { align: 'center' });

    // Rodapé
    doc.fontSize(12).fillColor('#666').font('Helvetica')
       .text(`Emitido em ${dataFormatada}`, 0, 400, { align: 'center' });

    doc.fontSize(10).fillColor('#999')
       .text(`Código de validação: ${cert.codigo_validacao}`, 0, 430, { align: 'center' });

    doc.fontSize(11).fillColor('#666')
       .text('Secretaria da Casa Civil — Governo do Estado do Rio Grande do Sul',
             0, 480, { align: 'center' });

    doc.end();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { emitir, baixarPDF };