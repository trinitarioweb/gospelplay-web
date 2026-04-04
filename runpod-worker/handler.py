"""
RunPod Serverless Handler para ComfyUI - Generador Pixar Colombia

Este handler:
1. Inicia ComfyUI como subprocess
2. Recibe requests via RunPod serverless
3. Sube la imagen del usuario a ComfyUI
4. Ejecuta el workflow
5. Retorna la imagen generada en base64
"""

import runpod
import subprocess
import time
import json
import urllib.request
import urllib.parse
import base64
import os
import io
import sys

COMFYUI_PATH = os.environ.get("COMFYUI_PATH", "/comfyui")
COMFYUI_PORT = 8188
COMFYUI_URL = f"http://127.0.0.1:{COMFYUI_PORT}"

# ===== Iniciar ComfyUI =====
comfy_process = None


def start_comfyui():
    global comfy_process
    if comfy_process is not None:
        return

    print("Iniciando ComfyUI...")
    comfy_process = subprocess.Popen(
        [
            sys.executable, "main.py",
            "--listen", "127.0.0.1",
            "--port", str(COMFYUI_PORT),
            "--disable-auto-launch",
        ],
        cwd=COMFYUI_PATH,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    # Esperar a que ComfyUI esté listo
    for _ in range(120):  # Max 2 min
        try:
            urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2)
            print("ComfyUI listo!")
            return
        except Exception:
            time.sleep(1)

    raise RuntimeError("ComfyUI no pudo iniciar en 2 minutos")


# ===== Helpers =====

