import os
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
        reader = await request.multipart()
        field = await reader.next()
        if field.name != "image":
            return web.Response(status=400, text="Field 'image' expected")

        # Save to a temporary file
        with open(temp_image_path, "wb") as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
        return web.json_response({"status": "ok"})
    except Exception as e:
        return web.Response(status=500, text=str(e))

@routes.post("/mypaint/save_back")
async def save_back(request):
    try:
        reader = await request.multipart()
        field = await reader.next()
        if field.name != "image":
            return web.Response(status=400, text="Field 'image' expected")
        filename = f"minipaint_{int(time.time())}.png"
        input_dir = folder_paths.get_input_directory()
        sub_dir = os.path.join(input_dir, "miniPaint")
        if not os.path.exists(sub_dir):
            os.makedirs(sub_dir)
            
        save_path = os.path.join(sub_dir, filename)

        with open(save_path, "wb") as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
        relative_path = f"miniPaint/{filename}"
        return web.json_response({"status": "ok", "filename": relative_path})
    except Exception as e:
        return web.Response(status=500, text=str(e))

@routes.get("/mypaint/{file:.*}")
async def get_editor_file(request):
    file_path = request.match_info.get("file", "index.html")
    if not file_path:
        file_path = "index.html"

    # Normalize the requested path
    requested_path = os.path.normpath(file_path)

    # Disallow absolute paths and out-of-bounds
    if os.path.isabs(requested_path) or requested_path.startswith('..'):
        return web.Response(status=403, text="Forbidden")

    # Form the full path and get its real path
    full_path = os.path.realpath(os.path.join(static_path, requested_path))
    base_real = os.path.realpath(static_path)

    # Check that full_path is inside base_real
    if os.path.commonpath([base_real, full_path]) != base_real:
        return web.Response(status=403, text="Forbidden")

    if os.path.isfile(full_path):
        return web.FileResponse(full_path)
    return web.Response(status=404)

__all__ = ["NODE_CLASS_MAPPINGS", "WEB_DIRECTORY"]
