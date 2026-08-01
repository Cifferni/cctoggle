// @ts-nocheck TODO: 逐步添加类型注解后移除
// uTools ccToggle - prompts.js
// 提示词管理：使用 utools.db 存储提示词数据
var utils = require("./utils");
var configRw = require("./config-rw");
var fs = utils.fs;
var path = utils.path;
var DB_KEY = "cctoggle_prompts";
var BACKUP_KEY = "cctoggle_prompts_backup";
// ─────────── 数据库操作 ───────────
function _getAll() {
    try {
        var doc = utools.db.get(DB_KEY);
        if (!doc)
            return [];
        return Array.isArray(doc.prompts) ? doc.prompts : [];
    }
    catch (e) {
        return [];
    }
}
function _saveAll(prompts) {
    try {
        var existing = null;
        try {
            existing = utools.db.get(DB_KEY);
        }
        catch (e) { }
        // 深拷贝确保是纯 JSON 对象
        var cleanPrompts = JSON.parse(JSON.stringify(prompts));
        var doc = { _id: DB_KEY, prompts: cleanPrompts };
        if (existing && existing._rev)
            doc._rev = existing._rev;
        utools.db.put(doc);
    }
    catch (e) {
        throw new Error("Failed to save to db: " + (e.message || e));
    }
}
function _generateId() {
    return "prompt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}
// ─────────── CRUD ───────────
function listPrompts() {
    return _getAll();
}
function getPrompt(id) {
    var prompts = _getAll();
    for (var i = 0; i < prompts.length; i++) {
        if (prompts[i].id === id)
            return prompts[i];
    }
    return null;
}
function savePrompt(data) {
    if (!data || !data.name) {
        return { success: false, error: "Name is required" };
    }
    var prompts = _getAll();
    var now = new Date().toISOString();
    var prompt = {
        id: data.id || _generateId(),
        name: data.name,
        description: data.description || "",
        content: data.content || "",
        agents: Array.isArray(data.agents) ? data.agents : [],
        variables: Array.isArray(data.variables) ? data.variables : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        isTemplate: !!data.isTemplate,
        templateId: data.templateId || null,
        createdAt: data.createdAt || now,
        updatedAt: now,
    };
    var found = false;
    for (var i = 0; i < prompts.length; i++) {
        if (prompts[i].id === prompt.id) {
            prompts[i] = prompt;
            found = true;
            break;
        }
    }
    if (!found) {
        prompts.push(prompt);
    }
    _saveAll(prompts);
    return { success: true, prompt: prompt };
}
function deletePrompt(id) {
    var prompts = _getAll();
    var filtered = prompts.filter(function (p) { return p.id !== id; });
    if (filtered.length === prompts.length) {
        return { success: false, error: "Prompt not found" };
    }
    _saveAll(filtered);
    return { success: true };
}
function duplicatePrompt(id) {
    var prompts = _getAll();
    var source = null;
    for (var i = 0; i < prompts.length; i++) {
        if (prompts[i].id === id) {
            source = prompts[i];
            break;
        }
    }
    if (!source) {
        return { success: false, error: "Source prompt not found" };
    }
    var now = new Date().toISOString();
    var newPrompt = {
        id: _generateId(),
        name: source.name + " (副本)",
        description: source.description,
        content: source.content,
        agents: source.agents ? source.agents.slice() : [],
        variables: source.variables ? source.variables.slice() : [],
        tags: source.tags ? source.tags.slice() : [],
        isTemplate: false,
        templateId: source.templateId || source.id,
        createdAt: now,
        updatedAt: now,
    };
    prompts.push(newPrompt);
    _saveAll(prompts);
    return { success: true, prompt: newPrompt };
}
// ─────────── 导入导出 ───────────
function exportPrompts() {
    var prompts = _getAll();
    return JSON.stringify(prompts, null, 2);
}
function importPrompts(jsonString) {
    try {
        var data = JSON.parse(jsonString);
        if (!Array.isArray(data)) {
            return { success: false, error: "Invalid format: expected array" };
        }
        var existing = _getAll();
        var existingIds = {};
        existing.forEach(function (p) { existingIds[p.id] = true; });
        var now = new Date().toISOString();
        var imported = 0;
        data.forEach(function (item) {
            if (!item.name || !item.content)
                return;
            var prompt = {
                id: item.id && !existingIds[item.id] ? item.id : _generateId(),
                name: item.name,
                description: item.description || "",
                content: item.content,
                agents: Array.isArray(item.agents) ? item.agents : [],
                variables: Array.isArray(item.variables) ? item.variables : [],
                tags: Array.isArray(item.tags) ? item.tags : [],
                isTemplate: !!item.isTemplate,
                templateId: item.templateId || null,
                createdAt: item.createdAt || now,
                updatedAt: now,
            };
            existing.push(prompt);
            imported++;
        });
        _saveAll(existing);
        return { success: true, count: imported };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
}
// ─────────── 读取各 Agent 原始提示词 ───────────
// 获取 Agent 对应的提示词文件路径
function _getAgentPromptPath(agent) {
    switch (agent) {
        case "claude": return utils.getClaudeMdPath();
        case "codex": return utils.getCodexAgentsMdPath();
        case "gemini": return utils.getGeminiMdPath();
        case "openclaw": return utils.getOpenClawAgentsMdPath();
        default: return null;
    }
}
// 读取指定 Agent 的提示词文件
function _readPromptFile(agent) {
    try {
        var filePath = _getAgentPromptPath(agent);
        if (filePath && fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, "utf8");
        }
        return "";
    }
    catch (e) {
        return "";
    }
}
// 写入提示词到指定 Agent 的文件
function _writePromptFile(agent, content) {
    var filePath = _getAgentPromptPath(agent);
    if (!filePath) {
        throw new Error("Unsupported agent: " + agent);
    }
    if (agent === "openclaw" && !utils.getOpenClawWorkspaceDir()) {
        throw new Error("OpenClaw workspace not found");
    }
    utils.ensureDir(filePath);
    fs.writeFileSync(filePath, content, "utf8");
}
function readOriginalPrompt(agent) {
    return _readPromptFile(agent);
}
function readAllOriginalPrompts() {
    return {
        codex: _readPromptFile("codex"),
        claude: _readPromptFile("claude"),
        openclaw: _readPromptFile("openclaw"),
        gemini: _readPromptFile("gemini"),
    };
}
// ─────────── 备份与恢复 ───────────
function _getBackups() {
    try {
        var doc = utools.db.get(BACKUP_KEY);
        if (!doc)
            return {};
        return doc.backups || {};
    }
    catch (e) {
        return {};
    }
}
function _saveBackups(backups) {
    try {
        var existing = null;
        try {
            existing = utools.db.get(BACKUP_KEY);
        }
        catch (e) { }
        // 深拷贝确保是纯 JSON 对象
        var cleanBackups = JSON.parse(JSON.stringify(backups));
        var doc = { _id: BACKUP_KEY, backups: cleanBackups };
        if (existing && existing._rev)
            doc._rev = existing._rev;
        var result = utools.db.put(doc);
        return result;
    }
    catch (e) {
        throw new Error("Failed to save backups: " + (e.message || e));
    }
}
// 备份当前各 Agent 的提示词
function backupOriginalPrompts() {
    try {
        var backups = _getBackups();
        var now = new Date().toISOString();
        var agents = ["codex", "claude", "openclaw", "gemini"];
        agents.forEach(function (agent) {
            backups[agent] = { content: _readPromptFile(agent), backedUpAt: now };
        });
        _saveBackups(backups);
        return { success: true, backups: backups };
    }
    catch (e) {
        return { success: false, error: e.message || "Backup failed" };
    }
}
// 备份指定 Agent 的提示词
function backupSelectedPrompts(agentList) {
    if (!Array.isArray(agentList) || agentList.length === 0) {
        return { success: false, error: "No agents selected" };
    }
    try {
        var backups = _getBackups();
        var now = new Date().toISOString();
        agentList.forEach(function (agent) {
            backups[agent] = { content: _readPromptFile(agent), backedUpAt: now };
        });
        _saveBackups(backups);
        return { success: true, backups: backups };
    }
    catch (e) {
        return { success: false, error: e.message || "Backup failed" };
    }
}
// 获取备份
function getBackups() {
    return _getBackups();
}
// 恢复指定 Agent 的原始提示词
function restoreOriginalPrompt(agent) {
    var backups = _getBackups();
    var backup = backups[agent];
    if (!backup || !backup.backedUpAt) {
        return { success: false, error: "No backup found for " + agent };
    }
    try {
        _writePromptFile(agent, backup.content || "");
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
}
// 恢复所有 Agent 的原始提示词
function restoreAllOriginalPrompts() {
    var results = {};
    ["codex", "claude", "openclaw", "gemini"].forEach(function (agent) {
        results[agent] = restoreOriginalPrompt(agent);
    });
    return results;
}
// ─────────── 应用提示词到 Agent ───────────
// 应用提示词到指定 Agent，并自动取消其他提示词对该 Agent 的关联
function applyPromptToAgent(promptId, agent) {
    var prompts = _getAll();
    var targetPrompt = null;
    // 找到目标提示词
    for (var i = 0; i < prompts.length; i++) {
        if (prompts[i].id === promptId) {
            targetPrompt = prompts[i];
            break;
        }
    }
    if (!targetPrompt) {
        return { success: false, error: "Prompt not found" };
    }
    // 自动取消其他提示词对该 Agent 的关联
    prompts.forEach(function (p) {
        if (p.id !== promptId && Array.isArray(p.agents)) {
            var idx = p.agents.indexOf(agent);
            if (idx !== -1) {
                p.agents.splice(idx, 1);
            }
        }
    });
    // 确保目标提示词关联了该 Agent
    if (!Array.isArray(targetPrompt.agents)) {
        targetPrompt.agents = [];
    }
    if (targetPrompt.agents.indexOf(agent) === -1) {
        targetPrompt.agents.push(agent);
    }
    // 保存更新后的提示词
    _saveAll(prompts);
    // 将提示词内容写入对应的 md 文件
    try {
        _writePromptFile(agent, targetPrompt.content);
    }
    catch (e) {
        return { success: false, error: "Failed to write prompt file: " + e.message };
    }
    return { success: true, prompt: targetPrompt };
}
// 切换提示词对 Agent 的关联，取消关联时同步清理 Agent 配置文件
function togglePromptAgent(promptId, agent) {
    var prompts = _getAll();
    var targetPrompt = null;
    for (var i = 0; i < prompts.length; i++) {
        if (prompts[i].id === promptId) {
            targetPrompt = prompts[i];
            break;
        }
    }
    if (!targetPrompt) {
        return { success: false, error: "Prompt not found" };
    }
    if (!Array.isArray(targetPrompt.agents)) {
        targetPrompt.agents = [];
    }
    var idx = targetPrompt.agents.indexOf(agent);
    if (idx === -1) {
        // 关联：由前端调用 applyPromptToAgent 处理文件写入
        targetPrompt.agents.push(agent);
    }
    else {
        // 取消关联：清理 Agent 配置文件中的提示词内容
        targetPrompt.agents.splice(idx, 1);
        try {
            var currentContent = _readPromptFile(agent);
            if (currentContent === targetPrompt.content) {
                var backups = _getBackups();
                var backup = backups[agent];
                if (backup && backup.content) {
                    _writePromptFile(agent, backup.content);
                }
                else {
                    _writePromptFile(agent, "");
                }
            }
        }
        catch (e) {
            // 文件清理失败不阻断数据库更新
        }
    }
    _saveAll(prompts);
    return { success: true, prompt: targetPrompt, associated: idx === -1 };
}
// ─────────── 导出 ───────────
module.exports = {
    listPrompts: listPrompts,
    getPrompt: getPrompt,
    savePrompt: savePrompt,
    deletePrompt: deletePrompt,
    duplicatePrompt: duplicatePrompt,
    exportPrompts: exportPrompts,
    importPrompts: importPrompts,
    readOriginalPrompt: readOriginalPrompt,
    readAllOriginalPrompts: readAllOriginalPrompts,
    backupOriginalPrompts: backupOriginalPrompts,
    backupSelectedPrompts: backupSelectedPrompts,
    getBackups: getBackups,
    restoreOriginalPrompt: restoreOriginalPrompt,
    restoreAllOriginalPrompts: restoreAllOriginalPrompts,
    applyPromptToAgent: applyPromptToAgent,
    togglePromptAgent: togglePromptAgent,
};
