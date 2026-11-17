// ================= 文件树渲染与操作 =================
function renderTree() {
    if (state.currentTab === "local") {
        renderLocalTree();
    } else {
        renderVirtualTree();
    }
}

// 渲染本地文件树
function renderLocalTree() {
    document.getElementById("treeContainer").style.display = "block";
    document.getElementById("virtualTreeWrapper").style.display = "none";

    const treeContainer = document.getElementById("treeContainer");
    treeContainer.innerHTML = "";

    if (!state.localData || state.localData.length === 0) {
        treeContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;"><div style="font-size: 24px; margin-bottom: 10px;">📂</div>暂无本地数据<br><br>请确保 cards/ 文件夹下有 <b>index.json</b></div>`;
        return;
    }

    function renderNode(node, depth = 0) {
        treeContainer.appendChild(createNodeElement(node, depth));
        if (node.type === "folder" && folderState[node.id]) {
            state.localData.filter((c) => c.parentId === node.id).forEach((child) => renderNode(child, depth + 1));
        }
    }
    state.localData.filter((n) => !n.parentId).forEach((root) => renderNode(root, 0));
}

// 渲染虚拟文件的双栏
function renderVirtualTree() {
    document.getElementById("treeContainer").style.display = "none";
    document.getElementById("virtualTreeWrapper").style.display = "flex";
    const tempContent = document.getElementById("tempContent");
    const userTreeContainer = document.getElementById("userTreeContainer");
    tempContent.innerHTML = "";
    userTreeContainer.innerHTML = "";

    // 1. 确保系统草稿箱存在
    if (!state.workspaceData.find((n) => n.id === "sys_temp")) {
        state.workspaceData.unshift({ id: "sys_temp", type: "folder", name: "草稿箱", parentId: null, isSystem: true });
    }

    // 2. 渲染草稿箱内容
    const tempCards = state.workspaceData.filter((n) => n.parentId === "sys_temp");
    if (tempCards.length === 0) {
        tempContent.innerHTML = '<div style="padding:10px; color:#aaa; font-size:12px; text-align:center;">暂无草稿</div>';
    } else {
        tempCards.forEach((card) => tempContent.appendChild(createNodeElement(card, 1)));
    }

    // 3. 判断用户是否有自己的文件夹
    const userRoots = state.workspaceData.filter((n) => !n.parentId && n.id !== "sys_temp");

    if (userRoots.length === 0) {
        // 🔥 如果用户啥都没建，直接把下半部分的高度也压扁，不留一丝痕迹
        userTreeContainer.style.display = "none";
    } else {
        userTreeContainer.style.display = "block";

        // 我们可以给用户文件夹加一个“隐形”的头部，让它也像手风琴一样可拖拽
        // （这个以后做，目前先保证它显示出来）
        function renderNode(node, depth = 0) {
            userTreeContainer.appendChild(createNodeElement(node, depth));
            if (node.type === "folder" && folderState[node.id]) {
                state.workspaceData.filter((c) => c.parentId === node.id).forEach((child) => renderNode(child, depth + 1));
            }
        }
        userRoots.forEach((root) => renderNode(root, 0));
    }
}

// 🔥 新增：把打开的卡片塞进草稿箱
function addToTemp(cardData, cardName, linkedPath = null) {
    // 检查草稿箱里是不是已经有这张卡了
    const tempCards = state.workspaceData.filter(n => n.parentId === "sys_temp");
    const existing = tempCards.find(n => n.name === cardName);

    if (existing) {
        // 如果已经有了，直接激活它（防止重复添加）
        state.activeCardId = existing.id;
        // 如果原来是链接，现在又点开，确保链接路径正确
        if (linkedPath) existing.linkedPath = linkedPath;
        return existing.id;
    }

    // 如果没有，创建一个新的代理节点
    const tempNode = {
        id: "temp_" + Date.now(),
        type: "file",
        name: cardName,
        parentId: "sys_temp",
        isLinked: true, // 🔗 默认是链接状态
        linkedPath: linkedPath, // 记录本地路径（如果是本地文件的话）
        data: JSON.parse(JSON.stringify(cardData)) // 深拷贝一份数据，防止改草稿影响了原卡
    };

    state.workspaceData.push(tempNode);
    state.activeCardId = tempNode.id; // 把焦点切到草稿上
    saveWorkspace();
    renderTree();
    return tempNode.id;
}

