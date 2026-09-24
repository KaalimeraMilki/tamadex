-- TamaDex V3 — assistant d'évolution, traductions, admin et cadrage images
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- Le premier compte créé dans ce projet devient administrateur initial.

create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create or replace function public.is_tamadex_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_tamadex_admin() from public;
grant execute on function public.is_tamadex_admin() to authenticated;

drop policy if exists "Users can read own admin status" on public.app_admins;
create policy "Users can read own admin status"
on public.app_admins for select
to authenticated
using (user_id = auth.uid());

-- Projet neuf TamaDex : le premier compte devient admin initial.
insert into public.app_admins(user_id)
select id from auth.users order by created_at asc limit 1
on conflict (user_id) do nothing;

alter table public.tamagotchis
  add column if not exists name_fr text,
  add column if not exists description_fr text,
  add column if not exists evolution_conditions_fr text,
  add column if not exists image_scale numeric(5,2) not null default 0.84,
  add column if not exists image_pos_x integer not null default 50,
  add column if not exists image_pos_y integer not null default 50,
  add column if not exists image_source_url text;

alter table public.tamagotchis
  drop constraint if exists tamagotchis_image_scale_check;
alter table public.tamagotchis
  add constraint tamagotchis_image_scale_check check (image_scale between 0.35 and 1.40);

alter table public.tamagotchis
  drop constraint if exists tamagotchis_image_pos_x_check;
alter table public.tamagotchis
  add constraint tamagotchis_image_pos_x_check check (image_pos_x between 0 and 100);

alter table public.tamagotchis
  drop constraint if exists tamagotchis_image_pos_y_check;
alter table public.tamagotchis
  add constraint tamagotchis_image_pos_y_check check (image_pos_y between 0 and 100);

drop policy if exists "Admins can update tamagotchis" on public.tamagotchis;
create policy "Admins can update tamagotchis"
on public.tamagotchis for update
to authenticated
using (public.is_tamadex_admin())
with check (public.is_tamadex_admin());

grant update on public.tamagotchis to authenticated;

create table if not exists public.app_translations (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  key text not null,
  value_en text,
  value_fr text not null,
  updated_at timestamptz not null default now(),
  unique(category, key)
);

alter table public.app_translations enable row level security;

drop policy if exists "Authenticated can read translations" on public.app_translations;
create policy "Authenticated can read translations"
on public.app_translations for select
to authenticated
using (true);

drop policy if exists "Admins can insert translations" on public.app_translations;
create policy "Admins can insert translations"
on public.app_translations for insert
to authenticated
with check (public.is_tamadex_admin());

drop policy if exists "Admins can update translations" on public.app_translations;
create policy "Admins can update translations"
on public.app_translations for update
to authenticated
using (public.is_tamadex_admin())
with check (public.is_tamadex_admin());

drop policy if exists "Admins can delete translations" on public.app_translations;
create policy "Admins can delete translations"
on public.app_translations for delete
to authenticated
using (public.is_tamadex_admin());

grant select, insert, update, delete on public.app_translations to authenticated;
grant select on public.app_admins to authenticated;

