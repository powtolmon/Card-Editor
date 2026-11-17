// ================= 4. 数据渲染与加载 =================
function initData() {
    initFolderState(); // 加载状态

    const saved = localStorage.getItem("cardEditor_workspace");
    if (saved) {
        state.workspaceData = JSON.parse(saved);
    } else {
        // 🌟 初始化：必须有一个 temp 文件夹
        state.workspaceData = [
            {
                id: "folder_temp",
                type: "folder",
                name: "temp",
                parentId: null,
                isLocked: true,
            },
            {
                id: "folder_1",
                type: "folder",
                name: "我的卡组",
                parentId: null,
            },
            {
                id: "card_1",
                type: "file",
                name: "例子怪兽.json",
                parentId: "folder_temp",
                data: {
                    cardName: "例子怪兽",
                    cost: "3",
                    speed: "2",
                    life: "6",
                    rank: "3",
                    lv1: "1-1000",
                    lv2: "2-3000",
                    lv3: "5-4000",
                    effects:
                        "「lv2-lv3」「咆哮」（攻击时发动）这张卡的力量上升2000。",
                    plugin: "「lv1」「暴风：1」再造成指定数额的伤害。",
                },
            },
        ];
        folderState = { folder_temp: true, folder_1: true };
        saveWorkspace();
        saveFolderState();
    }

    // 确保 temp 永远存在（防止用户用旧缓存覆盖）
    if (!state.workspaceData.find((i) => i.id === "folder_temp")) {
        state.workspaceData.unshift({
            id: "folder_temp",
            type: "folder",
            name: "temp",
            parentId: null,
            isLocked: true,
        });
    }

    state.activeCardId =
        state.workspaceData.find((i) => i.type === "file")?.id || null;
}

// ================= 6. 文件树管理 =================

// ... (renderTree 和 hideContextMenu 保持原样，无需修改) ...

// 🌟 新建文件夹（强制只能建在根目录）
function createFolder() {
    const newFolder = {
        id: "folder_" + Date.now(),
        type: "folder",
        name: "新卡组",
        parentId: null, // 强制兄弟层级
    };
    state.workspaceData.push(newFolder);
    folderState[newFolder.id] = true; // 默认打开
    saveWorkspace();
    saveFolderState();
    renderTree();
}

// 🌟 新建卡片（强制塞进 temp）
function createCard() {
    const newCardId = "card_" + Date.now();
    const newCard = {
        id: newCardId,
        type: "file",
        name: "未命名卡片.json",
        parentId: "folder_temp", // 强制放进 temp
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

    // 确保 temp 是展开的，不然新建了看不见
    folderState["folder_temp"] = true;
    saveFolderState();

    state.workspaceData.push(newCard);
    state.activeCardId = newCardId;
    loadCardData(newCard.data);
    saveWorkspace();
    renderTree();
}

// ... (renameItem 保持原样) ...

function deleteItem(item) {
    // 🌟 temp 不能被删除！
    if (item.id === "folder_temp") {
        alert("temp 文件夹是系统默认草稿箱，不能删除哦！");
        return;
    }

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

        // 🌟 状态判断
        if (!selectedItem) {
            // 空白处：只能新建文件夹（兄弟）和新建卡片（放temp）
            addItem("➕ 新建文件夹", createFolder);
            addItem("📄 新建卡片 (自动放入 temp)", createCard);
        } else if (selectedItem.id === "folder_temp") {
            // 选中了 temp：只能新建卡片
            addItem("📄 新建卡片", createCard);
        } else if (selectedItem.type === "folder") {
            // 选中了兄弟文件夹：可以新建文件夹（子层级）或新建卡片（依然放temp）
            addItem("➕ 新建子文件夹", () => {
                const newFolder = {
                    id: "folder_" + Date.now(),
                    type: "folder",
                    name: "新子文件夹",
                    parentId: selectedItem.id,
                };
                state.workspaceData.push(newFolder);
                folderState[newFolder.id] = true;
                saveWorkspace();
                saveFolderState();
                renderTree();
            });
            addItem("📄 新建卡片 (自动放入 temp)", createCard);
            addItem("✏️ 重命名文件夹", () => renameItem(selectedItem));
            addItem("🗑️ 删除文件夹", () => deleteItem(selectedItem), true);
        } else if (selectedItem.type === "file") {
            addItem("✏️ 重命名卡片", () => renameItem(selectedItem));
            addItem("🗑️ 删除卡片", () => deleteItem(selectedItem), true);
        }

        fileContextMenu.classList.add("show");
    });

    document.addEventListener("click", hideContextMenu);
}
