// ================= 全局状态与本地存储 =================
const state = {
    workspaceData: [],
    localData: [],
    activeCardId: null,
    selectedItemId: null,
    currentTab: "local",
};

let folderState = {};
let currentOriginalSize = { w: 0, h: 0 };

function initFolderState() {
    const saved = localStorage.getItem("cardEditor_folder_state");
    if (saved) folderState = JSON.parse(saved);
}

function saveFolderState() {
    localStorage.setItem(
        "cardEditor_folder_state",
        JSON.stringify(folderState)
    );
}

function saveWorkspace() {
    try {
        localStorage.setItem(
            "cardEditor_workspace",
            JSON.stringify(state.workspaceData)
        );
        return true;
    } catch (e) {
        console.warn("⚠️ 本地存储已满！", e);
        alert(
            "保存失败：浏览器的本地存储空间已满。\n\n请尝试清理浏览器缓存或刷新页面。"
        );
        return false;
    }
}

function initData() {
    initFolderState();
    const saved = localStorage.getItem("cardEditor_workspace");
    if (saved) {
        state.workspaceData = JSON.parse(saved);
    } else {
        // 🔥 初始化为空，只有一个系统草稿箱
        state.workspaceData = [
            { id: "sys_temp", type: "folder", name: "草稿箱", parentId: null, isSystem: true }
        ];
        folderState = {};
        saveWorkspace();
        saveFolderState();
    }
    state.activeCardId = null; // 一开始没有打开任何卡
}