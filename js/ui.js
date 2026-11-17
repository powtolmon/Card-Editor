// ================= 命名空间初始化 =================
window.App = window.App || {};
App.UI = App.UI || {};

// ================= 1，卡片数据加载 =================

App.UI.loadCardData = function(cardData, fileName) {
    // 🔥 1. 更新顶部标题 (顶栏同步)
    const topTitle = document.getElementById("top-title");
    if (topTitle) {
        topTitle.innerText = fileName || cardData.cardName || "未命名卡片";
    }

    // 🔥 2. 更新卡面文字
    document.querySelectorAll(".card [data-key]").forEach((el) => {
        const key = el.dataset.key;
        if (key === "effects" || key === "plugin") el.innerHTML = parseEffectText(cardData[key]);
        else el.innerText = cardData[key] || "";
    });

    // 🔥 3. 更新右侧表单
    document.querySelectorAll(".drawer-right [data-key]").forEach((el) => {
        el.value = cardData[el.dataset.key] || "";
    });

    // 🔥 4. 图片逻辑
    const cardImage = document.getElementById("card-image");
    const placeholder = document.getElementById("art-placeholder");
    if (cardData.image && cardImage && placeholder) {
        cardImage.src = cardData.image;
        cardImage.style.display = "block";
        placeholder.style.display = "none";
    } else if (cardImage && placeholder) {
        cardImage.style.display = "none";
        placeholder.style.display = "block";
    }

    if (cardData.image) {
        const tempImg = new Image();
        tempImg.onload = () => {
            currentOriginalSize = { w: tempImg.naturalWidth, h: tempImg.naturalHeight };
            setTimeout(checkStretch, 50);
        };
        tempImg.src = cardData.image;
    } else {
        currentOriginalSize = { w: 0, h: 0 };
        checkStretch();
    }
};

// ================= 2，卡片数据双向绑定 =================    

App.UI.bindCardInputs = function() {
    document.querySelectorAll(".card [data-key]").forEach((el) => {
        el.addEventListener("input", (e) => {
            const key = e.target.dataset.key;
            const val = e.target.innerText;
            const activeCard = state.workspaceData.find(
                (c) => c.id === state.activeCardId
            );
            if (activeCard) activeCard.data[key] = val;
            const formEl = document.querySelector(
                `.drawer-right [data-key="${key}"]`
            );
            if (formEl) formEl.value = val;
        });
        if (el.dataset.key === "effects" || el.dataset.key === "plugin") {
            el.addEventListener("blur", (e) => {
                e.target.innerHTML = parseEffectText(e.target.innerText);
            });
        }
    });
}

function renderToolbar(containerId, itemKeys) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    itemKeys.forEach((key) => {
        const config = uiRegistry[key];
        if (!config) return;
        const btn = document.createElement("button");
        btn.className = "ui-btn";
        btn.id = `btn-${key}`;
        btn.title = config.label;
        btn.innerHTML = config.icon;
        container.appendChild(btn);
    });
}



window.closeDrawers = function() {
    document.body.classList.remove("drawer-open");
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.classList.remove("open");
    const dl = document.getElementById("drawerLeft");
    if (dl) dl.classList.remove("open");
    const dr = document.getElementById("drawerRight");
    if (dr) dr.classList.remove("open");
};

function openDrawer(side) {
    document.body.classList.add("drawer-open");
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.classList.add("open");
    const dl = document.getElementById("drawerLeft");
    if (side === "left" && dl) dl.classList.add("open");
    const dr = document.getElementById("drawerRight");
    if (side === "right" && dr) dr.classList.add("open");
}

