FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV COMFYUI_PATH=/comfyui

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3.10 python3-pip git wget curl \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Instalar ComfyUI
RUN git clone https://github.com/comfyanonymous/ComfyUI.git $COMFYUI_PATH
WORKDIR $COMFYUI_PATH
RUN pip3 install --no-cache-dir -r requirements.txt
RUN pip3 install --no-cache-dir runpod

# ===== CUSTOM NODES =====
WORKDIR $COMFYUI_PATH/custom_nodes

# InstantID
RUN git clone https://github.com/ZHO-ZHO-ZHO/ComfyUI-InstantID.git \
    && pip3 install --no-cache-dir insightface onnxruntime-gpu

# Segment Anything (SAM + GroundingDINO)
RUN git clone https://github.com/storyicon/comfyui_segment_anything.git \
    && pip3 install --no-cache-dir groundingdino-py segment-anything

# WAS Node Suite (Text Multiline, Images to RGB, etc.)
RUN git clone https://github.com/WASasquatch/was-node-suite-comfyui.git \
    && pip3 install --no-cache-dir -r was-node-suite-comfyui/requirements.txt

# KJNodes (GrowMaskWithBlur)
RUN git clone https://github.com/kijai/ComfyUI-KJNodes.git

# ComfyUI Essentials (ImageResize+)
RUN git clone https://github.com/cubiq/ComfyUI_essentials.git \
    && pip3 install --no-cache-dir -r ComfyUI_essentials/requirements.txt

# ===== MODELOS (se descargan al hacer build) =====
WORKDIR $COMFYUI_PATH

# Checkpoint - JuggernautXL Lightning
RUN wget -q -O models/checkpoints/juggernautXL_v9Rdphoto2Lightning.safetensors \
    "https://huggingface.co/RunDiffusion/Juggernaut-XL-v9/resolve/main/juggernautXL_v9Rdphoto2Lightning.safetensors"

# InstantID models
RUN mkdir -p models/instantid \
    && wget -q -O models/instantid/ip-adapter.bin \
    "https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin" \
    && mkdir -p models/controlnet/instantid \
    && wget -q -O models/controlnet/instantid/diffusion_pytorch_model.safetensors \
    "https://huggingface.co/InstantX/InstantID/resolve/main/ControlNetModel/diffusion_pytorch_model.safetensors"

# InsightFace model (antelopev2)
RUN mkdir -p models/insightface/models/antelopev2 \
    && wget -q -O models/insightface/models/antelopev2.zip \
    "https://huggingface.co/MonsterMMORPG/tools/resolve/main/antelopev2.zip" \
    && cd models/insightface/models && unzip antelopev2.zip -d antelopev2 && rm antelopev2.zip

# SAM model
RUN mkdir -p models/sams \
    && wget -q -O models/sams/sam_vit_h_4b8939.pth \
    "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth"

# GroundingDINO
RUN mkdir -p models/grounding-dino \
    && wget -q -O models/grounding-dino/GroundingDINO_SwinT_OGC.pth \
    "https://huggingface.co/ShilongLiu/GroundingDINO/resolve/main/groundingdino_swint_ogc.pth"

# LoRAs
RUN wget -q -O models/loras/xl_more_art-full_v1.safetensors \
    "https://huggingface.co/xerel/xl_more_art-full_v1/resolve/main/xl_more_art-full_v1.safetensors"
# Nota: "Samaritan 3d Cartoon SDXL.safetensors" - buscar URL correcta o subir manualmente

# ===== FOTOS DE REFERENCIA DE JUGADORES =====
COPY jugadores/ $COMFYUI_PATH/input/

# ===== WORKER SCRIPT =====
COPY handler.py /handler.py

EXPOSE 8188

CMD ["python3", "/handler.py"]