insert into public.app_translations(category,key,value_en,value_fr) values
('action', 'care_error', 'Care mistake', 'Erreur de soin'),
('action', 'meal', 'Meal', 'Repas'),
('action', 'special_meal', 'Special meal', 'Repas spécial'),
('action', 'snack', 'Snack', 'Collation'),
('action', 'game', 'Game', 'Jeu'),
('action', 'max_needs', 'Hunger + happiness maxed', 'Faim + bonheur au maximum'),
('action', 'walk', 'Tama Walk', 'Promenade Tama'),
('action', 'arena_win', 'Arena win', 'Victoire à l’Arène'),
('action', 'arcade_perfect', 'Perfect Tama Arcade score', 'Score parfait au Tama Arcade'),
('action', 'delivery', 'Tama Delivery order', 'Commande Tama Delivery'),
('action', 'travel', 'Tama Travel trip', 'Voyage Tama Travel'),
('action', 'fashion', 'Tama Fashion outfit', 'Tenue Tama Fashion'),
('action', 'diy', 'DIY accessory', 'Accessoire DIY'),
('action', 'item', 'Item used', 'Objet utilisé'),
('action', 'connection', 'Device connection', 'Connexion entre appareils'),
('action', 'medicine', 'Medicine', 'Médicament'),
('action', 'cleaning', 'Cleaning', 'Nettoyage'),
('action', 'sleep', 'Sleep', 'Sommeil'),
('action', 'other', 'Other', 'Autre'),
('food', 'Apple Pie', 'Apple Pie', 'Tarte aux pommes'),
('food', 'Apples', 'Apples', 'Pommes'),
('food', 'Bamboo Grass', 'Bamboo Grass', 'Herbe de bambou'),
('food', 'Bamboo Leaf Rice Cake', 'Bamboo Leaf Rice Cake', 'Gâteau de riz en feuille de bambou'),
('food', 'Banana on a Stick', 'Banana on a Stick', 'Banane sur bâtonnet'),
('food', 'Bananas', 'Bananas', 'Bananes'),
('food', 'Beef Stroganoff', 'Beef Stroganoff', 'Bœuf Stroganoff'),
('food', 'Beets', 'Beets', 'Betteraves'),
('food', 'Big Meat', 'Big Meat', 'Grande portion de viande'),
('food', 'Blinis', 'Blinis', 'Blinis'),
('food', 'Borscht', 'Borscht', 'Bortsch'),
('food', 'Bug Cookies', 'Bug Cookies', 'Biscuits aux insectes'),
('food', 'Butterfly Salad', 'Butterfly Salad', 'Salade aux papillons'),
('food', 'Butterfly Snacks', 'Butterfly Snacks', 'Friandises aux papillons'),
('food', 'Canned Meat', 'Canned Meat', 'Viande en conserve'),
('food', 'Carrots', 'Carrots', 'Carottes'),
('food', 'Chashu Pork', 'Chashu Pork', 'Porc chashu'),
('food', 'Che Thai', 'Che Thai', 'Chè thaï'),
('food', 'Cherry', 'Cherry', 'Cerise'),
('food', 'Chicken Steak', 'Chicken Steak', 'Steak de poulet'),
('food', 'Corn', 'Corn', 'Maïs'),
('food', 'Corn Flakes', 'Corn Flakes', 'Flocons de maïs'),
('food', 'Default pellets', 'Default pellets', 'Granulés classiques'),
('food', 'Flower Drops', 'Flower Drops', 'Bonbons aux fleurs'),
('food', 'Flower Syrup', 'Flower Syrup', 'Sirop de fleurs'),
('food', 'Fried Fish', 'Fried Fish', 'Poisson frit'),
('food', 'Frozen Meat', 'Frozen Meat', 'Viande congelée'),
('food', 'Fruit Jelly', 'Fruit Jelly', 'Gelée de fruits'),
('food', 'Green Seaweed', 'Green Seaweed', 'Algues vertes'),
('food', 'Grilled Shellfish', 'Grilled Shellfish', 'Coquillages grillés'),
('food', 'Hawaiian Burger', 'Hawaiian Burger', 'Burger hawaïen'),
('food', 'Honey Syrup', 'Honey Syrup', 'Sirop de miel'),
('food', 'Hot Tea with Jam', 'Hot Tea with Jam', 'Thé chaud à la confiture'),
('food', 'Meal Bugs', 'Meal Bugs', 'Repas d’insectes'),
('food', 'Meal Critters', 'Meal Critters', 'Repas de petites bêtes'),
('food', 'Meal Plankton', 'Meal Plankton', 'Repas de plancton'),
('food', 'Meal Shrimp', 'Meal Shrimp', 'Repas de crevettes'),
('food', 'Meal Worms', 'Meal Worms', 'Repas de vers'),
('food', 'Northern Seafood', 'Northern Seafood', 'Fruits de mer nordiques'),
('food', 'Peking Meat', 'Peking Meat', 'Viande à la pékinoise'),
('food', 'Persimmon', 'Persimmon', 'Kaki'),
('food', 'Piece of Chicken', 'Piece of Chicken', 'Morceau de poulet'),
('food', 'Piece of Corn', 'Piece of Corn', 'Morceau de maïs'),
('food', 'Plankton Dumplings', 'Plankton Dumplings', 'Raviolis au plancton'),
('food', 'Pomegranate', 'Pomegranate', 'Grenade'),
('food', 'Red Berries', 'Red Berries', 'Baies rouges'),
('food', 'Red Seaweed', 'Red Seaweed', 'Algues rouges'),
('food', 'Salmon Roe', 'Salmon Roe', 'Œufs de saumon'),
('food', 'Seafood', 'Seafood', 'Fruits de mer'),
('food', 'Seaweed Salad', 'Seaweed Salad', 'Salade d’algues'),
('food', 'Sesame Leaves', 'Sesame Leaves', 'Feuilles de sésame'),
('food', 'Sesame Pancake', 'Sesame Pancake', 'Galette au sésame'),
('food', 'Shellfish', 'Shellfish', 'Coquillages'),
('food', 'Shredded Carrots', 'Shredded Carrots', 'Carottes râpées'),
('food', 'Small Meat', 'Small Meat', 'Petite portion de viande'),
('food', 'Steak', 'Steak', 'Steak'),
('food', 'Tropical Fruits', 'Tropical Fruits', 'Fruits tropicaux'),
('food', 'Tropical Patty', 'Tropical Patty', 'Galette tropicale'),
('food', 'Tropical Steak', 'Tropical Steak', 'Steak tropical'),
('food', 'Warm Buns', 'Warm Buns', 'Petits pains chauds'),
('food', 'Whole Chicken', 'Whole Chicken', 'Poulet entier'),
('food', 'alimentation mixte', 'alimentation mixte', 'Alimentation variée')
on conflict (category,key) do update
set value_en=excluded.value_en, value_fr=excluded.value_fr, updated_at=now();

