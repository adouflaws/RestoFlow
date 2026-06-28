-- Migration 006 : Ajoute la colonne keywords aux faq_items
-- Permet la correspondance directe sans appel IA

alter table public.faq_items
  add column if not exists keywords text[] not null default '{}';

-- Index GIN pour recherche rapide dans les tableaux
create index if not exists idx_faq_items_keywords
  on public.faq_items using gin(keywords);
