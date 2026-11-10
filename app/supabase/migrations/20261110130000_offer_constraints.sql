-- Reglas de una oferta válida, también en el servidor (el formulario no es la única puerta).
alter table public.offers
  add constraint offers_title_length check (char_length(btrim(title)) between 1 and 80),
  add constraint offers_description_length check (description is null or char_length(description) <= 200),
  add constraint offers_days_not_empty check (cardinality(days_of_week) > 0);
