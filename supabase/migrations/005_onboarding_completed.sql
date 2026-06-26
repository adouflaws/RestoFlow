-- Colonne onboarding_completed sur restaurants
alter table public.restaurants
  add column if not exists onboarding_completed boolean not null default false;

-- Table zones_livraison (création si absente)
create table if not exists public.zones_livraison (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  nom_zone      text not null,
  quartiers     text[] not null default '{}',
  frais         integer not null default 0 check (frais >= 0),
  actif         boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_zones_livraison_restaurant
  on public.zones_livraison(restaurant_id);
