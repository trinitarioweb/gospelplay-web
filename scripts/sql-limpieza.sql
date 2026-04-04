-- GOSPELPLAY: SQL DE LIMPIEZA DE ARTISTAS
-- Artistas a eliminar: 119
-- Ejecutar en Supabase Dashboard > SQL Editor

-- Primero eliminar contenido
DELETE FROM contenido WHERE artista_id IN (
  'ec6f10b1-daf6-4241-ad1f-1daca61380e2',
  '0abd3154-6ccc-423f-be37-217936157363',
  '9cc90dbb-d96f-4623-9160-6fbe83fcccd3',
  '1510a6a1-42a4-4b68-9dc3-5d2d6efa0427',
  '17880e58-0f32-44e5-8a06-87ccf906569d',
  'ea5a7aea-3b98-4935-a315-8fe40f3fbe75',
  '6c39f046-82b8-49e9-8940-c5c5441475db',
  '7e68e63e-a984-4d92-80ee-4a985c46dd62',
  '2ef22462-2446-48f7-8273-61fdc0adda4c',
  '5f8db7ff-66fe-47a9-bba9-9c57936e2667',
  'cb9cd0c8-3fcb-48d7-8193-2183f89e1cf1',
  'f6e11784-c445-4487-8987-e6bb5c04a4fb',
  '31be2818-6ef4-4e1d-a0cd-0089340bb38f',
  '6900c95f-5dea-4ab4-a99d-0bee6ca31802',
  '194a61eb-e87a-4185-8729-7f7f37ccb9a4',
  '20c4615b-995b-4cd8-b299-326fc5db3bfe',
  '4e66b4c8-d85b-4d3d-97da-cdbbc4178113',
  '935bbe13-462d-4722-9869-8df9d76e8364',
  '176fbdda-11b9-48c1-89e8-4d190593a8c2',
  'ac864321-45a6-47e3-8b0b-6aa245e4b274',
  'e9ee2ad8-fffd-47c9-b81b-fa8a6911ee07',
  'c93bd9a0-070a-40ee-bac2-3b013623eff0',
  'edaa893f-dc69-4d30-b043-cbb4d3751904',
  '596da96f-5e6b-4fb4-89d2-319cdfbcb0e7',
  'f2955d45-18cf-4947-bb1e-f7469a6274cc',
  'a07b925d-7e54-4fe2-81d2-f44000cb5acb',
  '3681ca4c-ab34-4094-b659-1ec8ad848117',
  '2fd8b541-edb0-4c5b-b8e2-ebeb0d45100e',
  'db4ce275-52e2-4e08-8b87-1c6eb91d6937',
  'f59f381c-edec-4952-a436-cc86a69e5886',
  '723c0175-ecde-467a-b114-044f6c704d40',
  '8a7c170f-e4a1-451c-be9c-e858f4bc871d',
  '717c19a4-e275-4f0c-abd6-ecc3c59e09b0',
  '9d3ebde0-c69e-4a76-ae6b-ecdcca17b059',
  '176b4545-10c1-49f8-a7c7-0f78732cd305',
  '8f68791e-731a-4aaf-b475-ca18bf4b1e83',
  '5b19e612-279f-42ac-b582-cbe8ea3e73a8',
  '32ddb044-796c-4524-b725-026f2804dac9',
  '06f5b85a-8127-42f4-acf7-bb04e3311718',
  '3e8b9b92-8998-496a-b96a-7e87f8fbb39d',
  '10490818-997e-42a2-aed2-165574aa3f2f',
  '408a57db-7a87-4744-bb2b-5850f84dacc3',
  '453138df-2733-4fda-a516-8d93e419772b',
  'b0fbd513-7948-443e-b4ab-a07fabdbce6c',
  '635bac4f-48ef-4628-9479-661521ad7ce1',
  '946370bb-9e41-4778-b7ae-c599b6b023cd',
  '13881920-4a6d-4eb7-986d-cd5e962af79f',
  '419c57d8-cf15-44be-8146-cde4d63b3cba',
  '6fd7ca0c-45b9-4c4b-a214-c8859c4bfd81',
  'ee2811d5-c5b1-496c-b107-5f460ddbbd07',
  '788db2a4-0032-45ab-a2df-383140b0841d',
  '7f756c46-4ab9-47ee-bcb0-0ba2278d3496',
  '1efbaa44-e9f0-4e6a-b6b9-ec87b010f547',
  '4fc975be-a0a6-4953-b84b-2928e32305c1',
  '66d7a3cb-5ae0-4692-977d-45ffa82cbca4',
  '8db9a107-1d87-44d0-95a8-4a3256030288',
  '6db47ee6-5c6b-48b4-b858-4077f1c4712c',
  '1daf1118-3417-443c-b6c9-cef67c6b38cc',
  '96afccf7-71f3-499a-b251-3479ba4ef9c6',
  '7b531d34-2854-4e2c-a29e-836287c52bf1',
  'b63a68e5-f2ad-4b5d-a603-251e948be5ff',
  '29d8d17d-a0c4-4ebe-a108-4600e47024ee',
  '1bf18571-d47b-4e9e-89bb-c32bc272aac2',
  '94b7c4fd-adef-43dd-bf54-291f1c7f4746',
  '795e4883-673c-43e4-8914-5c233991e5ee',
  '83086a15-b867-43fa-965b-485ba5d90e62',
  'a16681dd-0da7-49f7-82a5-1c861d782b76',
  '9f86b82b-b095-474d-a177-0bd26596a645',
  '8e3faf57-62cb-4365-882f-c6f9e3dd0c9a',
  'eb525959-caf3-4a89-87e8-eac98f51031a',
  '4f7d1fe9-bfa7-45ee-800a-9ee755db9618',
  '51202ec3-6b74-44c9-8309-79407ef8949b',
  '512014ef-b8da-41a4-92c9-eeef3749670b',
  '10c174c9-2903-4a20-9ef1-fc5fab702ecc',
  '9dbc92ed-1032-488a-a947-7ae2cc9c0075',
  'ebf1d765-c6de-4660-8749-22df3894d44c',
  '3fe62036-fb49-4602-ab54-3672d8d0a38a',
  '3657f756-2d44-4958-b775-373ff516e042',
  '0d74945d-2b84-43f8-9ea6-75e447903444',
  '256ec9a1-f111-4e09-9c2e-9f0c7a9ea6e0',
  '6af2bff5-1c43-43ff-a1f3-83457975c9e4',
  'f7001904-17cd-410e-9a2e-78b8dc94d89e',
  'c9255aa1-ea7b-4a70-87f8-a1bc1e1421eb',
  '3766d151-3159-4e88-897d-f2299d438c19',
  '30e54bb5-d0df-4174-a159-38daca271331',
  'aeb5c0fd-9769-4f04-ba4f-9e16a7b4bdd4',
  '7aaffe9e-7681-45fb-aef4-91c957348a12',
  'd7300d45-d87d-4261-bce6-5d8fed221364',
  '366597a9-56cd-4523-b2ca-abe7aa141596',
  '979fe3a1-1559-4584-b07d-3d3349d63325',
  'd268bea7-2452-433c-a158-906b9b87ab9f',
  'e018fd7b-9ca0-4342-b6e0-4905446c9255',
  'bf5d6bcc-7d2a-4687-a1e6-31c52b537cf5',
  '03324100-a0c7-447c-8c16-b3e020b82a59',
  '0c940835-1102-4571-8073-3d47d9137b10',
  'd8650d01-8de8-4e4b-8f15-8d42655339dd',
  '8d889ad1-5c16-47a2-9aca-22a749feabdd',
  '9e9bbcaf-c29a-4938-8d9f-05c432db5b7b',
  '3613c7c2-d4f0-4694-90f0-a024568226a4',
  '9236a651-f3ab-4d5f-8905-f3b800bf00c9',
  '38a45498-fd5e-4b50-a305-129b4c6965ad',
  '01ba1448-9c86-4b02-9a8c-594beaf27774',
  '2634cf40-412d-4d58-baaf-022d63cdbed1',
  '65252020-09e5-42e9-bdf8-fb3cd9547388',
  'b861da84-9b29-4748-b578-0cd62600d72c',
  'cc9cccbd-a28e-4508-838c-f2df46c9ac4b',
  '895c91fb-5a7d-4e59-985d-6f19e08b760e',
  '38a2408e-2b42-4520-8e63-d8e982cda6f3',
  '6a16a8be-f3e8-49f8-a2af-12338cc222c6',
  '479017d0-59c6-41b7-ba9c-8196e6b68edb',
  '7a11a6ee-c715-4eac-baba-a10f1dad3ab7',
  '267242e6-4b15-4e12-8429-5bef44fe76b9',
  'd894723d-4839-484a-93db-85717acb2b95',
  'c6cedbe6-5fa6-4557-9ffa-92857b4c1ee5',
  'd98ea9ec-8f62-46d2-a1a5-713dd03fe15a',
  '484b0795-6ea7-4337-9cca-73d5c4bc5cad',
  '734a88e2-e51b-4e5e-b44e-152a17e5767a',
  '3b3a3918-ed3d-4d02-896d-6b1799010ed1',
  'ddb0e90c-c012-48e4-9569-8bd3aafbe868'
);

