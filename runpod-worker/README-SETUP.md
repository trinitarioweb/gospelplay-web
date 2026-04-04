# Setup RunPod Serverless - Pixar Colombia Generator

## Paso 1: Crear cuenta en RunPod
1. Ve a https://runpod.io y crea una cuenta
2. Agrega crédito ($10-25 para empezar)
3. Ve a Settings > API Keys > Create API Key
4. Copia el API Key

## Paso 2: Preparar imágenes de referencia
Crea una carpeta `jugadores/` dentro de `runpod-worker/` con las fotos:
```
runpod-worker/
  jugadores/
    james_rodriguez_ref.png
    luis_diaz_ref.png
    falcao_ref.png
    cuadrado_ref.png
    ospina_ref.png
    arias_ref.png
```
Usa fotos claras del rostro de cada jugador (mínimo 512x512).

## Paso 3: Build y push Docker image

```bash
# Instalar Docker si no lo tienes
# https://docs.docker.com/get-docker/

# Login en Docker Hub (o usa RunPod registry)
docker login

# Build la imagen (toma ~30min por los modelos)
cd runpod-worker
docker build -t tu-usuario/comfyui-pixar-colombia:v1 .

# Push
docker push tu-usuario/comfyui-pixar-colombia:v1
```

**NOTA**: La imagen será grande (~15-20GB) por los modelos incluidos.
Alternativa: usar Network Volume en RunPod para los modelos.

## Paso 4: Crear Serverless Endpoint en RunPod

1. Ve a https://runpod.io/console/serverless
2. Click "New Endpoint"
3. Configurar:
   - **Name**: pixar-colombia
   - **Docker Image**: `tu-usuario/comfyui-pixar-colombia:v1`
   - **GPU**: RTX 4090 (24GB) o RTX A5000 (24GB)
   - **Min Workers**: 0 (escala a cero cuando no hay uso)
   - **Max Workers**: 3 (o lo que necesites)
   - **Idle Timeout**: 5 seconds
   - **Execution Timeout**: 300 seconds
   - **Flash Boot**: Enabled (carga más rápido)
4. Click "Create"
5. Copia el **Endpoint ID** (ej: `abc123def456`)

## Paso 5: Configurar la app

En tu `.env.local`:
```
RUNPOD_API_KEY=rpa_XXXXXXXXXXXXXXXX
RUNPOD_ENDPOINT_ID=abc123def456
```

## Paso 6: Probar

```bash
# Desde la carpeta del proyecto Next.js
npm run dev

# Abre http://localhost:3000/pixar
```

## Costos estimados

| Concepto | Costo |
|----------|-------|
| RTX 4090 serverless | ~$0.00069/s (~$2.50/hr activo) |
| Generación por imagen | ~60-120s = ~$0.04-0.08 |
| Gemini API (dentro del workflow) | ~$0.01/imagen |
| GPT-4.1 (prompt generation) | ~$0.005/imagen |
| **Total por imagen** | **~$0.06-0.10** |
| Storage (idle) | $0 (escala a 0) |

## Alternativa: Network Volume (más rápido)

En vez de meter los modelos en Docker, puedes:
1. Crear un Network Volume en RunPod (50GB, ~$5/mes)
2. Subir modelos allí una vez
3. Docker image más ligera (solo código + custom nodes)
4. Cold start más rápido

## Troubleshooting

- **Cold start lento (~2-3min)**: Normal la primera vez. Flash Boot ayuda.
- **OOM (Out of Memory)**: Usa GPU de 24GB mínimo.
- **Custom node error**: Verificar que todos los repos en Dockerfile estén actualizados.
- **API keys de OpenAI/Gemini**: Se configuran dentro de ComfyUI.
  Agregar al Dockerfile: `ENV OPENAI_API_KEY=xxx` y `ENV GOOGLE_API_KEY=xxx`
