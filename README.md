# miniPaint Bridge for ComfyUI

A lightweight, local, open-source image editor integration for ComfyUI. Based on [miniPaint](https://github.com/viliusle/miniPaint) v4.14.2.

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
1. Right-click on a `Load Image` or `Preview Image` node.
2. Select **"Edit in miniPaint"**.
3. Edit your image in the new tab.
4. Click the blue **"SAVE TO COMFY"** button at the top.
5. The file will appear in `input/miniPaint/` and auto-load into your node.

## Credits
- Author of miniPaint ViliusL aka [viliusle](https://github.com/viliusle).
- Huge assistant from Google Gemini.