-- Luego eliminar artistas
DELETE FROM artistas WHERE id IN (
  'ec6f10b1-daf6-4241-ad1f-1daca61380e2',
  '0abd3154-6ccc-423f-be37-217936157363',
  '9cc90dbb-d96f-4623-9160-6fbe83fcccd3',
  '1510a6a1-42a4-4b68-9dc3-5d2d6efa0427',
  '17880e58-0f32-44e5-8a06-87ccf906569d',
  'ea5a7aea-3b98-4935-a315-8fe40f3fbe75',
  '6c39f046-82b8-49e9-8940-c5c5441475db',
  '7e68e63e-a984-4d92-80ee-4a985c46dd62',
  '2ef22462-2446-48f7-8273-61fdc0adda4c',
  '5f8db7ff-66fe-47a9-bba9-9c57936e2667',
  'cb9cd0c8-3fcb-48d7-8193-2183f89e1cf1',
  'f6e11784-c445-4487-8987-e6bb5c04a4fb',
  '31be2818-6ef4-4e1d-a0cd-0089340bb38f',
  '6900c95f-5dea-4ab4-a99d-0bee6ca31802',
  '194a61eb-e87a-4185-8729-7f7f37ccb9a4',
  '20c4615b-995b-4cd8-b299-326fc5db3bfe',
  '4e66b4c8-d85b-4d3d-97da-cdbbc4178113',
  '935bbe13-462d-4722-9869-8df9d76e8364',
  '176fbdda-11b9-48c1-89e8-4d190593a8c2',
  'ac864321-45a6-47e3-8b0b-6aa245e4b274',
  'e9ee2ad8-fffd-47c9-b81b-fa8a6911ee07',
  'c93bd9a0-070a-40ee-bac2-3b013623eff0',
  'edaa893f-dc69-4d30-b043-cbb4d3751904',
  '596da96f-5e6b-4fb4-89d2-319cdfbcb0e7',
  'f2955d45-18cf-4947-bb1e-f7469a6274cc',
  'a07b925d-7e54-4fe2-81d2-f44000cb5acb',
  '3681ca4c-ab34-4094-b659-1ec8ad848117',
  '2fd8b541-edb0-4c5b-b8e2-ebeb0d45100e',
  'db4ce275-52e2-4e08-8b87-1c6eb91d6937',
  'f59f381c-edec-4952-a436-cc86a69e5886',
  '723c0175-ecde-467a-b114-044f6c704d40',
  '8a7c170f-e4a1-451c-be9c-e858f4bc871d',
  '717c19a4-e275-4f0c-abd6-ecc3c59e09b0',
  '9d3ebde0-c69e-4a76-ae6b-ecdcca17b059',
  '176b4545-10c1-49f8-a7c7-0f78732cd305',
  '8f68791e-731a-4aaf-b475-ca18bf4b1e83',
  '5b19e612-279f-42ac-b582-cbe8ea3e73a8',
  '32ddb044-796c-4524-b725-026f2804dac9',
  '06f5b85a-8127-42f4-acf7-bb04e3311718',
  '3e8b9b92-8998-496a-b96a-7e87f8fbb39d',
  '10490818-997e-42a2-aed2-165574aa3f2f',
  '408a57db-7a87-4744-bb2b-5850f84dacc3',
  '453138df-2733-4fda-a516-8d93e419772b',
  'b0fbd513-7948-443e-b4ab-a07fabdbce6c',
  '635bac4f-48ef-4628-9479-661521ad7ce1',
  '946370bb-9e41-4778-b7ae-c599b6b023cd',
  '13881920-4a6d-4eb7-986d-cd5e962af79f',
  '419c57d8-cf15-44be-8146-cde4d63b3cba',
  '6fd7ca0c-45b9-4c4b-a214-c8859c4bfd81',
  'ee2811d5-c5b1-496c-b107-5f460ddbbd07',
  '788db2a4-0032-45ab-a2df-383140b0841d',
  '7f756c46-4ab9-47ee-bcb0-0ba2278d3496',
  '1efbaa44-e9f0-4e6a-b6b9-ec87b010f547',
  '4fc975be-a0a6-4953-b84b-2928e32305c1',
  '66d7a3cb-5ae0-4692-977d-45ffa82cbca4',
  '8db9a107-1d87-44d0-95a8-4a3256030288',
  '6db47ee6-5c6b-48b4-b858-4077f1c4712c',
  '1daf1118-3417-443c-b6c9-cef67c6b38cc',
  '96afccf7-71f3-499a-b251-3479ba4ef9c6',
  '7b531d34-2854-4e2c-a29e-836287c52bf1',
  'b63a68e5-f2ad-4b5d-a603-251e948be5ff',
  '29d8d17d-a0c4-4ebe-a108-4600e47024ee',
  '1bf18571-d47b-4e9e-89bb-c32bc272aac2',
  '94b7c4fd-adef-43dd-bf54-291f1c7f4746',
  '795e4883-673c-43e4-8914-5c233991e5ee',
  '83086a15-b867-43fa-965b-485ba5d90e62',
  'a16681dd-0da7-49f7-82a5-1c861d782b76',
  '9f86b82b-b095-474d-a177-0bd26596a645',
  '8e3faf57-62cb-4365-882f-c6f9e3dd0c9a',
  'eb525959-caf3-4a89-87e8-eac98f51031a',
  '4f7d1fe9-bfa7-45ee-800a-9ee755db9618',
  '51202ec3-6b74-44c9-8309-79407ef8949b',
  '512014ef-b8da-41a4-92c9-eeef3749670b',
  '10c174c9-2903-4a20-9ef1-fc5fab702ecc',
  '9dbc92ed-1032-488a-a947-7ae2cc9c0075',
  'ebf1d765-c6de-4660-8749-22df3894d44c',
  '3fe62036-fb49-4602-ab54-3672d8d0a38a',
  '3657f756-2d44-4958-b775-373ff516e042',
  '0d74945d-2b84-43f8-9ea6-75e447903444',
  '256ec9a1-f111-4e09-9c2e-9f0c7a9ea6e0',
  '6af2bff5-1c43-43ff-a1f3-83457975c9e4',
  'f7001904-17cd-410e-9a2e-78b8dc94d89e',
  'c9255aa1-ea7b-4a70-87f8-a1bc1e1421eb',
  '3766d151-3159-4e88-897d-f2299d438c19',
  '30e54bb5-d0df-4174-a159-38daca271331',
  'aeb5c0fd-9769-4f04-ba4f-9e16a7b4bdd4',
  '7aaffe9e-7681-45fb-aef4-91c957348a12',
  'd7300d45-d87d-4261-bce6-5d8fed221364',
  '366597a9-56cd-4523-b2ca-abe7aa141596',
  '979fe3a1-1559-4584-b07d-3d3349d63325',
  'd268bea7-2452-433c-a158-906b9b87ab9f',
  'e018fd7b-9ca0-4342-b6e0-4905446c9255',
  'bf5d6bcc-7d2a-4687-a1e6-31c52b537cf5',
  '03324100-a0c7-447c-8c16-b3e020b82a59',
  '0c940835-1102-4571-8073-3d47d9137b10',
  'd8650d01-8de8-4e4b-8f15-8d42655339dd',
  '8d889ad1-5c16-47a2-9aca-22a749feabdd',
  '9e9bbcaf-c29a-4938-8d9f-05c432db5b7b',
  '3613c7c2-d4f0-4694-90f0-a024568226a4',
  '9236a651-f3ab-4d5f-8905-f3b800bf00c9',
  '38a45498-fd5e-4b50-a305-129b4c6965ad',
  '01ba1448-9c86-4b02-9a8c-594beaf27774',
  '2634cf40-412d-4d58-baaf-022d63cdbed1',
  '65252020-09e5-42e9-bdf8-fb3cd9547388',
  'b861da84-9b29-4748-b578-0cd62600d72c',
  'cc9cccbd-a28e-4508-838c-f2df46c9ac4b',
  '895c91fb-5a7d-4e59-985d-6f19e08b760e',
  '38a2408e-2b42-4520-8e63-d8e982cda6f3',
  '6a16a8be-f3e8-49f8-a2af-12338cc222c6',
  '479017d0-59c6-41b7-ba9c-8196e6b68edb',
  '7a11a6ee-c715-4eac-baba-a10f1dad3ab7',
  '267242e6-4b15-4e12-8429-5bef44fe76b9',
  'd894723d-4839-484a-93db-85717acb2b95',
  'c6cedbe6-5fa6-4557-9ffa-92857b4c1ee5',
  'd98ea9ec-8f62-46d2-a1a5-713dd03fe15a',
  '484b0795-6ea7-4337-9cca-73d5c4bc5cad',
  '734a88e2-e51b-4e5e-b44e-152a17e5767a',
  '3b3a3918-ed3d-4d02-896d-6b1799010ed1',
  'ddb0e90c-c012-48e4-9569-8bd3aafbe868'
);