create table if not exists public.active_raisings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_tamagotchi_id uuid not null references public.tamagotchis(id) on delete cascade,
  current_tama_name text,
  device_label text,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists active_raisings_user_status_idx
on public.active_raisings(user_id,status);

alter table public.active_raisings enable row level security;

drop policy if exists "Users manage own raisings" on public.active_raisings;
create policy "Users manage own raisings"
on public.active_raisings
for all to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

grant select, insert, update, delete on public.active_raisings to authenticated;

create table if not exists public.raising_actions (
  id uuid primary key default gen_random_uuid(),
  raising_id uuid not null references public.active_raisings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null,
  action_key text,
  label text,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 100),
  created_at timestamptz not null default now()
);

create index if not exists raising_actions_raising_idx
on public.raising_actions(raising_id,created_at);

alter table public.raising_actions enable row level security;

drop policy if exists "Users manage own raising actions" on public.raising_actions;
create policy "Users manage own raising actions"
on public.raising_actions
for all to authenticated
using (
  user_id=auth.uid()
  and exists (
    select 1 from public.active_raisings r
    where r.id=raising_id and r.user_id=auth.uid()
  )
)
with check (
  user_id=auth.uid()
  and exists (
    select 1 from public.active_raisings r
    where r.id=raising_id and r.user_id=auth.uid()
  )
);

grant select, insert, update, delete on public.raising_actions to authenticated;

select
  (select count(*) from public.app_admins) as admins,
  (select count(*) from public.app_translations where category='food') as traductions_repas,
  (select count(*) from public.app_translations where category='action') as traductions_actions;
