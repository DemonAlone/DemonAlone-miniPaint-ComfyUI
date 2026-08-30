import { app } from "../../scripts/app.js";

console.log("[miniPaint] Extension loaded");

let miniPaintWindow = null;
let modalContainer = null;

// === Loading original image from node ===
async function getImageFromNode(node) {
    // 1. Try to get file name from 'image' widget
    const imageWidget = node.widgets?.find(w => w.name === "image");
    if (imageWidget && imageWidget.value) {
        const filename = imageWidget.value;
        // Form URL for fetching file (standard ComfyUI endpoint)
        const url = `/view?filename=${encodeURIComponent(filename)}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = URL.createObjectURL(blob);
                });
                return img;
            } else {
                console.warn("Failed to load image from /view, falling back to DOM element.");
            }
        } catch (e) {
            console.warn("Fetch error, falling back to DOM element.", e);
        }
    }

    // 2. Fallback: try to extract HTMLImageElement from node.imgs or node.image
    let imgElement = null;
    if (node.imgs) {
        const idx = node.activated_index || 0;
        const item = node.imgs[idx];
        if (item && item.img) imgElement = item.img;
        else if (item instanceof HTMLImageElement) imgElement = item;
        else imgElement = item;
    } else if (node.image) {
        if (node.image.img) imgElement = node.image.img;
        else if (node.image instanceof HTMLImageElement) imgElement = node.image;
        else imgElement = node.image;
    }

    if (imgElement && imgElement instanceof HTMLImageElement) {
        return imgElement;
    }
    throw new Error("Unable to retrieve original image from node.");
}

// === Sending image to server (temporary buffer) ===
async function uploadImageToBuffer(imageElement) {
    // Use naturalWidth/Height if available, otherwise take standard dimensions
    const width = imageElement.naturalWidth || imageElement.width;
    const height = imageElement.naturalHeight || imageElement.height;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(imageElement, 0, 0, width, height);
    const cleanBase64 = tempCanvas.toDataURL("image/png");
	
    const response = await fetch("/mypaint/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: cleanBase64 })
    });
    if (!response.ok) throw new Error("Upload failed");
}

// === Save handler for specific node ===
function setupSaveHandler(node) {
    // Remove previous handler for this node if exists
    if (node._miniPaintHandler) {
        window.removeEventListener("message", node._miniPaintHandler);
    }
    const handler = (e) => {
        if (e.data && e.data.type === "MINIPAINT_SAVED") {
            const imageWidget = node.widgets?.find(w => w.name === "image");
            if (imageWidget) {
                imageWidget.value = e.data.filename;
                if (imageWidget.callback) imageWidget.callback(e.data.filename);
                node.setDirtyCanvas(true, true);
            }
        }
    };
    window.addEventListener("message", handler);
    node._miniPaintHandler = handler;
}

// === Opening in separate window ===
async function openMiniPaintWindow(node) {
    const img = await getImageFromNode(node);
    await uploadImageToBuffer(img);
    const editorUrl = "/mypaint/index.html";
    if (miniPaintWindow && !miniPaintWindow.closed) {
        miniPaintWindow.focus();
        miniPaintWindow.postMessage({ type: "RELOAD_BUFFER" }, "*");
    } else {
        miniPaintWindow = window.open(editorUrl, "ComfyMiniPaintWindow");
    }
    setupSaveHandler(node);
}

// === Открытие в модальном окне (iframe) ===
async function openMiniPaintModal(node) {
    const img = await getImageFromNode(node);
    await uploadImageToBuffer(img);
    
    // Close previous modal window if exists
    if (modalContainer) {
        document.body.removeChild(modalContainer);
        modalContainer = null;
    }
    
    // Create container
    modalContainer = document.createElement("div");
    modalContainer.style.position = "fixed";
    modalContainer.style.top = "0";
    modalContainer.style.left = "0";
    modalContainer.style.width = "100%";
    modalContainer.style.height = "100%";
    modalContainer.style.backgroundColor = "rgba(0,0,0,0.7)";
    modalContainer.style.zIndex = "100000";
    modalContainer.style.display = "flex";
    modalContainer.style.alignItems = "center";
    modalContainer.style.justifyContent = "center";
    
    // Create iframe with editor
    const iframe = document.createElement("iframe");
    iframe.src = "/mypaint/index.html";
    iframe.style.width = "90%";
    iframe.style.height = "90%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    iframe.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
    
    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "❌";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "20px";
    closeBtn.style.right = "30px";
    closeBtn.style.backgroundColor = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "20px";
    closeBtn.style.width = "40px";
    closeBtn.style.height = "40px";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.zIndex = "100001";
    closeBtn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    closeBtn.onclick = () => {
        if (modalContainer) {
            document.body.removeChild(modalContainer);
            modalContainer = null;
        }
    };
    
    modalContainer.appendChild(iframe);
    modalContainer.appendChild(closeBtn);
    document.body.appendChild(modalContainer);
    
    setupSaveHandler(node);
}

// === Extension registration ===
app.registerExtension({
    name: "demonalone.MiniPaint",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        const orig = nodeType.prototype.getExtraMenuOptions;
        nodeType.prototype.getExtraMenuOptions = function(canvas, options) {
            orig?.apply(this, arguments);

            if (this.imgs || this.image) {
                // Create submenu structure for MiniPaint
                const miniPaintSubmenu = [
                    {
                        content: "Edit in miniPaint (New Window)",
                        callback: async () => {
                            try {
                                await openMiniPaintWindow(this);
                            } catch (err) {
                                console.error("MiniPaint (window) error:", err);
                            }
                        }
                    },
                    {
                        content: "Edit in miniPaint (Pop-up)",
                        callback: async () => {

                            try {
                                await  openMiniPaintModal(this);
                            } catch (err) {
                                console.error("MiniPaint (Pop-up) error:", err);
                            }
                        }
                    }
                ];

                options.push({
                    content: "🖼️miniPaint",
                    has_submenu: true,
                    submenu: {
                        options: miniPaintSubmenu
                    }
                });
            }
        };
    }
});
