-- Fonction RPC pour mettre à jour le statut d'abonnement (bypass schema cache)
create or replace function public.update_restaurant_statut(p_id uuid, p_statut text)
returns void
language plpgsql
security definer
as $$
begin
  if p_statut not in ('actif', 'trial', 'suspendu') then
    raise exception 'Statut invalide: %', p_statut;
  end if;

  update public.restaurants
  set statut_abonnement = p_statut
  where id = p_id;
end;
$$;

-- Force PostgREST à recharger son cache
notify pgrst, 'reload schema';
