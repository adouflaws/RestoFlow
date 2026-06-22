-- Ajout du mode de paiement sur les commandes
alter table public.orders
  add column mode_paiement text check (mode_paiement in ('mobile_money', 'especes'));
