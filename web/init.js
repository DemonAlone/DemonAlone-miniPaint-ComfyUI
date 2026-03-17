import { app } from "../../scripts/app.js";

// Global variable to store reference to the editor window
let miniPaintWindow = null;

app.registerExtension({
    name: "demonalone.MiniPaint",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        const orig = nodeType.prototype.getExtraMenuOptions;
        nodeType.prototype.getExtraMenuOptions = function(canvas, options) {
            orig?.apply(this, arguments);

            if (this.imgs || this.image) {
                options.push({
                    content: "Edit in miniPaint",
                    callback: async () => {
                        const node = this;
                        const imgElement = node.imgs ? node.imgs[node.activated_index || 0] : node.image;
                        
                        // Create a clean Base64
                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = imgElement.width || imgElement.naturalWidth;
                        tempCanvas.height = imgElement.height || imgElement.naturalHeight;
                        const ctx = tempCanvas.getContext("2d");
                        ctx.drawImage(imgElement, 0, 0);
                        const cleanBase64 = tempCanvas.toDataURL("image/png");

                        try {
                            // Send to server buffer
                            await fetch("/mypaint/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ image: cleanBase64 })
                            });

                            // Intelligent opening/updating of window
                            const editorUrl = "/mypaint/index.html";
                            
                            if (miniPaintWindow && !miniPaintWindow.closed) {
                                // Window already open: bring to front and send signal
                                miniPaintWindow.focus();
                                miniPaintWindow.postMessage({ type: "RELOAD_BUFFER" }, "*");
                                console.log("MiniPaint: Window exists, sending RELOAD signal");
                            } else {
                                // No window: open new
                                miniPaintWindow = window.open(editorUrl, "ComfyMiniPaintWindow");
                                console.log("MiniPaint: Opening new window");
                            }

                            // Listener for saves (set up once)
                            const onSaveMessage = (e) => {
                                if (e.data && e.data.type === "MINIPAINT_SAVED") {
                                    const imageWidget = node.widgets && node.widgets.find(w => w.name === "image");
                                    if (imageWidget) {
                                        imageWidget.value = e.data.filename;
                                        if (imageWidget.callback) imageWidget.callback(e.data.filename);
                                        node.setDirtyCanvas(true, true);
                                    }
                                }
                            };
                            
                            // To avoid creating multiple listeners, remove the old one before adding a new
                            window.removeEventListener("message", onSaveMessage);
                            window.addEventListener("message", onSaveMessage);

                        } catch (err) {
                            console.error("MiniPaint Error:", err);
                        }
                    }
                });
            }
        };
    }
});