// 修改 createNodeElement，处理“链接”图标的显示
function createNodeElement(node, depth) {
    const div = document.createElement("div");
    div.className = `row ${node.type === "folder" ? "folder-node" : "file-node"}`;

    const indent = 12 + depth * 12;
    div.style.paddingLeft = `${indent}px`;

    if (node.id === state.activeCardId) div.classList.add("active");
    if (node.id === state.selectedItemId) div.classList.add("selected");

    let arrowHtml = "";
    if (node.type === "folder" && !node.isSystem) {
        arrowHtml = `<span class="arrow ${folderState[node.id] ? "open" : ""}">▶</span>`;
    } else {
        arrowHtml = `<span class="arrow" style="visibility:hidden">▶</span>`;
    }

    // 🔥 如果是链接状态的草稿，图标换成链条
    let icon = node.type === "folder" ? "📁" : "📄";
    if (node.isLinked) icon = "🔗";

    div.innerHTML = `${arrowHtml}<span class="icon">${icon}</span><span class="node-name">${node.name}</span>`;

    div.onclick = (e) => {
        e.stopPropagation();
        state.selectedItemId = node.id;
        hideContextMenu();

        if (node.type === "folder") {
            folderState[node.id] = !folderState[node.id];
            saveFolderState();
            renderTree();
        } else {
            // --- 文件点击分支 ---
            if (node.id.startsWith('local_')) {
                // 1. 点击的是本地文件 -> 塞进草稿箱，变成带🔗的代理
                fetch(`./cards/${node.name}`)
                    .then(res => res.json())
                    .then(cardData => {
                        addToTemp(cardData, node.name, `./cards/${node.name}`);
                        loadCardData(cardData);
                        if (typeof window.closeDrawers === "function") window.closeDrawers();
                    });
            } else if (node.parentId !== "sys_temp") {
                // 2. 点击的是普通文件夹里的虚拟卡片 -> 直接打开，不塞草稿！
                state.activeCardId = node.id;
                loadCardData(node.data);
                renderTree();
                if (typeof window.closeDrawers === "function") window.closeDrawers();
            } else {
                // 3. 点击的就是草稿箱里的卡片本身
                state.activeCardId = node.id;
                loadCardData(node.data);
                renderTree();
                if (typeof window.closeDrawers === "function") window.closeDrawers();
            }
        }
    };

    return div;
}


function loadLocalFiles() {
    const treeContainer = document.getElementById("treeContainer");
    if (!treeContainer) return;
    treeContainer.innerHTML = '<div style="padding: 15px; color: #888;">正在读取本地目录...</div>';

    fetch("./cards/index.json")
        .then((res) => {
            if (!res.ok) throw new Error("找不到 index.json");
            return res.json();
        })
        .then((data) => {
            const virtualRoot = { id: "local_root", type: "folder", name: "cards (本地)", parentId: null };
            const files = data.map((fileName, index) => ({ id: `local_${index}`, type: "file", name: fileName, parentId: "local_root" }));
            state.localData = [virtualRoot, ...files];

            // 🔥 安全检查
            if (!folderState) folderState = {};
            folderState["local_root"] = true;

            renderTree();
        })
        .catch((err) => {
            console.error("加载本地文件失败:", err);
            treeContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;"><div style="font-size: 24px; margin-bottom: 10px;">📂</div>暂无本地数据<br><br>请确保 cards/ 文件夹下有 <b>index.json</b></div>`;
        });
}

function bindTabEvents() {
    const tabLocal = document.getElementById("tab-local");
    const tabVirtual = document.getElementById("tab-virtual");
    const btnRefresh = document.getElementById("btn-refresh-local");

    if (!tabLocal || !tabVirtual) return;

    tabLocal.onclick = () => {
        state.currentTab = "local";
        tabLocal.classList.add("active");
        tabVirtual.classList.remove("active");
        if (btnRefresh) btnRefresh.style.display = "flex";
        loadLocalFiles();
    };

    tabVirtual.onclick = () => {
        state.currentTab = "virtual";
        tabVirtual.classList.add("active");
        tabLocal.classList.remove("active");
        if (btnRefresh) btnRefresh.style.display = "none";
        renderTree();
    };
}

// 草稿箱手风琴拖拽
function initTempPanel() {
    const tempPanel = document.getElementById("tempPanel");
    const tempHeader = document.getElementById("tempHeader");
    const tempArrow = document.getElementById("tempArrow");
    if (!tempPanel || !tempHeader) return;

    let startY = 0, startHeight = 0, isDragging = false, hasMoved = false;

    tempHeader.addEventListener("click", (e) => {
        if (e.target === tempArrow) return;
        e.stopPropagation();
        tempHeader.classList.add("selected");
        state.selectedItemId = "sys_temp";
    });
    document.addEventListener("click", (e) => { if (!tempPanel.contains(e.target)) tempHeader.classList.remove("selected"); });

    tempHeader.addEventListener("touchstart", (e) => {
        startY = e.touches[0].clientY; startHeight = tempPanel.offsetHeight; isDragging = true; hasMoved = false;
    }, { passive: false });

    tempHeader.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].clientY - startY;

        if (Math.abs(deltaY) > 5) {
            hasMoved = true; e.preventDefault();
            tempHeader.classList.add("dragging");
            tempPanel.style.transition = "none";

            let newHeight = startHeight + deltaY;
            if (newHeight < 38) newHeight = 38;
            if (newHeight > window.innerHeight * 0.6) newHeight = window.innerHeight * 0.6;
            tempPanel.style.height = newHeight + "px";
        }
    }, { passive: false });

    tempHeader.addEventListener("touchend", () => {
        if (!isDragging) return;
        isDragging = false;
        tempHeader.classList.remove("dragging");
        tempPanel.style.transition = "height 0.3s ease";

        if (!hasMoved) {
            if (tempPanel.offsetHeight > 38) {
                tempPanel.style.height = "38px";
                tempArrow.classList.remove("open");
                tempArrow.style.transform = "rotate(0deg)";
            } else {
                tempPanel.style.height = "200px";
                tempArrow.classList.add("open");
                tempArrow.style.transform = "rotate(90deg)";
            }
        } else {
            if (tempPanel.offsetHeight < 60) {
                tempPanel.style.height = "38px";
                tempArrow.style.transform = "rotate(0deg)";
                tempArrow.classList.remove("open");
            } else {
                tempArrow.style.transform = "rotate(90deg)";
                tempArrow.classList.add("open");
            }
        }
    });
}