def upload_image(image_base64: str, filename: str) -> str:
    """Sube imagen base64 a ComfyUI, retorna el filename asignado."""
    image_bytes = base64.b64decode(image_base64)

    boundary = "----FormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + image_bytes + f"\r\n--{boundary}\r\n".encode() + (
        f'Content-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n'
        f"--{boundary}--\r\n"
    ).encode()

    req = urllib.request.Request(
        f"{COMFYUI_URL}/upload/image",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        return data["name"]


def queue_prompt(workflow: dict) -> str:
    """Encola un workflow y retorna el prompt_id."""
    payload = json.dumps({
        "prompt": workflow,
        "client_id": f"runpod-{int(time.time())}"
    }).encode()

    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        return data["prompt_id"]


def wait_for_result(prompt_id: str, timeout: int = 180) -> list[bytes]:
    """Polling hasta obtener imágenes de resultado."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            url = f"{COMFYUI_URL}/history/{prompt_id}"
            with urllib.request.urlopen(url) as resp:
                history = json.loads(resp.read())

            if prompt_id not in history:
                time.sleep(2)
                continue

            entry = history[prompt_id]

            if entry.get("status", {}).get("status_str") == "error":
                msgs = entry.get("status", {}).get("messages", [])
                raise RuntimeError(f"ComfyUI error: {msgs}")

            outputs = entry.get("outputs", {})
            # Buscar el nodo SaveImage (226)
            save_node = outputs.get("226", {})
            if not save_node.get("images"):
                time.sleep(2)
                continue

            # Descargar las imágenes
            images = []
            for img_info in save_node["images"]:
                params = urllib.parse.urlencode({
                    "filename": img_info["filename"],
                    "subfolder": img_info.get("subfolder", ""),
                    "type": "output",
                })
                with urllib.request.urlopen(f"{COMFYUI_URL}/view?{params}") as img_resp:
                    images.append(img_resp.read())

            return images

        except (urllib.error.URLError, ConnectionError):
            time.sleep(2)

    raise TimeoutError(f"No se obtuvo resultado en {timeout}s")


def build_workflow(user_image: str, jugador: str, jugador_ref: str, numero: str) -> dict:
    """Construye el workflow parametrizado para ComfyUI API format."""
    import random
    seed = random.randint(0, 99999)

    return {
        "220": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "juggernautXL_v9Rdphoto2Lightning.safetensors"}
        },
        "208": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["220", 0], "clip": ["220", 1],
                "lora_name": "Samaritan 3d Cartoon SDXL.safetensors",
                "strength_model": 0.1, "strength_clip": 1
            }
        },
        "213": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["208", 0], "clip": ["208", 1],
                "lora_name": "xl_more_art-full_v1.safetensors",
                "strength_model": 0.12, "strength_clip": 1
            }
        },
        "212": {
            "class_type": "CLIPSetLastLayer",
            "inputs": {"clip": ["213", 1], "stop_at_clip_layer": -2}
        },
        "198": {
            "class_type": "LoadImage",
            "inputs": {"image": jugador_ref}
        },
        "194": {
            "class_type": "LoadImage",
            "inputs": {"image": user_image}
        },
        "192": {
            "class_type": "ImageBatch",
            "inputs": {"image1": ["198", 0], "image2": ["194", 0]}
        },
        "195": {
            "class_type": "Text Multiline",
            "inputs": {
                "text": (
                    f"Create a 3D Pixar-style animated scene of two people posing together "
                    f"as friends in a football stadium. On the LEFT side, place the person "
                    f"from the second reference photo wearing a yellow Colombian national "
                    f"team jersey. On the RIGHT side, place {jugador} (from the first "
                    f"reference photo) wearing the yellow Colombian national team "
                    f"#{numero} jersey. Both characters should be in high-quality 3D Pixar "
                    f"animation style, smiling, with a stadium background. Keep the "
                    f"Colombian football kit accurate: yellow jersey, blue shorts, red socks."
                )
            }
        },
        "233": {
            "class_type": "OpenAIChatNode",
            "inputs": {
                "images": ["194", 0],
                "prompt": (
                    f"BASE PROMPT:\nIn the style of a 3D Pixar rendered animated movie, "
                    f"two friends posing together in a football stadium. On the left, "
                    f"[USER_DESCRIPTION] wearing a yellow Colombian national team jersey. "
                    f"On the right, {jugador} wearing the Colombian #{numero} jersey.\n\n"
                    f"Replace [USER_DESCRIPTION] with a physical description based on the "
                    f"person in the reference image (gender, hair style/color, skin tone, "
                    f"facial features, build). Keep it concise. Reply only with the final "
                    f"prompt, no annotations."
                ),
                "model": "gpt-4.1",
                "detail": False
            }
        },
        "206": {
            "class_type": "GeminiImage2Node",
            "inputs": {
                "images": ["192", 0],
                "prompt": ["195", 0],
                "model": "gemini-3-pro-image-preview",
                "seed": seed,
                "seed_mode": "fixed",
                "aspect_ratio": "3:4",
                "resolution": "1K",
                "output_mode": "IMAGE"
            }
        },
        "221": {
            "class_type": "Images to RGB",
            "inputs": {"images": ["206", 0]}
        },
        "253": {
            "class_type": "SAMModelLoader (segment anything)",
            "inputs": {"model_name": "sam_vit_h (2.56GB)"}
        },
        "252": {
            "class_type": "GroundingDinoModelLoader (segment anything)",
            "inputs": {"model_name": "GroundingDINO_SwinT_OGC (694MB)"}
        },
        "255": {
            "class_type": "SolidMask",
            "inputs": {"value": 0, "width": 1024, "height": 1400}
        },
        "256": {
            "class_type": "SolidMask",
            "inputs": {"value": 1, "width": 512, "height": 1400}
        },
        "259": {
            "class_type": "MaskComposite",
            "inputs": {
                "destination": ["255", 0], "source": ["256", 0],
                "x": 0, "y": 0, "operation": "add"
            }
        },
        "260": {
            "class_type": "InvertMask",
            "inputs": {"mask": ["259", 0]}
        },
        "257": {
            "class_type": "GroundingDinoSAMSegment (segment anything)",
            "inputs": {
                "sam_model": ["253", 0],
                "grounding_dino_model": ["252", 0],
                "image": ["221", 0],
                "prompt": "face, head, hair",
                "threshold": 0.25
            }
        },
        "262": {
            "class_type": "MaskComposite",
            "inputs": {
                "destination": ["257", 1], "source": ["260", 0],
                "x": 0, "y": 0, "operation": "and"
            }
        },
        "263": {
            "class_type": "GrowMaskWithBlur",
            "inputs": {
                "mask": ["262", 0],
                "expand": 6, "incremental_expandrate": 2,
                "tapered_corners": True, "flip_input": False,
                "blur_radius": 8, "lerp_alpha": 1, "decay_factor": 1,
                "fill_holes": True
            }
        },
        "209": {
            "class_type": "InstantIDModelLoader",
            "inputs": {"instantid": "ip-adapter.bin"}
        },
        "207": {
            "class_type": "InstantIDFaceAnalysis",
            "inputs": {"provider": "CPU"}
        },
        "218": {
            "class_type": "ControlNetLoader",
            "inputs": {"control_net_name": "instantid/diffusion_pytorch_model.safetensors"}
        },
        "215": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["212", 0], "text": ["233", 0]}
        },
        "216": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["212", 0],
                "text": "photograph, deformed, glitch, noisy, realistic, stock photo, naked, blurry, bad anatomy, extra limbs, disfigured, poorly drawn face"
            }
        },
        "267": {
            "class_type": "MaskToImage",
            "inputs": {"mask": ["260", 0]}
        },
        "266": {
            "class_type": "ImageCompositeMasked",
            "inputs": {
                "destination": ["267", 0], "source": ["221", 0],
                "mask": ["260", 0], "x": 0, "y": 0, "resize_source": False
            }
        },
        "224": {
            "class_type": "InpaintModelConditioning",
            "inputs": {
                "positive": ["215", 0], "negative": ["216", 0],
                "vae": ["220", 2], "pixels": ["221", 0],
                "mask": ["263", 0], "positive_threshold": True
            }
        },
        "214": {
            "class_type": "ApplyInstantID",
            "inputs": {
                "instantid": ["209", 0], "insightface": ["207", 0],
                "control_net": ["218", 0], "image": ["194", 0],
                "model": ["213", 0], "positive": ["224", 0],
                "negative": ["224", 1], "image_kps": ["266", 0],
                "weight": 0.8, "start_at": 0, "end_at": 1
            }
        },
        "219": {
            "class_type": "RescaleCFG",
            "inputs": {"model": ["214", 0], "multiplier": 0.5}
        },
        "217": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["219", 0], "positive": ["214", 1],
                "negative": ["216", 0], "latent_image": ["224", 2],
                "seed": seed, "control_after_generate": "fixed",
                "steps": 8, "cfg": 2.5,
                "sampler_name": "ddpm", "scheduler": "karras",
                "denoise": 0.58
            }
        },
        "211": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["217", 0], "vae": ["220", 2]}
        },
        "226": {
            "class_type": "SaveImage",
            "inputs": {"images": ["211", 0], "filename_prefix": "PIXAR_COLOMBIA"}
        },
    }


# ===== HANDLER =====

def handler(event: dict) -> dict:
    """
    RunPod serverless handler.

    Input esperado:
    {
        "input": {
            "image_base64": "...",       # Foto del usuario en base64
            "jugador": "james",          # ID del jugador
        }
    }
    """
    start_comfyui()

    inp = event.get("input", {})
    image_b64 = inp.get("image_base64")
    jugador_id = inp.get("jugador", "james")

    if not image_b64:
        return {"error": "Falta image_base64"}

    # Mapa de jugadores
    jugadores = {
        "james":    {"nombre": "James Rodriguez",  "numero": "10", "ref": "james_rodriguez_ref.png"},
        "diaz":     {"nombre": "Luis Diaz",        "numero": "7",  "ref": "luis_diaz_ref.png"},
        "falcao":   {"nombre": "Radamel Falcao",   "numero": "9",  "ref": "falcao_ref.png"},
        "cuadrado": {"nombre": "Juan Cuadrado",    "numero": "11", "ref": "cuadrado_ref.png"},
        "ospina":   {"nombre": "David Ospina",     "numero": "1",  "ref": "ospina_ref.png"},
        "arias":    {"nombre": "Santiago Arias",    "numero": "4",  "ref": "arias_ref.png"},
    }

    jug = jugadores.get(jugador_id)
    if not jug:
        return {"error": f"Jugador '{jugador_id}' no válido", "disponibles": list(jugadores.keys())}

    try:
        # 1. Subir imagen del usuario
        print(f"Subiendo imagen del usuario...")
        filename = upload_image(image_b64, f"user_{int(time.time())}.png")

        # 2. Construir y ejecutar workflow
        print(f"Generando Pixar con {jug['nombre']}...")
        workflow = build_workflow(filename, jug["nombre"], jug["ref"], jug["numero"])
        prompt_id = queue_prompt(workflow)

        # 3. Esperar resultado
        print(f"Esperando resultado (prompt_id: {prompt_id})...")
        images = wait_for_result(prompt_id, timeout=180)

        # 4. Retornar imagen en base64
        result_b64 = base64.b64encode(images[0]).decode("utf-8")
        print(f"Imagen generada exitosamente!")

        return {
            "image_base64": result_b64,
            "jugador": jug["nombre"],
            "status": "completed",
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e), "status": "failed"}


# Iniciar RunPod serverless
runpod.serverless.start({"handler": handler})
