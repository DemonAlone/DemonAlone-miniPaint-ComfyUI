# miniPaint Bridge for ComfyUI

A lightweight, local, open-source image editor integration for ComfyUI. Based on [miniPaint](https://github.com/viliusle/miniPaint) v4.14.2.
<img width="1874" height="920" alt="miniPaint" src="https://github.com/user-attachments/assets/37af611a-9dc9-4a6f-994a-34a66d2fa6a0" />

## Features
- **Context Menu Integration**: Right-click any node with an image and select "Edit in miniPaint".
- **Bi-directional Sync**: Edit images in your browser and save them directly back to the ComfyUI `input/miniPaint` folder.
- **Auto-Update**: After saving in the editor, the `Load Image` node in ComfyUI automatically updates to the new file.
- **Smart Tabs**: Uses a single browser tab for all editing sessions to prevent clutter.
- **Fully Offline**: No external servers involved, all processing is local.

## Installation
1. Clone this repo into your `ComfyUI/custom_nodes/` folder.
2. Restart ComfyUI.

## Usage
1. Right-click on a `Load Image` or similar node.
2. Select **"Edit in miniPaint"**.
3. Edit your image in the new tab.
4. Click the blue **"SAVE TO COMFY"** button at the top.
5. The file will appear in `input/miniPaint/` and auto-load into your node.
   
## Important Notes
- **Same Browser Only**: The "Edit" and "Save" functions only work if the editor is opened in the **same browser** where ComfyUI is running. If you copy the editor URL to a different browser, the link between them will be lost.
- **Single Tab**: The extension is designed to use a single browser tab for editing. If you have multiple editor tabs open manually, only the one linked to the current session will receive images.

## Credits
- Author of miniPaint ViliusL aka [viliusle](https://github.com/viliusle).
- Huge assistance from Google Gemini.
