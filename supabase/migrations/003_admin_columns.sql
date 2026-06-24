-- Ajout colonnes pour le super-admin
alter table public.restaurants
  add column if not exists statut_abonnement text not null default 'trial'
    check (statut_abonnement in ('trial', 'active', 'suspended')),
  add column if not exists whatsapp_phone_id text;
