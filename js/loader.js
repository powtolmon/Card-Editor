document.addEventListener('DOMContentLoaded', async () => {
    const components = [
        { id: 'mount-top-bar', file: 'components/top-bar.html' },
        { id: 'mount-card-canvas', file: 'components/card-canvas.html' },
        { id: 'mount-left-drawer', file: 'components/left-drawer.html' },
        { id: 'mount-right-drawer', file: 'components/right-drawer.html' },
        { id: 'mount-bottom-drawer', file: 'components/bottom-drawer.html' } // 🔥 加上这一行
    ];

    const promises = components.map(async (comp) => {
        try {
            const response = await fetch(comp.file);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            document.getElementById(comp.id).innerHTML = html;
        } catch (err) {
            console.error(`组件加载失败: ${comp.file}`, err);
        }
    });

    await Promise.all(promises);
    window.dispatchEvent(new Event('componentsLoaded'));
});