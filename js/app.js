// ================= 启动引擎 =================
window.addEventListener("componentsLoaded", () => {
    window.closeDrawers();
    if (typeof hideContextMenu === "function") hideContextMenu();

    // 渲染顶部工具栏
    renderToolbar("top-left-mount", ["menu"]);
    renderToolbar("top-right-mount", [
        "undo",
        "save",
        "export",
        "edit",
        "more",
    ]);
    renderToolbar("left-toolbar-mount", ["refresh", "more"]);

    // 初始化数据和核心逻辑
    initData();
    initFileMenu();
    bindTabEvents();
    bindAppUIEvents();
    bindCardInputs();
    bindFormInputs();
    initViewportAndSync();
    initImageUpload();

    // 初始化草稿箱交互
    if (typeof initTempPanel === "function") initTempPanel();

    // ...
    loadLocalFiles();

    // 🔥 替换掉原来的 firstCard 逻辑
    const activeCard = state.workspaceData.find((c) => c.id === state.activeCardId);
    if (activeCard) {
        loadCardData(activeCard.data, activeCard.name);
    } else {
        // 如果没有任何激活的卡，清空画布和表单
        const emptyData = { cardName: '', cost: '', speed: '', life: '', rank: '', lv1: '', lv2: '', lv3: '', effects: '', plugin: '' };
        document.querySelectorAll(".card [data-key]").forEach(el => el.innerText = "");
        document.querySelectorAll(".drawer-right [data-key]").forEach(el => el.value = "");
        const topTitle = document.getElementById("top-title");
        if (topTitle) topTitle.innerText = "未选择卡片";
        const cardImage = document.getElementById("card-image");
        if (cardImage) cardImage.style.display = "none";
        const placeholder = document.getElementById("art-placeholder");
        if (placeholder) placeholder.style.display = "block";
    }
});
