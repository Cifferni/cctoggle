# MCP 卡片关联应用快捷编辑需求

> 版本：v2  
> 日期：2026-07-30  
> 状态：待评估

---

## 一、功能概述

将 MCP Server 的"关联应用"编辑能力从添加/编辑抽屉表单（McpForm）下沉到列表卡片（McpCard），与 Skill 管理保持一致的交互模式：**每个应用一个可点击 chip，直接在卡片行内切换，改完即存**。

---

## 二、参考：Skill 管理的现有模式

`SkillListSection.vue` 中每个 skill 行末尾有 agent chip 组：

```vue
<button
  v-for="app in displayTargets" :key="app"
  class="agent-chip"
  :class="{ 'agent-chip--on': isDeployed(s.name, app) }"
  @click="toggleTarget(s.name, app)"
>
  {{ APP_LABELS[app] }}
</button>
```

交互特点：
- **行内 chip 按钮**，无弹窗、无 popover
- 点击即 toggle，**即时生效**
- 选中态通过 `--on` class 高亮边框和文字
- 未选中态为灰色边框，hover 时变色

---

## 三、目标卡片结构

### 改动前（现状）

```
┌─────────────────────────────────────────────────┐
│ 🟢 Filesystem Server  [stdio] [已启用]          │
│    npx @modelcontextprotocol/server-...         │
│    [Claude icon] Claude  [Codex icon] Codex     │  ← 只读 tag
│                             [开关] [编辑] [删除] │
└─────────────────────────────────────────────────┘
```

### 改动后

```
┌─────────────────────────────────────────────────┐
│ 🟢 Filesystem Server  [stdio] [已启用]          │
│    npx @modelcontextprotocol/server-...         │
│    [Claude] [Desktop] [Codex] [OpenClaw]        │  ← 可点击 chip
│                             [开关] [编辑] [删除] │
└─────────────────────────────────────────────────┘
```

- 未关联的应用：灰色边框 chip（`agent-chip`）
- 已关联的应用：高亮边框 chip（`agent-chip--on`）
- 点击直接 toggle，即时保存

---

## 四、交互规范

### Chip 状态

| 状态 | 样式 | 说明 |
|------|------|------|
| 未选中 | 灰色边框，灰色文字 | `border: 1px solid var(--border); color: var(--text-muted)` |
| 未选中 hover | 主题色边框 | `border-color: var(--primary); color: var(--primary)` |
| 已选中 | 主题色边框 + 浅色背景 | `border-color: var(--primary); background: var(--primary-light); color: var(--primary)` |
| 切换中 | 半透明 | `opacity: .5`（防止重复点击） |

### 保存逻辑
- 点击 chip → 计算新的 apps 数组 → emit `update-apps` 事件
- McpPage 接收事件 → 调用 `saveServer` → 即时生效
- 无需确认弹窗，与 skill 管理一致

---

## 五、改动范围

### McpCard.vue
1. **移除**现有的只读 `appTags` 展示（`mcp-apps` 区域，第 59-66 行）
2. **新增**可点击 chip 组，参照 `SkillListSection.vue` 的 `agent-chip` 模式
3. **新增** `update-apps` 事件 emit：`emit('update-apps', server.id, newApps)`
4. **新增** `APP_OPTIONS` 常量（从 shared.js 导入或本地定义）
5. **新增** toggle 逻辑：点击 chip 时切换 apps 数组中对应 app 的存在与否

### McpForm.vue
1. **移除**"高级设置"中的"关联应用"checkbox 区域（第 419-433 行）
2. **保留** `form.apps` 字段和 `buildSaveData` 中的 apps 输出（新建时仍有默认值 `["claude"]`）

### McpPage.vue
1. **新增**处理 McpCard 的 `update-apps` 事件
2. 调用 `saveServer` 保存更新后的数据

### shared.js
- 无需改动，已有 `APP_LABELS` 和 `APP_ICONS`

---

## 六、数据流

```
用户点击 chip
  → McpCard 计算新 apps 数组（toggle 对应 app）
  → emit('update-apps', server.id, newApps)
    → McpPage 构建完整 server 对象，调用 saveServer
      → useMcp 保存到存储 + 同步到配置文件
        → 列表刷新，chip 状态更新
```

---

## 七、代码参考

### McpCard 新增 chip 组（参考 SkillListSection）

```vue
<div class="mcp-apps">
  <button
    v-for="opt in APP_OPTIONS" :key="opt.value"
    class="agent-chip"
    :class="{ 'agent-chip--on': (server.apps || []).indexOf(opt.value) !== -1 }"
    @click="toggleApp(opt.value)"
  >
    <img v-if="APP_ICONS[opt.value]" :src="APP_ICONS[opt.value]" class="chip-icon" />
    {{ opt.label }}
  </button>
</div>
```

### McpCard toggleApp 逻辑

```javascript
function toggleApp(app) {
  var apps = (props.server.apps || []).slice();
  var idx = apps.indexOf(app);
  if (idx === -1) apps.push(app);
  else apps.splice(idx, 1);
  emit('update-apps', props.server.id, apps);
}
```

### McpPage 事件处理

```vue
<McpCard
  v-for="s in filteredServers" :key="s.id"
  :server="s"
  @edit="onEdit" @delete="onDelete" @toggle="toggleServer"
  @update-apps="onUpdateApps"
/>
```

```javascript
function onUpdateApps(id, apps) {
  var server = getServer(id);
  if (server) saveServer({ ...server, apps });
}
```

---

## 八、注意事项

1. **表单中 apps 字段保留**：新建 MCP Server 时仍需在表单中设置初始关联应用（`form.apps` 默认 `["claude"]`），仅移除 UI 编辑区域
2. **空 apps 允许**：用户可以取消所有应用，保留空数组 `[]`
3. **样式复用**：chip 样式参照 `SkillListSection.vue` 的 `.agent-chip` 系列，保持视觉一致
4. **APP_OPTIONS 统一**：`McpCard` 和 `McpForm` 共用同一份应用选项列表，建议提取到 `shared.js`（目前 `McpForm` 硬编码了 `APP_OPTIONS`）

---

## 九、验收标准

- [ ] 卡片上的应用 chip 可点击，点击即时 toggle
- [ ] 已关联应用高亮显示（主题色边框 + 浅色背景）
- [ ] 未关联应用灰色显示，hover 变主题色
- [ ] 修改后即时保存，刷新后状态保持
- [ ] 编辑抽屉中不再显示关联应用编辑区域
- [ ] 新建 MCP Server 时表单仍可设置初始关联应用
- [ ] 深色/浅色主题下样式正常
- [ ] 与 Skill 管理页的 chip 视觉风格一致
