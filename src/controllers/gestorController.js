const pool = require('../config/database');
const PDFDocument = require('pdfkit');

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

// Gerar relatório PDF de conclusões para auditoria
const relatorioPDF = async (req, res) => {
  try {
    // Busca todos os usuários com progresso
    const usuarios = await pool.query(
      `SELECT id, nome, email, perfil, setor
       FROM usuarios
       WHERE perfil IN ('servidor', 'terceirizado')
       ORDER BY setor, nome`
    );

    const dados = [];
    for (const u of usuarios.rows) {
      const aulas = await pool.query(
        `SELECT COUNT(*) FROM progresso WHERE usuario_id = $1 AND concluida = true`,
        [u.id]
      );
      const certs = await pool.query(
        `SELECT COUNT(*) FROM certificados WHERE usuario_id = $1`,
        [u.id]
      );
      const nCerts = parseInt(certs.rows[0].count);
      const nAulas = parseInt(aulas.rows[0].count);
      dados.push({
        nome: u.nome,
        setor: u.setor || 'Não informado',
        perfil: u.perfil,
        aulas: nAulas,
        certificados: nCerts,
        status: nCerts > 0 ? 'Concluído' : nAulas > 0 ? 'Em andamento' : 'Não iniciado'
      });
    }

    // Cria o PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="relatorio-auditoria-${dataHoje}.pdf"`);
    doc.pipe(res);

    // Cabeçalho
    doc.rect(40, 40, doc.page.width - 80, 60).fill('#1B4332');
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
       .text('Relatório de Capacitação — PGRS', 50, 55);
    doc.fontSize(10).font('Helvetica')
       .text('Secretaria da Casa Civil — Governo do Estado do RS', 50, 78);

    doc.fillColor('#333').fontSize(9).font('Helvetica')
       .text(`Emitido em: ${dataHoje}`, 40, 115, { align: 'right', width: doc.page.width - 80 });

    // Cabeçalho da tabela
    let y = 145;
    const colX = { nome: 45, setor: 200, perfil: 320, status: 420, cert: 510 };

    doc.rect(40, y - 5, doc.page.width - 80, 22).fill('#2D6A4F');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('Nome', colX.nome, y);
    doc.text('Setor', colX.setor, y);
    doc.text('Perfil', colX.perfil, y);
    doc.text('Status', colX.status, y);
    doc.text('Cert.', colX.cert, y);

    y += 25;

    // Linhas da tabela
    doc.font('Helvetica').fontSize(9);
    dados.forEach((d, i) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
      }
      // Fundo zebrado
      if (i % 2 === 0) {
        doc.rect(40, y - 4, doc.page.width - 80, 20).fill('#f5f5f4');
      }
      doc.fillColor('#333');
      doc.text(d.nome, colX.nome, y, { width: 150, ellipsis: true });
      doc.text(d.setor, colX.setor, y, { width: 115, ellipsis: true });
      doc.text(d.perfil, colX.perfil, y, { width: 95 });
      // Status com cor
      const cor = d.status === 'Concluído' ? '#2D6A4F'
                : d.status === 'Em andamento' ? '#854f0b' : '#999';
      doc.fillColor(cor).text(d.status, colX.status, y, { width: 90 });
      doc.fillColor('#333').text(String(d.certificados), colX.cert, y);
      y += 20;
    });

    // Resumo no rodapé
    const totalConcluidos = dados.filter(d => d.status === 'Concluído').length;
    y += 15;
    if (y > doc.page.height - 80) { doc.addPage(); y = 50; }
    doc.rect(40, y, doc.page.width - 80, 1).fill('#d3d1c7');
    y += 12;
    doc.fillColor('#1B4332').fontSize(10).font('Helvetica-Bold')
       .text(`Total de servidores/terceirizados: ${dados.length}`, 45, y);
    doc.text(`Concluíram ao menos uma trilha: ${totalConcluidos}`, 45, y + 16);

    doc.end();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { visaoGeral, progressoUsuarios, relatorioPDF };