function loadCardData(cardData) {
    console.log("=== 开始加载卡片数据 ===", cardData);

    // 🔥 1. 更新顶部标题（关键）
    const topTitle = document.getElementById("top-title");
    if (topTitle) {
        topTitle.innerText = fileName || cardData.cardName || "未命名卡片";
    }

    // ... 下面其他渲染逻辑 ...
    document.querySelectorAll(".card [data-key]").forEach((el) => {
        const key = el.dataset.key;
        if (key === "effects" || key === "plugin") el.innerHTML = parseEffectText(cardData[key]);
        else el.innerText = cardData[key] || "";
    });

    // 🔥 检查表单元素到底找没找到
    const formInputs = document.querySelectorAll(".drawer-right [data-key]");
    console.log(`找到了 ${formInputs.length} 个表单输入框`);

    formInputs.forEach((el) => {
        const key = el.dataset.key;
        console.log(`正在填充字段: ${key}, 值为:`, cardData[key]);
        el.value = cardData[key] || "";
    });

    const cardImage = document.getElementById("card-image");
    const placeholder = document.getElementById("art-placeholder");
    if (cardData.image && cardImage && placeholder) {
        cardImage.src = cardData.image;
        cardImage.style.display = "block";
        placeholder.style.display = "none";
    } else if (cardImage && placeholder) {
        cardImage.style.display = "none";
        placeholder.style.display = "block";
    }

    if (cardData.image) {
        const tempImg = new Image();
        tempImg.onload = () => {
            currentOriginalSize = {
                w: tempImg.naturalWidth,
                h: tempImg.naturalHeight,
            };
            setTimeout(checkStretch, 50);
        };
        tempImg.src = cardData.image;
    } else {
        currentOriginalSize = { w: 0, h: 0 };
        checkStretch();
    }
}

function bindAppUIEvents() {
    const btnMenu = document.getElementById("btn-menu");
    const btnEdit = document.getElementById("btn-edit");
    const btnCloseForm = document.getElementById("btn-close-form");
    const overlay = document.getElementById("overlay");
    const btnRefresh = document.getElementById("btn-refresh-local");
    const btnExport = document.getElementById("btn-export");
    const btnMore = document.getElementById("btn-more");

    if (btnMore) {
        let topDropdown = document.getElementById("top-dropdown");
        if (!topDropdown) {
            topDropdown = document.createElement("div");
            topDropdown.id = "top-dropdown";
            topDropdown.className = "dropdown-menu";
            document.getElementById("top-right-mount").appendChild(topDropdown);
        }
        topDropdown.innerHTML = `<div class="dropdown-item" id="menu-settings">${uiRegistry.settings.icon} <span>${uiRegistry.settings.label}</span></div><div class="dropdown-item" id="menu-about">${uiRegistry.more.icon} <span>关于 Card-Editor</span></div>`;
        btnMore.onclick = (e) => {
            e.stopPropagation();
            topDropdown.classList.toggle("show");
        };
        document.addEventListener("click", (e) => {
            if (!topDropdown.contains(e.target) && e.target !== btnMore)
                topDropdown.classList.remove("show");
        });
    }

    if (btnExport) btnExport.onclick = exportToImage;
    if (btnMenu) btnMenu.onclick = () => openDrawer("left");
    if (btnEdit) btnEdit.onclick = () => openDrawer("right");
    if (btnCloseForm) btnCloseForm.onclick = window.closeDrawers;
    if (overlay) overlay.onclick = window.closeDrawers;
    if (btnRefresh)
        btnRefresh.onclick = () => {
            if (state.currentTab === "local") loadLocalFiles();
        };

    const btnSave = document.getElementById("btn-save");
    if (btnSave) {
        btnSave.onclick = () => {
            // 🔥 1. 获取当前激活的卡片数据
            const activeCard = state.workspaceData.find(c => c.id === state.activeCardId);

            if (activeCard && activeCard.parentId === "sys_temp" && activeCard.isLinked) {
                // 如果是草稿箱里的链接状态，保存时就把它“实体化”
                activeCard.isLinked = false;
                activeCard.linkedPath = null;
                // 注意：修改表单时双向绑定已经自动更新了 activeCard.data，所以这里不用重新赋值
            }

            // 2. 写入 LocalStorage
            const success = saveWorkspace();
            if (success) {
                const old = btnSave.innerHTML;
                btnSave.innerHTML = "✓";
                setTimeout(() => { btnSave.innerHTML = old; }, 1000);
                renderTree(); // 刷新树，让🔗图标变成📄
            }
        };
    }
}

