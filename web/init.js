import { app } from "../../scripts/app.js";

console.log("[miniPaint] Extension loaded");

let miniPaintWindow = null;
let modalContainer = null;

// === Loading original image from node ===
async function getImageFromNode(node) {
	// 1. Try to get file name from 'image' widget
	const imageWidget = node.widgets?.find((w) => w.name === "image");
	if (imageWidget && imageWidget.value) {
		let filename = imageWidget.value;
		const subfolderWidget = node.widgets?.find((w) => w.name === "subfolder");
		let subfolder = subfolderWidget ? subfolderWidget.value : "";

		// If the widget value contains a path with a subfolder (for example, 'miniPaint/minipaint_123.png')
		if (filename.includes("/") || filename.includes("\\")) {
			const normalized = filename.replace(/\\/g, "/");
			const lastSlash = normalized.lastIndexOf("/");
			const extractedSubfolder = normalized.substring(0, lastSlash);
			filename = normalized.substring(lastSlash + 1);
			subfolder = subfolder
				? `${subfolder}/${extractedSubfolder}`
				: extractedSubfolder;
		}

		const params = new URLSearchParams({
			filename: filename,
			type: "input", //Critical to obtaining the original
			subfolder: subfolder,
		});
		const url = `/view?${params.toString()}`;
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
				console.log(
					`[miniPaint] Loaded original: ${img.naturalWidth}x${img.naturalHeight}`,
				);
				return img;
			}
		} catch (e) {
			console.warn("[miniPaint] Fetch original failed:", e);
		}
	}

	// Fallback to the node preview if the file is not found
	if (node.imgs && node.imgs.length > 0) {
		const idx = node.activated_index || 0;
		let imgElement = null;
		const item = node.imgs[idx];
		if (item instanceof HTMLImageElement) imgElement = item;
		else if (item && item.img instanceof HTMLImageElement)
			imgElement = item.img;

		if (imgElement) {
			console.warn(
				"[miniPaint] Using PREVIEW fallback. Resolution may be lower.",
			);
			return imgElement;
		}
	}
	throw new Error(
		"Unable to retrieve image. Ensure the node has a saved file or visible preview.",
	);
}

// === Sending image to server (temporary buffer) ===
async function uploadImageToBuffer(imageElement) {
	// ALWAYS use naturalWidth/Height for the original
	const width = imageElement.naturalWidth || imageElement.width;
	const height = imageElement.naturalHeight || imageElement.height;

	if (!width || !height) throw new Error("Invalid image dimensions.");

	const tempCanvas = document.createElement("canvas");
	tempCanvas.width = width;
	tempCanvas.height = height;

	const ctx = tempCanvas.getContext("2d");

	ctx.drawImage(imageElement, 0, 0, width, height);

	console.log(`[miniPaint] Uploading buffer: ${width}x${height}`);

	const blob = await new Promise((resolve) =>
		tempCanvas.toBlob(resolve, "image/png"),
	);

	const formData = new FormData();
	formData.append("image", blob, "mypaint_edit.png");

	const response = await fetch("/mypaint/upload", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) throw new Error("Upload to buffer failed");
}

// === Save handler for specific node ===
function setupSaveHandler(node) {
	// Remove previous handler for this node if exists
	if (node._miniPaintHandler) {
		window.removeEventListener("message", node._miniPaintHandler);
	}
	const handler = (e) => {
		// Check that the message came from our own source
		if (e.origin !== window.location.origin) return;

		if (e.data && e.data.type === "MINIPAINT_SAVED") {
			const imageWidget = node.widgets?.find((w) => w.name === "image");
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
		miniPaintWindow.postMessage(
			{ type: "RELOAD_BUFFER" },
			window.location.origin,
		);
	} else {
		miniPaintWindow = window.open(editorUrl, "ComfyMiniPaintWindow");
	}
	setupSaveHandler(node);
}

// === Opening in a modal window (iframe) ===
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
	Object.assign(modalContainer.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(0,0,0,0.7)",
		zIndex: "100000",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	});

	const iframe = document.createElement("iframe");
	iframe.src = "/mypaint/index.html";
	Object.assign(iframe.style, {
		width: "90%",
		height: "90%",
		border: "none",
		borderRadius: "8px",
		boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
	});

	const closeBtn = document.createElement("button");
	closeBtn.innerHTML = "❌";
	Object.assign(closeBtn.style, {
		position: "absolute",
		top: "20px",
		right: "30px",
		backgroundColor: "#fff",
		border: "none",
		borderRadius: "20px",
		width: "40px",
		height: "40px",
		fontSize: "24px",
		cursor: "pointer",
		zIndex: "100001",
	});
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
	async beforeRegisterNodeDef(nodeType) {
		const orig = nodeType.prototype.getExtraMenuOptions;
		nodeType.prototype.getExtraMenuOptions = function (
			_canvas,
			options,
			...rest
		) {
			orig?.apply(this, [_canvas, options, ...rest]);

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
						},
					},
					{
						content: "Edit in miniPaint (Pop-up)",
						callback: async () => {
							try {
								await openMiniPaintModal(this);
							} catch (err) {
								console.error("MiniPaint (Pop-up) error:", err);
							}
						},
					},
				];
				options.push({
					content: "🖼️ miniPaint",
					has_submenu: true,
					submenu: { options: miniPaintSubmenu },
				});
			}
		};
	},
});
