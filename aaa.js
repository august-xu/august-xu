// ==UserScript==
// @name         Groq AI 网页一键总结 (V1.22)
// @namespace    http://tampermonkey.net/
// @version      1.22
// @description  图标回归 ✨ Emoji，精致小圆点，适配移动端拖拽与深度总结
// @author       YourName
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.groq.com
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ================= 配置区域 =================
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const MODEL_LIST = [
        { name: "Llama 4 Scout 17B", id: "meta-llama/llama-4-scout-17b-16e-instruct" },
        { name: "Llama 3.3 70B", id: "llama-3.3-70b-versatile" },
        { name: "Llama 3.1 8B", id: "llama-3.1-8b-instant" },
        { name: "Qwen 3 32B", id: "qwen/qwen3-32b" },
        { name: "Kimi k2", id: "moonshotai/kimi-k2-instruct-0905" }
    ];
    const MAX_CONTEXT_CHARS = 30000;
    const PANEL_WIDTH_PC = 500;
    // ===========================================

    const INNER_CSS = `
        :host {
            all: initial !important;
            position: fixed !important;
            z-index: 2147483647 !important;
            top: 0; left: 0; width: 0; height: 0;
            display: block !important;
        }

        * { box-sizing: border-box !important; -webkit-tap-highlight-color: transparent; }

        #groq-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: fixed !important;
            z-index: 2147483647 !important;
            background: linear-gradient(135deg, rgba(0,122,255,0.95), rgba(0,86,179,0.95)) !important;
            color: white !important;
            cursor: pointer !important;
            border: none !important;
            outline: none !important;
            user-select: none !important;
            touch-action: none !important;
            transition: transform 0.1s !important;
            padding: 0 !important;
            /* 确保 Emoji 字体显示正常 */
            font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif !important;
        }
        
        #groq-btn:active { transform: scale(0.85) !important; }

        /* PC端：保持长条 */
        @media (min-width: 601px) {
            #groq-btn {
                height: 44px !important;
                padding: 0 20px !important;
                border-radius: 50px !important;
                min-width: 130px !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
            }
            .btn-text { 
                display: inline-block !important; 
                margin-left: 6px !important; 
                font-family: system-ui, sans-serif !important;
                font-weight: 600 !important;
                font-size: 15px !important;
                color: white !important;
            }
            .btn-icon { font-size: 18px !important; }
        }

        /* 移动端：精致小圆点 (38px) */
        @media (max-width: 600px) {
            #groq-btn {
                width: 25px !important;
                height: 25px !important;
                border-radius: 50% !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.3) !important;
            }
            .btn-text { display: none !important; }
            .btn-icon { 
                display: flex !important; 
                align-items: center; 
                justify-content: center; 
                font-size: 20px !important; 
                line-height: 1 !important;
            }
        }

        /* 面板样式 */
        #groq-panel {
            display: none;
            flex-direction: column !important;
            position: fixed !important;
            z-index: 2147483646 !important;
            background: #ffffff !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 50px rgba(0,0,0,0.3) !important;
            border: 1px solid #e0e0e0 !important;
            overflow: hidden !important;
            font-family: system-ui, -apple-system, sans-serif !important;
        }

        @media (min-width: 601px) {
            #groq-panel { width: ${PANEL_WIDTH_PC}px !important; height: 600px !important; }
        }
        @media (max-width: 600px) {
            #groq-panel { width: 92vw !important; height: 75vh !important; }
        }

        #groq-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 0 16px !important;
            background: #f5f5f7 !important;
            border-bottom: 1px solid #e0e0e0 !important;
            height: 48px !important;
            flex-shrink: 0 !important;
            color: #1d1d1f !important;
            font-weight: bold !important;
            font-size: 15px !important;
        }

        #groq-content {
            padding: 16px !important;
            flex-grow: 1 !important;
            overflow-y: auto !important;
            line-height: 1.6 !important;
            font-size: 14px !important;
            color: #1d1d1f !important;
            background: white !important;
            text-align: left !important;
        }

        /* Markdown & 表格样式 */
        h3 { display: block !important; font-size: 17px !important; margin: 15px 0 10px 0 !important; color: #007AFF !important; border-left: 4px solid #007AFF !important; padding-left: 10px !important; font-weight: bold !important; }
        strong { color: #d93025 !important; font-weight: 700 !important; }
        ul { display: block !important; padding-left: 20px !important; margin: 10px 0 !important; }
        li { display: list-item !important; margin-bottom: 6px !important; list-style-type: disc !important; }
        
        .table-wrapper { width: 100% !important; overflow-x: auto !important; margin: 15px 0 !important; border: 1px solid #e1e4e8 !important; border-radius: 6px !important; }
        table { border-collapse: collapse !important; width: 100% !important; font-size: 13px !important; }
        th { background: #f6f8fa !important; padding: 10px 12px !important; border: 1px solid #e1e4e8 !important; }
        td { padding: 10px 12px !important; border: 1px solid #e1e4e8 !important; }

        #groq-controls {
            display: flex !important;
            padding: 0 15px !important;
            border-top: 1px solid #e0e0e0 !important;
            gap: 10px !important;
            align-items: center !important;
            background: #f5f5f7 !important;
            height: 52px !important;
        }
        .model-select { flex-grow: 1 !important; height: 32px !important; border-radius: 6px !important; border: 1px solid #ccc !important; font-size: 13px !important; }
        .link-btn { color: #007AFF !important; cursor: pointer !important; font-size: 12px !important; }
        .close-btn { cursor: pointer !important; font-size: 24px !important; color: #888 !important; padding: 0 5px !important; }
    `;

    let apiKey = GM_getValue('groq_api_key', '');
    let currentModel = GM_getValue('groq_current_model', MODEL_LIST[0].id);
    let btnPosX = GM_getValue('btn_pos_x', 'auto');
    let btnPosY = GM_getValue('btn_pos_y', '15%');

    function renderMarkdown(text) {
        if (!text) return "";
        let lines = text.split('\n');
        let htmlResult = [];
        let inTable = false;
        let tableRows = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line.startsWith('|') || (line.includes('|') && i < lines.length - 1 && lines[i+1].includes('|-'))) {
                inTable = true; tableRows.push(line); continue;
            } 
            if (inTable && !line.includes('|')) {
                htmlResult.push(processTable(tableRows));
                tableRows = []; inTable = false;
            }
            if (!inTable) {
                let formatted = line
                    .replace(/^###\s+(.*$)/gm, '<strong>$1</strong>')
                    .replace(/^##\s+(.*$)/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^\s*[\*\+\-]\s+(.*$)/gm, '<li>$1</li>');
                if (formatted.startsWith('<li>')) htmlResult.push(formatted);
                else if (formatted === "") htmlResult.push('<br>');
                else htmlResult.push(`<p>${formatted}</p>`);
            }
        }
        if (inTable) htmlResult.push(processTable(tableRows));
        return htmlResult.join('');
    }

    function processTable(rows) {
        if (rows.length < 2) return rows.join('<br>'); 
        const parseRow = (row) => {
            let r = row.trim();
            if (r.startsWith('|')) r = r.substring(1);
            if (r.endsWith('|')) r = r.substring(0, r.length - 1);
            return r.split('|').map(c => c.trim());
        };
        let tableHtml = '<div class="table-wrapper"><table><thead>';
        let headers = parseRow(rows[0]);
        tableHtml += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
        for (let i = 2; i < rows.length; i++) {
            if (!rows[i].includes('|')) continue;
            let cells = parseRow(rows[i]);
            while (cells.length < headers.length) cells.push('');
            tableHtml += '<tr>' + cells.slice(0, headers.length).map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
        return tableHtml + '</tbody></table></div>';
    }

    function updatePanelPosition(btn, panel) {
        const rect = btn.getBoundingClientRect();
        const winWidth = window.innerWidth;
        const panelActualWidth = winWidth <= 600 ? winWidth * 0.92 : PANEL_WIDTH_PC;
        let targetLeft = rect.left;
        if (targetLeft + panelActualWidth > winWidth - 10) targetLeft = winWidth - panelActualWidth - 10;
        if (targetLeft < 10) targetLeft = 10;
        panel.style.left = targetLeft + 'px';
        panel.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    }

    function ensureGUI() {
        if (document.getElementById('groq-host-root')) return;
        const mountPoint = document.documentElement || document.body;
        if (!mountPoint) return;

        const host = document.createElement('div');
        host.id = 'groq-host-root';
        const shadow = host.attachShadow({mode: 'open'});
        const style = document.createElement('style');
        style.textContent = INNER_CSS;
        shadow.appendChild(style);

        const optionsHtml = MODEL_LIST.map(m => `<option value="${m.id}" ${m.id === currentModel ? 'selected' : ''}>${m.name}</option>`).join('');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <button id="groq-btn">
                <span class="btn-icon">✨</span>
                <span class="btn-text">AI 总结</span>
            </button>
            <div id="groq-panel">
                <div id="groq-header"><span>📑 网页总结</span><div class="close-btn">×</div></div>
                <div id="groq-content">准备就绪...</div>
                <div id="groq-controls">
                    <select id="model-select" class="model-select">${optionsHtml}</select>
                    <div class="link-btn" id="reset-key">设置 Key</div>
                </div>
            </div>
        `;
        shadow.appendChild(wrapper);

        const btn = shadow.querySelector('#groq-btn');
        const panel = shadow.querySelector('#groq-panel');
        const contentDiv = shadow.querySelector('#groq-content');

        if (btnPosX === 'auto') { 
            btn.style.right = '20px'; 
            btn.style.bottom = btnPosY; 
        } else { 
            btn.style.left = btnPosX; 
            btn.style.bottom = btnPosY; 
        }

        let isDragging = false;
        let startX, startY, initialLeft, initialBottom;

        const dStart = (e) => {
            isDragging = false;
            const cX = e.touches ? e.touches[0].clientX : e.clientX;
            const cY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = cX; startY = cY;
            const r = btn.getBoundingClientRect();
            initialLeft = r.left; initialBottom = window.innerHeight - r.bottom;
        };
        const dMove = (e) => {
            const cX = e.touches ? e.touches[0].clientX : e.clientX;
            const cY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = cX - startX; const dy = cY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging = true;
            if (isDragging) {
                if(e.cancelable) e.preventDefault();
                btn.style.right = 'auto';
                btn.style.left = (initialLeft + dx) + 'px';
                btn.style.bottom = (initialBottom - dy) + 'px';
                if (panel.style.display === 'flex') updatePanelPosition(btn, panel);
            }
        };
        const dEnd = () => { if (isDragging) { GM_setValue('btn_pos_x', btn.style.left); GM_setValue('btn_pos_y', btn.style.bottom); } };

        btn.addEventListener('mousedown', (e) => {
            dStart(e);
            const m = (ev) => dMove(ev);
            const u = () => { dEnd(); document.removeEventListener('mousemove', m); document.removeEventListener('mouseup', u); };
            document.addEventListener('mousemove', m); document.addEventListener('mouseup', u);
        });
        btn.addEventListener('touchstart', dStart, {passive: false});
        btn.addEventListener('touchmove', dMove, {passive: false});
        btn.addEventListener('touchend', dEnd);

        btn.onclick = (e) => {
            if (isDragging) return;
            if (panel.style.display === 'flex') { panel.style.display = 'none'; return; }
            if (!apiKey) {
                const k = prompt('输入 Groq API Key:');
                if (k) { apiKey = k.trim(); GM_setValue('groq_api_key', apiKey); } else return;
            }
            panel.style.display = 'flex';
            updatePanelPosition(btn, panel);
            runAnalysis(contentDiv);
        };

        shadow.querySelector('.close-btn').onclick = () => panel.style.display = 'none';
        shadow.querySelector('#model-select').onchange = (e) => {
            currentModel = e.target.value;
            GM_setValue('groq_current_model', currentModel);
            runAnalysis(contentDiv);
        };
        shadow.querySelector('#reset-key').onclick = () => {
            const k = prompt('设置 Key:', apiKey);
            if(k) { apiKey=k.trim(); GM_setValue('groq_api_key', apiKey); }
        };

        mountPoint.appendChild(host);
    }

    function runAnalysis(contentDiv) {
        contentDiv.innerHTML = `<p style="color:#666">⏳ 正在分析内容...</p>`;
        let rawText = "";
        const selectors = ['article', 'main', '.post-content', '#content', 'body'];
        for (let sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                const clone = el.cloneNode(true);
                clone.querySelectorAll('script, style, nav, footer, iframe, .ads').forEach(n=>n.remove());
                let t = clone.innerText;
                if (t && t.replace(/\s/g, '').length > 200) { rawText = t; break; }
            }
        }
        if (!rawText) rawText = document.body.innerText;
        rawText = rawText.replace(/\s+/g, ' ').substring(0, MAX_CONTEXT_CHARS);

        // V1.11 深度摘要提示词
        const SYSTEM_PROMPT = `你是一个专业的网页内容分析助手。请对用户提供的网页内容（可能是中文或英文）进行深度总结。
要求：始终使用【简体中文】输出。
结构：
- ## 核心主旨。用一句精炼的话概括全文。
- ## 关键要点。使用无序列表提取 3-5 个最重要的核心价值点或事实。
- ## 详细数据。如果网页包含对比或数据，使用 Markdown 表格呈现；否则省略。
风格：专业客观，剔除广告。关键术语用 **粗体**。`;

        GM_xmlhttpRequest({
            method: "POST",
            url: API_URL,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            data: JSON.stringify({
                "messages": [{ "role": "system", "content": SYSTEM_PROMPT }, { "role": "user", "content": rawText }],
                "model": currentModel, "temperature": 0.3, "max_completion_tokens": 2048, "stream": true
            }),
            onreadystatechange: function(res) {
                if (res.readyState === 3 || res.readyState === 4) {
                    let acc = "";
                    const chunks = res.responseText.split('\n');
                    for (const chunk of chunks) {
                        if (chunk.startsWith('data: ') && !chunk.includes('[DONE]')) {
                            try {
                                const json = JSON.parse(chunk.substring(6));
                                if(json.choices[0]?.delta?.content) acc += json.choices[0].delta.content;
                            } catch (e) {}
                        }
                    }
                    if (acc) {
                        contentDiv.innerHTML = renderMarkdown(acc);
                        contentDiv.scrollTop = contentDiv.scrollHeight;
                    }
                }
            },
            onload: function(res) { if (res.status !== 200) contentDiv.innerHTML = `<p style="color:red">Error: ${res.status}</p>`; }
        });
    }

    setInterval(() => { if (!document.getElementById('groq-host-root')) ensureGUI(); }, 2000);
    ensureGUI();
})();
