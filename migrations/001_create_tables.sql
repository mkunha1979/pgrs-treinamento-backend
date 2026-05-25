-- Extensão para gerar UUIDs automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Usuários ─────────────────────────────────────────────
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('servidor','terceirizado','gestor','admin')),
  setor VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ── Trilhas ──────────────────────────────────────────────
CREATE TABLE trilhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  perfil_alvo VARCHAR(20) NOT NULL CHECK (perfil_alvo IN ('servidor','terceirizado','gestor','todos')),
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicada','arquivada')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ── Módulos ───────────────────────────────────────────────
CREATE TABLE modulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','arquivado')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ── Aulas ─────────────────────────────────────────────────
CREATE TABLE aulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('video','pdf','link','texto')),
  conteudo_url TEXT,
  conteudo_texto TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ── Progresso ─────────────────────────────────────────────
CREATE TABLE progresso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  concluida BOOLEAN DEFAULT false,
  concluida_em TIMESTAMP,
  UNIQUE(usuario_id, aula_id)
);

-- ── Certificados ──────────────────────────────────────────
CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  codigo_validacao VARCHAR(50) UNIQUE NOT NULL,
  emitido_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, trilha_id)
);

-- ── Log de acessos ────────────────────────────────────────
CREATE TABLE log_acessos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  acao VARCHAR(100) NOT NULL,
  detalhes JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);