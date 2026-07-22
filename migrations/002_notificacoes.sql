CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  link VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida);