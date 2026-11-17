// ================= 文本解析器 =================
function parseEffectText(text) {
    if (!text) return "";
    return text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
            let cleanLine = line.replace(/<[^>]+>/g, "");
            let formatted = cleanLine.replace(
                /(「[^」]+」|（[^）]+）)/g,
                '<span class="bold-part">$1</span>'
            );
            return `<div class="eff">${formatted}</div>`;
        })
        .join("");
}

// ================= 图片压缩 =================
function compressImage(img, maxWidth) {
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width <= maxWidth) return img.src;
    const ratio = maxWidth / width;
    const newHeight = height * ratio;
    const canvas = document.createElement("canvas");
    canvas.width = maxWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, maxWidth, newHeight);
    return canvas.toDataURL("image/jpeg", 0.8);
}

// ================= 导出 PNG =================
function exportToImage() {
    const originalCard = document.getElementById("cardPreview");
    const btnExport = document.getElementById("btn-export");
    if (btnExport && btnExport.disabled) return;
    const originalIcon = btnExport ? btnExport.innerHTML : "";

    if (btnExport) {
        btnExport.innerHTML = uiRegistry.loading.icon;
        btnExport.disabled = true;
    }

    setTimeout(() => {
        const clone = originalCard.cloneNode(true);
        clone.style.transform = "none";
        clone.style.margin = "0";
        clone.style.boxShadow = "none";
        clone.style.borderRadius = "0";
        clone.style.width = "354px";
        clone.style.height = "516px";
        clone.style.position = "absolute";
        clone.style.top = "0";
        clone.style.left = "-9999px";
        document.body.appendChild(clone);

        html2canvas(clone, {
            scale: 2,
            backgroundColor: "#ffffff",
            width: 354,
            height: 516,
            useCORS: true,
            logging: false,
        })
            .then((canvas) => {
                document.body.removeChild(clone);
                if (btnExport) {
                    btnExport.innerHTML = originalIcon;
                    btnExport.disabled = false;
                }
                canvas.toBlob(function (blob) {
                    const link = document.createElement("a");
                    const activeCard = state.workspaceData.find(
                        (c) => c.id === state.activeCardId
                    );
                    let rawName =
                        (activeCard ? activeCard.data.cardName : "card") ||
                        "card";
                    let safeName = rawName.replace(/[\\/:*?"<>|]/g, "_");
                    const timeStamp = new Date().getTime().toString().slice(-4);
                    link.download = `${safeName}_${timeStamp}.png`;
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, "image/png");
            })
            .catch((err) => {
                console.error("导出失败", err);
                if (document.body.contains(clone))
                    document.body.removeChild(clone);
                if (btnExport) {
                    btnExport.innerHTML = originalIcon;
                    btnExport.disabled = false;
                }
                alert("导出失败，请重试");
            });
    }, 50);
}
