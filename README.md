# miniPaint Bridge for ComfyUI


<img width="1874" height="920" alt="miniPaint" src="https://github.com/user-attachments/assets/37af611a-9dc9-4a6f-994a-34a66d2fa6a0" />

## Features
- **Context Menu Integration**: Right-click any node with an image and select "🖼️miniPaint".
- **Bi-directional Sync**: Edit images in your browser and save them directly back to the ComfyUI `input/miniPaint` folder.
- **Auto-Update**: After saving in the editor, the `Load Image` node in ComfyUI automatically updates to the new file.
- **Smart Tabs**: Uses a single browser tab for all editing sessions to prevent clutter.
- **Fully Offline**: No external servers involved, all processing is local.

## Installation
1. Clone this repo into your `ComfyUI/custom_nodes/` folder.
2. Restart ComfyUI.

## Usage
- Right-click on a **Load Image** or similar node , select **🖼️miniPaint** choose one of the following options:

### Edit in miniPaint (New Window)
Opens the miniPaint editor in a separate browser window.
Best for users who prefer a dedicated workspace with more screen space.
### Edit in miniPaint (Pop-up)
- Opens the miniPaint editor as a pop-up within ComfyUI's interface.
- Ideal for quick edits without leaving the ComfyUI workflow.

### Editing Workflow (Both Modes)
- Edit your image in the chosen editor tab.
- Click the blue "SAVE TO COMFY" button at the top of the editor.
- The file will appear in input/miniPaint/ and auto-load into your node.
- Close the tab when finished.
   
## Important Notes
- **Same Browser Only**: The "Edit" and "Save" functions only work if the editor is opened in the **same browser** where ComfyUI is running. If you copy the editor URL to a different browser, the link between them will be lost.
- **Single Tab**: The extension is designed to use a single browser tab for editing. If you have multiple editor tabs open manually, only the one linked to the current session will receive images.

## Credits
- Based on [miniPaint](https://github.com/viliusle/miniPaint)
- Author of miniPaint ViliusL aka [viliusle](https://github.com/viliusle)
- Some hint for menu from [KJNodes](https://github.com/kijai/ComfyUI-KJNodes)
- Huge assistance from Google Gemini, DeepSeek, Qwen.
