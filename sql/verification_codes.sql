-- =============================================
-- TABELA: verification_codes
-- Armazena códigos de verificação temporários
-- para validação de identidade via WhatsApp
-- =============================================

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  cpf_cnpj TEXT,
  provider_code TEXT DEFAULT 'webconnect',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscas rápidas por telefone + código
CREATE INDEX IF NOT EXISTS idx_verification_phone_code 
  ON verification_codes (phone, code);

-- Habilita RLS (Row Level Security)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Política: permite INSERT pelo app (anon)
CREATE POLICY "allow_insert_verification_codes"
  ON verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: NÃO permite SELECT direto (segurança)
-- A verificação é feita exclusivamente pela função RPC abaixo.

-- =============================================
-- FUNÇÃO RPC: verify_code
-- Valida o código digitado pelo cliente.
-- Roda com SECURITY DEFINER (privilégios do dono)
-- para que o app (anon) não consiga ler a tabela diretamente.
-- =============================================

CREATE OR REPLACE FUNCTION verify_code(p_phone TEXT, p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Busca código válido (não usado e não expirado)
  SELECT id INTO v_record
  FROM verification_codes
  WHERE phone = p_phone
    AND code = p_code
    AND used = FALSE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_record.id IS NOT NULL THEN
    -- Marca como usado
    UPDATE verification_codes SET used = TRUE WHERE id = v_record.id;
    RETURN json_build_object('verified', true, 'message', 'Código verificado com sucesso!');
  ELSE
    RETURN json_build_object('verified', false, 'message', 'Código inválido ou expirado. Tente novamente.');
  END IF;
END;
$$;

-- =============================================
-- CRON: Limpeza automática de códigos expirados
-- Remove códigos com mais de 1 hora (limpeza)
-- Execute manualmente ou configure via pg_cron
-- =============================================
-- DELETE FROM verification_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
