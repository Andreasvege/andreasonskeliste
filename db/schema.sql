-- Reservasjoner. Lagrer ALDRI navn, IP, user agent eller annet om gjesten.
create table if not exists reservations (
  id          uuid primary key default gen_random_uuid(),
  item_id     text not null,
  exclusive   boolean not null,          -- true for vanlige ønsker, false for multi
  token_hash  text not null,             -- sha256 av angre-koden, aldri selve koden
  created_at  timestamptz not null default now()
);
create index if not exists reservations_item_idx on reservations (item_id);
-- Hindrer at to personer tar samme vanlige ønske samtidig (race-sikkert):
create unique index if not exists reservations_exclusive_once on reservations (item_id) where exclusive;
