-- Categorías
insert into categorias (nombre, slug, orden) values
  ('Cerveza',    'cerveza',   1),
  ('Tequila',    'tequila',   2),
  ('Vino',       'vino',      3),
  ('Whisky',     'whisky',    4),
  ('Mezcal',     'mezcal',    5),
  ('Ron',        'ron',       6),
  ('Vodka',      'vodka',     7),
  ('Mezcladores','mezcladores',8);

-- Productos (usa imágenes de placeholder por ahora)
insert into productos (nombre, descripcion, precio, imagen_url, categoria_id, stock) values
  -- Cerveza
  ('Corona 355ml', 'La clásica cerveza mexicana bien fría.', 28.00,
   'https://placehold.co/400x400/C0392B/F5F0E0?text=Corona', (select id from categorias where slug='cerveza'), 100),
  ('Modelo Especial 355ml', 'Sabor único, la favorita de México.', 30.00,
   'https://placehold.co/400x400/C0392B/F5F0E0?text=Modelo', (select id from categorias where slug='cerveza'), 100),
  ('Indio 355ml', 'Cerveza oscura de malta con carácter.', 28.00,
   'https://placehold.co/400x400/C0392B/F5F0E0?text=Indio', (select id from categorias where slug='cerveza'), 80),

  -- Tequila
  ('José Cuervo Especial 750ml', 'Tequila dorado suave y versátil.', 185.00,
   'https://placehold.co/400x400/1E8449/F5F0E0?text=Cuervo', (select id from categorias where slug='tequila'), 40),
  ('Herradura Reposado 750ml', 'Agave 100%, notas a vainilla y roble.', 420.00,
   'https://placehold.co/400x400/1E8449/F5F0E0?text=Herradura', (select id from categorias where slug='tequila'), 25),

  -- Vino
  ('Vino Tinto Calafia 750ml', 'Vino de Baja California, notas a frutos rojos.', 120.00,
   'https://placehold.co/400x400/8E44AD/F5F0E0?text=Calafia+Tinto', (select id from categorias where slug='vino'), 30),
  ('Vino Blanco Santa Rita 750ml', 'Fresco y afrutado, ideal para el calor.', 110.00,
   'https://placehold.co/400x400/8E44AD/F5F0E0?text=Santa+Rita', (select id from categorias where slug='vino'), 30),

  -- Whisky
  ('Jack Daniel''s 750ml', 'Tennessee Whiskey, suave y ahumado.', 380.00,
   'https://placehold.co/400x400/E8B84B/2C2C2C?text=Jack+Daniels', (select id from categorias where slug='whisky'), 20),
  ('Buchanan''s Deluxe 750ml', 'Scotch blended de lujo, muy popular en México.', 480.00,
   'https://placehold.co/400x400/E8B84B/2C2C2C?text=Buchanans', (select id from categorias where slug='whisky'), 15),

  -- Mezcal
  ('Del Maguey Vida 750ml', 'Mezcal artesanal de Oaxaca, ahumado intenso.', 350.00,
   'https://placehold.co/400x400/C0392B/F5F0E0?text=Del+Maguey', (select id from categorias where slug='mezcal'), 20),

  -- Ron
  ('Bacardí Carta Blanca 750ml', 'Ron blanco ligero, perfecto para cocteles.', 170.00,
   'https://placehold.co/400x400/1E8449/F5F0E0?text=Bacardi', (select id from categorias where slug='ron'), 35),

  -- Vodka
  ('Smirnoff 750ml', 'Vodka triple destilado, clásico y versátil.', 160.00,
   'https://placehold.co/400x400/2980B9/F5F0E0?text=Smirnoff', (select id from categorias where slug='vodka'), 40);