function initViewportAndSync() {
    const card = document.getElementById("cardPreview");
    function fitCard() {
        if (!card) return;
        const scaleX = (window.innerWidth - 30) / 354;
        card.style.transform = `scale(${Math.min(scaleX, 1)})`;
        card.style.transformOrigin = "top center";
    }
    window.addEventListener("resize", fitCard);
    fitCard();

    let isKeyboardOpen = false;
    const initialHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
            const currentHeight = window.visualViewport.height;
            if (currentHeight < initialHeight - 150) isKeyboardOpen = true;
            else if (isKeyboardOpen && currentHeight >= initialHeight - 50) {
                isKeyboardOpen = false;
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }
        });
    }
    document.addEventListener("focusin", (e) => {
        if (
            e.target.hasAttribute("contenteditable") ||
            e.target.tagName === "INPUT" ||
            e.target.tagName === "TEXTAREA"
        ) {
            setTimeout(
                () =>
                    e.target.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                    }),
                300
            );
        }
    });
}


function bindFormInputs() {
    document.querySelectorAll(".drawer-right [data-key]").forEach((el) => {
        el.addEventListener("input", (e) => {
            const key = e.target.dataset.key;
            const val = e.target.value;
            const activeCard = state.workspaceData.find(
                (c) => c.id === state.activeCardId
            );
            if (activeCard) activeCard.data[key] = val;
            const cardEl = document.querySelector(`.card [data-key="${key}"]`);
            if (cardEl) {
                if (key === "effects" || key === "plugin")
                    cardEl.innerHTML = parseEffectText(val);
                else cardEl.innerText = val;
            }
        });
    });
}

function initImageUpload() {
    const artContainer = document.getElementById("card-art-container");
    const imageUploader = document.getElementById("imageUploader");
    const cardImage = document.getElementById("card-image");
    const placeholder = document.getElementById("art-placeholder");
    const stretchWarning = document.getElementById("stretch-warning");
    const bottomDrawer = document.getElementById("bottomDrawer");

    if (!artContainer || !imageUploader) return;

    artContainer.addEventListener("click", (e) => {
        if (e.target === stretchWarning) {
            if (bottomDrawer) bottomDrawer.classList.add("open");
        } else if (e.target !== imageUploader) {
            imageUploader.click();
        }
    });

    imageUploader.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const rawBase64 = event.target.result;
            const tempImg = new Image();
            tempImg.onload = function() {
                currentOriginalSize = {
                    w: tempImg.naturalWidth,
                    h: tempImg.naturalHeight,
                };
                const compressedBase64 = compressImage(tempImg, 1000);
                cardImage.src = compressedBase64;
                cardImage.style.display = "block";
                if (placeholder) placeholder.style.display = "none";
                const activeCard = state.workspaceData.find(
                    (c) => c.id === state.activeCardId
                );
                if (activeCard) activeCard.data.image = compressedBase64;
                setTimeout(checkStretch, 100);
            };
            tempImg.src = rawBase64;
        };
        reader.readAsDataURL(file);
    });
}

function checkStretch() {
    const artContainer = document.getElementById("card-art-container");
    const stretchWarning = document.getElementById("stretch-warning");
    const cardImage = document.getElementById("card-image");
    const infoSize = document.getElementById("info-original-size");
    if (!infoSize || !stretchWarning || !artContainer || !cardImage) return;
    if (!currentOriginalSize.w || cardImage.style.display === "none") {
        stretchWarning.style.display = "none";
        return;
    }
    const frameW = artContainer.clientWidth;
    const frameH = artContainer.clientHeight;
    const origRatio = (currentOriginalSize.w / currentOriginalSize.h).toFixed(
        2
    );
    const frameRatio = (frameW / frameH).toFixed(2);
    const isStretched = Math.abs(origRatio - frameRatio) > 0.05;
    infoSize.innerText = `${currentOriginalSize.w} x ${currentOriginalSize.h}`;
    document.getElementById("info-original-ratio").innerText = origRatio;
    document.getElementById("info-frame-ratio").innerText = frameRatio;
    const statusText = document.getElementById("info-stretch-status");
    if (statusText) {
        if (isStretched) {
            stretchWarning.style.display = "block";
            statusText.innerText = "已拉伸（比例不匹配）";
            statusText.style.color = "#d32f2f";
        } else {
            stretchWarning.style.display = "none";
            statusText.innerText = "完美匹配";
            statusText.style.color = "#4CAF50";
        }
    }
}

