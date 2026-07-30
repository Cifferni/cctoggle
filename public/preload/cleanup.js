// uTools ccToggle - cleanup.js
// 统一数据清理 / 迁移逻辑

// ─────────── MCP mapping 清理 ───────────
// 移除 mapping 中存在但所有配置文件中都找不到定义、且未被禁用的残留条目

function cleanMcpMapping(mapping, configs, allApps) {
  var changed = false;
  allApps.forEach(function (app) {
    var configServers = configs[app] || {};
    var before = (mapping[app] || []).length;
    mapping[app] = (mapping[app] || []).filter(function (name) {
      // 配置文件中有定义 → 保留
      if (configServers[name]) return true;
      // 禁用列表中 → 保留
      if ((mapping.disabled || []).indexOf(name) !== -1) return true;
      // 其他 app 的配置文件中有定义 → 保留
      for (var i = 0; i < allApps.length; i++) {
        if (allApps[i] !== app && (configs[allApps[i]] || {})[name]) return true;
      }
      // 残留条目，移除
      changed = true;
      return false;
    });
  });
  return changed;
}

module.exports = {
  cleanMcpMapping: cleanMcpMapping,
};
