-- ============================================================
-- RestoFlow — Schéma initial
-- Prix en entier FCFA (pas de décimales)
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Restaurants
create table public.restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  address     text,
  phone       text,
  email       text,
  logo_url    text,
  cover_url   text,
  currency    text not null default 'XOF',
  opening_hours jsonb default '{}',
  social_links  jsonb default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Utilisateurs liés à un restaurant
create table public.restaurant_users (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at    timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

-- Plats / articles du menu
create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  description   text,
  price         integer not null check (price >= 0),
  category      text not null default 'Plats',
  image_url     text,
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Conversations (chat client)
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  customer_name   text,
  customer_phone  text,
  channel         text not null default 'web' check (channel in ('web', 'whatsapp', 'phone')),
  status          text not null default 'open' check (status in ('open', 'closed')),
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Commandes
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  customer_name   text not null,
  customer_phone  text,
  items           jsonb not null default '[]',
  total           integer not null default 0 check (total >= 0),
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Paiements
create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  amount        integer not null check (amount > 0),
  method        text not null default 'cash'
                  check (method in ('cash', 'orange_money', 'moov_money', 'wave', 'card')),
  status        text not null default 'pending'
                  check (status in ('pending', 'completed', 'failed', 'refunded')),
  reference     text,
  created_at    timestamptz not null default now()
);

-- FAQ
create table public.faq_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  question      text not null,
  answer        text not null,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 2. INDEX
-- ============================================================

create index idx_restaurant_users_user    on public.restaurant_users(user_id);
create index idx_menu_items_restaurant    on public.menu_items(restaurant_id);
create index idx_conversations_restaurant on public.conversations(restaurant_id);
create index idx_orders_restaurant        on public.orders(restaurant_id);
create index idx_orders_status            on public.orders(status);
create index idx_payments_order           on public.payments(order_id);
create index idx_faq_items_restaurant     on public.faq_items(restaurant_id);

-- ============================================================
-- 3. FONCTION get_restaurant_id()
--    Retourne le restaurant_id de l'utilisateur connecté.
--    Utilisée dans les politiques RLS.
-- ============================================================

create or replace function public.get_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ru.restaurant_id
  from public.restaurant_users ru
  where ru.user_id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- 4. TRIGGER updated_at
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.restaurants
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.menu_items
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.faq_items
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.restaurants      enable row level security;
alter table public.restaurant_users enable row level security;
alter table public.menu_items       enable row level security;
alter table public.conversations    enable row level security;
alter table public.orders           enable row level security;
alter table public.payments         enable row level security;
alter table public.faq_items        enable row level security;

-- ----- restaurants -----

create policy "Lecture publique des restaurants actifs"
  on public.restaurants for select
  using (is_active = true);

create policy "Gestion par les membres du restaurant"
  on public.restaurants for all
  using (id = public.get_restaurant_id())
  with check (id = public.get_restaurant_id());

-- ----- restaurant_users -----

create policy "Voir ses propres liens restaurant"
  on public.restaurant_users for select
  using (user_id = auth.uid());

create policy "Owner gère les membres"
  on public.restaurant_users for all
  using (
    restaurant_id = public.get_restaurant_id()
    and exists (
      select 1 from public.restaurant_users ru
      where ru.restaurant_id = restaurant_users.restaurant_id
        and ru.user_id = auth.uid()
        and ru.role = 'owner'
    )
  );

-- ----- menu_items -----

create policy "Menu visible publiquement"
  on public.menu_items for select
  using (
    is_available = true
    and exists (
      select 1 from public.restaurants r
      where r.id = menu_items.restaurant_id and r.is_active = true
    )
  );

create policy "Staff gère le menu"
  on public.menu_items for all
  using (restaurant_id = public.get_restaurant_id())
  with check (restaurant_id = public.get_restaurant_id());

-- ----- conversations -----

create policy "Staff voit les conversations"
  on public.conversations for select
  using (restaurant_id = public.get_restaurant_id());

create policy "Création publique de conversation"
  on public.conversations for insert
  with check (true);

create policy "Staff met à jour les conversations"
  on public.conversations for update
  using (restaurant_id = public.get_restaurant_id());

-- ----- orders -----

create policy "Staff voit les commandes"
  on public.orders for select
  using (restaurant_id = public.get_restaurant_id());

create policy "Création publique de commande"
  on public.orders for insert
  with check (true);

create policy "Staff met à jour les commandes"
  on public.orders for update
  using (restaurant_id = public.get_restaurant_id());

-- ----- payments -----

create policy "Staff voit les paiements"
  on public.payments for select
  using (restaurant_id = public.get_restaurant_id());

create policy "Création de paiement"
  on public.payments for insert
  with check (restaurant_id = public.get_restaurant_id());

create policy "Staff met à jour les paiements"
  on public.payments for update
  using (restaurant_id = public.get_restaurant_id());

-- ----- faq_items -----

create policy "FAQ visible publiquement"
  on public.faq_items for select
  using (
    is_published = true
    and exists (
      select 1 from public.restaurants r
      where r.id = faq_items.restaurant_id and r.is_active = true
    )
  );

create policy "Staff gère la FAQ"
  on public.faq_items for all
  using (restaurant_id = public.get_restaurant_id())
  with check (restaurant_id = public.get_restaurant_id());
