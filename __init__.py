import os
import base64
import time
from server import PromptServer
from aiohttp import web
import folder_paths

NODE_CLASS_MAPPINGS = {}
WEB_DIRECTORY = "web"

base_path = os.path.dirname(os.path.realpath(__file__))
static_path = os.path.join(base_path, "editor_static")
temp_image_path = os.path.join(base_path, "temp_buffer.png")

routes = PromptServer.instance.routes

@routes.get("/mypaint/get_buffer")
async def get_buffer(request):
    if os.path.exists(temp_image_path):
        return web.FileResponse(temp_image_path)
    return web.Response(status=404)

@routes.post("/mypaint/upload")
async def upload_temp(request):
    try:
        data = await request.json()
        img_base64 = data['image'].split(",")[-1]
        with open(temp_image_path, "wb") as f:
            f.write(base64.b64decode(img_base64))
        return web.json_response({"status": "ok"})
    except Exception as e:
        return web.Response(status=500, text=str(e))

@routes.post("/mypaint/save_back")
async def save_back(request):
    try:
        data = await request.json()
        img_base64 = data['image'].split(",")[-1]
        
        filename = f"minipaint_{int(time.time())}.png"
        input_dir = folder_paths.get_input_directory()
        sub_dir = os.path.join(input_dir, "miniPaint")
        if not os.path.exists(sub_dir):
            os.makedirs(sub_dir)
            
        save_path = os.path.join(sub_dir, filename)
        
        with open(save_path, "wb") as f:
            f.write(base64.b64decode(img_base64))
        
        relative_path = f"miniPaint/{filename}"
        return web.json_response({"status": "ok", "filename": relative_path})
    except Exception as e:
        return web.Response(status=500, text=str(e))

@routes.get("/mypaint/{file:.*}")
async def get_editor_file(request):
    file_path = request.match_info.get("file", "index.html")
    if not file_path: file_path = "index.html"
    full_path = os.path.join(static_path, file_path)
    if os.path.exists(full_path):
        return web.FileResponse(full_path)
    return web.Response(status=404)

__all__ = ["NODE_CLASS_MAPPINGS", "WEB_DIRECTORY"]
