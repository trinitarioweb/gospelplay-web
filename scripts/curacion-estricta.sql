-- CURACIÓN ESTRICTA - Generado 2026-03-27T20:10:58.071Z
-- Artistas a eliminar: 10
-- Contenido basura: 1

-- Eliminar contenido de artistas 1-10
DELETE FROM contenido WHERE artista_id IN ('305a647e-6d32-4c3d-a969-35aa9294c629','238fc433-db8e-4b94-b3e4-d640688dacfa','78f24755-fc46-46d3-8255-b6f463999e05','f78e4620-4da6-44c8-aeab-82217008ebaa','91432593-ed5d-462d-bd02-167d37fc26bd','af56b54d-1d31-44dd-9d66-8fee9598f770','1ba6d836-01d8-4684-94a3-b67791be2c82','a8c0eb0b-8380-47e0-b207-322bf566b9ad','7d3abb8d-f480-4707-bd97-c201de3358a5','c21527fa-a3c8-4d19-8ee2-425eca3e3f3e');

-- Eliminar artistas 1-10
DELETE FROM artistas WHERE id IN ('305a647e-6d32-4c3d-a969-35aa9294c629','238fc433-db8e-4b94-b3e4-d640688dacfa','78f24755-fc46-46d3-8255-b6f463999e05','f78e4620-4da6-44c8-aeab-82217008ebaa','91432593-ed5d-462d-bd02-167d37fc26bd','af56b54d-1d31-44dd-9d66-8fee9598f770','1ba6d836-01d8-4684-94a3-b67791be2c82','a8c0eb0b-8380-47e0-b207-322bf566b9ad','7d3abb8d-f480-4707-bd97-c201de3358a5','c21527fa-a3c8-4d19-8ee2-425eca3e3f3e');

-- Eliminar contenido basura de artistas buenos
DELETE FROM contenido WHERE id IN ('e10e055f-2a80-42d6-9aa5-a0a7e5f2bae5');

-- Verificar resultado:
SELECT 'Artistas' as tabla, count(*) as total FROM artistas
UNION ALL
SELECT 'Contenido', count(*) FROM contenido;