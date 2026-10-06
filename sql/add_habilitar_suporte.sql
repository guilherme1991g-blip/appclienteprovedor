-- Migration: Adiciona a coluna habilitar_suporte na tabela provedores
-- Execute este comando no SQL Editor do Supabase (https://supabase.com/dashboard)

ALTER TABLE provedores 
ADD COLUMN IF NOT EXISTS habilitar_suporte BOOLEAN DEFAULT true;