window.closeBottomDrawer = function() {
    const drawer = document.getElementById("bottomDrawer");
    if (drawer) drawer.classList.remove("open");
};

// 菜单操作（因为用到 state 和 tree）
function hideContextMenu() {
    const menu = document.getElementById("fileContextMenu");
    if (menu) menu.classList.remove("show");
}

function createFolder() {
    const newFolder = {
        id: "folder_" + Date.now(),
        type: "folder",
        name: "新文件夹",
        parentId: null,
    };
    state.workspaceData.push(newFolder);
    folderState[newFolder.id] = true;
    saveWorkspace();
    saveFolderState();
    renderTree();
}

function createCard(parentId) {
    const newCardId = "card_" + Date.now();
    const newCard = {
        id: newCardId,
        type: "file",
        name: "未命名卡片.json",
        parentId: parentId || "sys_temp",
        data: {
            cardName: "未命名",
            cost: "0",
            speed: "0",
            life: "0",
            rank: "0",
            lv1: "",
            lv2: "",
            lv3: "",
            effects: "",
            plugin: "",
        },
    };
    state.workspaceData.push(newCard);
    state.activeCardId = newCardId;
    loadCardData(newCard.data);
    saveWorkspace();
    renderTree();
}

function renameItem(item) {
    const newName = prompt(
        "输入新名称",
        item.type === "file" ? item.name.replace(".json", "") : item.name
    );
    if (newName) {
        item.name = item.type === "file" ? newName + ".json" : newName;
        saveWorkspace();
        renderTree();
    }
}

function deleteItem(item) {
    if (
        confirm(
            `确定删除此${item.type === "folder" ? "文件夹及内容" : "卡片"}吗？`
        )
    ) {
        if (item.type === "folder") {
            state.workspaceData = state.workspaceData.filter(
                (i) => i.id !== item.id && i.parentId !== item.id
            );
        } else {
            state.workspaceData = state.workspaceData.filter(
                (i) => i.id !== item.id
            );
            if (state.activeCardId === item.id) {
                const empty = {
                    cardName: "",
                    cost: "",
                    speed: "",
                    life: "",
                    rank: "",
                    lv1: "",
                    lv2: "",
                    lv3: "",
                    effects: "",
                    plugin: "",
                };
                loadCardData(empty);
            }
        }
        state.selectedItemId = null;
        saveWorkspace();
        renderTree();
    }
}

function initFileMenu() {
    const btnFileMenu = document.getElementById("btn-file-menu");
    const fileContextMenu = document.getElementById("fileContextMenu");
    if (!btnFileMenu || !fileContextMenu) return;

    btnFileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        if (fileContextMenu.classList.contains("show"))
            return hideContextMenu();
        fileContextMenu.innerHTML = "";
        const selectedItem = state.workspaceData.find(
            (i) => i.id === state.selectedItemId
        );

        const addItem = (label, action, isDanger = false) => {
            const div = document.createElement("div");
            div.className = `context-item ${isDanger ? "danger" : ""}`;
            div.innerText = label;
            div.onclick = (ev) => {
                ev.stopPropagation();
                action();
                hideContextMenu();
            };
            fileContextMenu.appendChild(div);
        };

        if (state.currentTab === "local") {
            addItem("🔄 刷新本地目录", loadLocalFiles);
            return fileContextMenu.classList.add("show");
        }
        if (!selectedItem) {
            // 🔥 没选中任何东西时，显示新建文件夹
            addItem(uiRegistry.newFolder.icon + ' 新建文件夹', createFolder);
        } else if (selectedItem.type === "folder") {
            // 🔥 选中文件夹时，显示新建卡片
            addItem(uiRegistry.newCard.icon + ' 新建卡片', () => createCard(selectedItem.id));

            if (!selectedItem.isSystem) {
                addItem('✏️ 重命名文件夹', () => renameItem(selectedItem));
                addItem('🗑️ 删除文件夹', () => deleteItem(selectedItem), true);
            }
        } else if (selectedItem.type === "file") {
            addItem('✏️ 重命名卡片', () => renameItem(selectedItem));
            addItem('🗑️ 删除卡片', () => deleteItem(selectedItem), true);
        }
        fileContextMenu.classList.add("show");
    });
    document.addEventListener("click", hideContextMenu);
}