-- 100 Portraits
-- 2metro
-- Alistair Begg
-- Altadena
-- Andres Spyker
-- Andy Cherry
-- Anguidara
-- Antoine Bradford
-- Arturo Perez
-- Audiovision
-- Battz
-- Bob Young Band
-- Caesura Surrender
-- Chris Staples
-- Christine D'Clario
-- City Harbor
-- Coalicion por el Evangelio
-- Coffey Anderson
-- Dave Mendoza
-- David & Carrie Grant
-- David Barcelo
-- David Potter
-- Definitely D
-- Desiring God Espanol
-- Diana Baciu
-- Diego Cardona
-- Don Ready
-- Eclipse rock
-- Eduardo Mano e Os Tapetes Voadores
-- Electronic Soapbox
-- Emerson A.S.
-- Emilio Ramos
-- Esteban Borghetti
-- Fabian Liendo
-- feeds@ancientfaith.com (Fr. Andrew Stephen Damick and Ancient Faith Radio)
-- for KING & COUNTRY
-- Fr. Andrew Stephen Damick and Ancient Faith Radio
-- Freakshift Dialect
-- Fred Hammond & Radical For Christ
-- Gilbert Morales Zayas
-- Gio.
-- Hanjo Gäbler
-- Har Megiddo
-- Harmony
-- Hillsong Young & Free
-- Holy Blood
-- Hopeful.
-- Itiel Arroyo
-- Jairo Namnun
-- Jervis Campbell
-- JJared Worship.
-- Joe Christmas
-- John MacArthur
-- Josh Garrels & Mason Jar Music
-- Josue Barrios
-- Kirk Franklin and the Family
-- Kosmos Express
-- Kris Morris
-- Lee Vasi
-- LIRIKEOTV
-- marjane-
-- Michael Zopf
-- Miel San Marcos Feat Lowsan
-- Miguel Nunez
-- Mr. Weaverface
-- Música Cristiana
-- Nacho
-- Nesk Only
-- No Resolve
-- Off Road Minivan
-- One4All
-- Onitsha
-- Parable
-- Paul Budde
-- PBnJ Band
-- Perlla
-- Perry & the Poor Boys
-- Perry and the Poor Boys
-- Pneuma
-- R.C. Sproul
-- Rage of Angels
-- Randy Adams Band
-- Red Tips
-- redimi2oficial
-- Reenukumar - Official y Timothy Sharan
-- Retain
-- Roger Hoffman
-- Romance Sideral
-- Ruth Mixter
-- Sam Cooke
-- Sarah Drizen
-- Sarza the South
-- Shane & Shane
-- Shivali
-- Sondae
-- Sounds Of Blackness
-- Stephen Stanley
-- Steve Taylor & The Danielson Foil
-- Strings & Heart
-- Sugel Michelen
-- Sunday Service Choir
-- The Dry Leaf Project
-- The Gravity Show
-- The Ineloquent
-- The Northern Conspiracy
-- The Recovering Catholic
-- The Staple Singers
-- The Way
-- Theories Of Gabriela
-- TRANSBOARD
-- TwinTip
-- Tylynn
-- V*enna
-- vaesoficial
-- VIP
-- Voddie Baucham
-- wise crash
-- World Worship
-- Young C
