-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de notas fiscais
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  codigo_barras TEXT NOT NULL,
  url_consulta TEXT,
  estabelecimento TEXT,
  cnpj TEXT,
  data_emissao TIMESTAMPTZ,
  valor_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nota_id UUID REFERENCES notas_fiscais(id) ON DELETE CASCADE NOT NULL,
  codigo_produto TEXT,
  descricao_original TEXT NOT NULL,
  descricao_amigavel TEXT,
  categoria TEXT,
  subcategoria TEXT,
  quantidade DECIMAL(10,3) DEFAULT 1,
  unidade TEXT DEFAULT 'UN',
  valor_unitario DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela dicionário de produtos (cache de categorização)
CREATE TABLE IF NOT EXISTS dicionario_produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_produto TEXT,
  nome_original TEXT NOT NULL,
  nome_normalizado TEXT NOT NULL UNIQUE,
  nome_amigavel TEXT NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  icone TEXT,
  cor TEXT,
  ordem INTEGER DEFAULT 0
);

-- Seed de categorias padrão
INSERT INTO categorias (nome, icone, cor, ordem) VALUES
  ('Hortifruti', '🥬', '#22c55e', 1),
  ('Açougue', '🥩', '#ef4444', 2),
  ('Laticínios', '🥛', '#f59e0b', 3),
  ('Padaria', '🍞', '#d97706', 4),
  ('Bebidas', '🥤', '#3b82f6', 5),
  ('Limpeza', '🧹', '#8b5cf6', 6),
  ('Higiene', '🧴', '#ec4899', 7),
  ('Mercearia', '🛒', '#6366f1', 8),
  ('Congelados', '🧊', '#06b6d4', 9),
  ('Pet', '🐾', '#84cc16', 10),
  ('Outros', '📦', '#6b7280', 99)
ON CONFLICT (nome) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_user_id ON notas_fiscais(user_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_created_at ON notas_fiscais(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_nota_id ON produtos(nota_id);
CREATE INDEX IF NOT EXISTS idx_dicionario_nome_normalizado ON dicionario_produtos(nome_normalizado);
CREATE INDEX IF NOT EXISTS idx_dicionario_codigo_produto ON dicionario_produtos(codigo_produto);

-- Row Level Security (RLS)
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicionario_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas_fiscais
CREATE POLICY "Usuários veem suas notas" ON notas_fiscais
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam suas notas" ON notas_fiscais
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam suas notas" ON notas_fiscais
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas notas" ON notas_fiscais
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para produtos
CREATE POLICY "Usuários veem produtos de suas notas" ON produtos
  FOR SELECT USING (
    nota_id IN (SELECT id FROM notas_fiscais WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuários criam produtos em suas notas" ON produtos
  FOR INSERT WITH CHECK (
    nota_id IN (SELECT id FROM notas_fiscais WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuários atualizam produtos de suas notas" ON produtos
  FOR UPDATE USING (
    nota_id IN (SELECT id FROM notas_fiscais WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuários deletam produtos de suas notas" ON produtos
  FOR DELETE USING (
    nota_id IN (SELECT id FROM notas_fiscais WHERE user_id = auth.uid())
  );

-- Políticas RLS para dicionário (público para leitura, qualquer um pode inserir)
CREATE POLICY "Dicionário é público para leitura" ON dicionario_produtos
  FOR SELECT USING (true);

CREATE POLICY "Qualquer um pode inserir no dicionário" ON dicionario_produtos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar o dicionário" ON dicionario_produtos
  FOR UPDATE USING (true);

-- Políticas RLS para categorias (público para leitura)
CREATE POLICY "Categorias são públicas para leitura" ON categorias
  FOR SELECT USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela dicionario_produtos
CREATE TRIGGER update_dicionario_produtos_updated_at
  BEFORE UPDATE ON dicionario_produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();