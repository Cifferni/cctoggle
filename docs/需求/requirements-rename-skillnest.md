# 需求：`.skillnest` 目录重命名为 `.cctoggle`

## 一、背景

项目名称已从 SkillNest 更名为 CCToggle，需要将用户数据目录从 `~/.skillnest` 统一改为 `~/.cctoggle`，保持品牌一致性。

---

## 二、数据迁移策略

### 2.1 迁移时机

- **插件启动时**自动检测并迁移
- 在 `getNestDir()` 函数中添加迁移逻辑

### 2.2 迁移逻辑

```
1. 检查用户是否自定义过路径（ccswitch_nest_dir）
   - 是 → 使用自定义路径，不迁移
   - 否 → 继续下一步

2. 检查新目录 ~/.cctoggle/skills 是否存在
   - 已存在 → 直接使用新目录
   - 不存在 → 继续下一步

3. 检查旧目录 ~/.skillnest/skills 是否存在
   - 存在且有数据 → 重命名为 ~/.cctoggle/skills
   - 不存在或为空 → 直接创建新目录

4. 迁移完成 → 记录迁移标记（避免重复迁移）
```

### 2.3 边界情况处理

| 情况 | 处理方式 |
|------|----------|
| 新旧目录都存在 | 使用新目录，保留旧目录（用户可手动清理） |
| 旧目录被占用/无法重命名 | 复制文件到新目录，保留旧目录 |
| 用户自定义过路径 | 不迁移，使用自定义路径 |

### 2.4 软链接/Junction 修复（关键！）

**问题**：已部署的 skill 使用 symlink/junction 指向旧目录 `~/.skillnest/skills/xxx`，重命名后链接会断开。

**迁移流程（需要在目录重命名后执行）：**

```
1. 读取部署注册表（ccswitch_nest_registry）
2. 遍历所有已部署的 skill：
   ├─ 读取部署目标列表（target + mode）
   ├─ 对每个 symlink 部署：
   │   ├─ 检查目标路径是否存在且是 symlink/junction
   │   ├─ 如果链接指向旧路径 ~/.skillnest/...：
   │   │   ├─ 删除旧链接
   │   │   └─ 重新创建链接指向新路径 ~/.cctoggle/...
   │   └─ 如果链接已指向新路径：跳过
   └─ 对每个 copy 部署：
       └─ 不需要处理（文件是独立副本）
3. 更新迁移标记
```

**需要扫描的部署目标目录：**
```javascript
// 默认 agent skill 目录
~/.codex/skills/
~/.claude/skills/
~/.gemini/skills/
~/.openclaw/skills/

// 项目目标目录（从 ccswitch_project_targets 读取）
```

**链接修复函数逻辑：**
```javascript
function fixDeployedSymlinks(oldNest, newNest) {
  var reg = getDeployRegistry();
  var fixed = 0;
  var failed = 0;

  Object.keys(reg).forEach(function(skillName) {
    var deployments = reg[skillName] || [];
    deployments.forEach(function(dep) {
      if (dep.mode !== 'symlink') return; // 只处理软链接

      var targetDir = resolveDeployTarget(dep.target);
      if (!targetDir) return;

      var linkPath = path.join(targetDir, skillName);
      try {
        // 检查链接是否存在
        if (!fs.existsSync(linkPath)) return;

        var stat = fs.lstatSync(linkPath);
        if (!stat.isSymbolicLink()) return;

        // 读取链接指向
        var currentTarget = fs.readlinkSync(linkPath);
        var expectedOld = path.join(oldNest, skillName);

        // 如果指向旧路径，重新创建链接
        if (currentTarget === expectedOld || 
            currentTarget === expectedOld.replace(/\//g, '\\')) {
          fs.unlinkSync(linkPath);
          var newSrc = path.join(newNest, skillName);
          createLink(newSrc, linkPath);
          fixed++;
        }
      } catch (e) {
        console.error('[CCToggle] Failed to fix symlink:', linkPath, e.message);
        failed++;
      }
    });
  });

  return { fixed: fixed, failed: failed };
}
```

**注意事项：**
- 跨盘 junction 部署使用的是复制模式，不需要修复
- 项目目标目录可能不存在（用户删除了），需要跳过
- 修复失败不应阻断启动，记录日志即可

---

## 三、代码改动清单

### 3.1 核心改动（必须）

| 文件 | 行号 | 改动内容 |
|------|------|----------|
| `src/preload/skills.ts` | 28 | `.skillnest` → `.cctoggle` |
| `src/preload/skills.ts` | 17-31 | `getNestDir()` 添加迁移逻辑 |
| `src/views/settings/StorageSettings.vue` | 20 | 显示文本 `.skillnest` → `.cctoggle` |

### 3.2 UI 文本改动（建议）

| 文件 | 行号 | 改动内容 |
|------|------|----------|
| `src/views/settings/StorageSettings.vue` | 42 | `SkillNest` → `CCToggle` |

### 3.3 注释更新（可选）

| 文件 | 改动内容 |
|------|----------|
| `src/preload/skills.ts` | 更新注释中的 `SkillNest` |
| `src/preload/services.ts` | 更新注释 |
| `src/types/utools-cctoggle.d.ts` | 更新注释 |
| `src/utils/browser-adapter.ts` | 更新注释 |

---

## 四、迁移代码实现

### 4.1 修改 `src/preload/skills.ts` 的 `getNestDir()` 函数

**当前代码（第17-31行）：**

```typescript
function getNestDir() {
  // 优先从配置读取
  var configured = utools.dbStorage.getItem('ccswitch_nest_dir');
  if (configured) {
    var expanded = expandHome(configured);
    ensureDir(expanded);
    return expanded;
  }

  // 使用默认路径（SkillNest 是独立的中央存储，不从 agent 路径派生）
  var home = getHomeDir();
  var nest = path.join(home, ".skillnest", "skills");
  ensureDir(nest);
  return nest;
}
```

**改为：**

```typescript
function getNestDir() {
  // 优先从配置读取（用户自定义路径）
  var configured = utools.dbStorage.getItem('ccswitch_nest_dir');
  if (configured) {
    var expanded = expandHome(configured);
    ensureDir(expanded);
    return expanded;
  }

  var home = getHomeDir();
  var newNest = path.join(home, ".cctoggle", "skills");
  var oldNest = path.join(home, ".skillnest", "skills");

  // 检查是否已迁移
  var migrated = utools.dbStorage.getItem('ccswitch_nest_migrated');

  if (!migrated) {
    // 尝试迁移旧数据
    if (fs.existsSync(oldNest)) {
      try {
        // 如果新目录不存在，直接重命名
        if (!fs.existsSync(newNest)) {
          fs.renameSync(oldNest, newNest);
          console.log('[CCToggle] Migrated ~/.skillnest/skills → ~/.cctoggle/skills');
        } else {
          // 新目录已存在，保留旧目录（用户可手动清理）
          console.log('[CCToggle] Both old and new nest directories exist, using new directory');
        }
      } catch (e) {
        console.error('[CCToggle] Migration failed:', e.message);
        // 迁移失败，继续使用新目录路径
      }
    }
    // 标记迁移完成
    utools.dbStorage.setItem('ccswitch_nest_migrated', true);
  }

  ensureDir(newNest);
  return newNest;
}
```

### 4.2 修改 `src/views/settings/StorageSettings.vue`

**第20行：**

```typescript
// 改前
return fn ? fn() : "~/.skillnest/skills";

// 改后
return fn ? fn() : "~/.cctoggle/skills";
```

**第42行：**

```html
<!-- 改前 -->
<n-text strong style="font-size: 13px; display: block;">SkillNest</n-text>

<!-- 改后 -->
<n-text strong style="font-size: 13px; display: block;">CCToggle</n-text>
```



## 六、测试要点

### 6.1 功能测试

| 测试场景 | 预期结果 |
|----------|----------|
| 全新安装 | 直接创建 `~/.cctoggle/skills` |
| 老用户升级（有旧数据） | 自动迁移 `~/.skillnest/skills` → `~/.cctoggle/skills` |
| 老用户升级（无旧数据） | 创建 `~/.cctoggle/skills` |
| 自定义路径用户 | 不受影响，继续使用自定义路径 |
| 新旧目录共存 | 使用新目录，不删除旧目录 |
| **已部署 skill 的软链接** | **自动修复链接指向新目录** |
| **已部署 skill 的复制** | **不受影响（独立副本）** |
| **跨盘 junction 部署** | **使用复制模式，不需要修复** |

### 6.2 异常测试

| 测试场景 | 预期结果 |
|----------|----------|
| 迁移失败（权限不足） | 降级使用新目录，不影响功能 |
| 旧目录被占用 | 保留旧目录，使用新目录 |
| 插件多次启动 | 只迁移一次，不重复执行 |
| **软链接修复失败** | **记录日志，不阻断启动** |
| **部署目标目录不存在** | **跳过该目标，继续处理其他** |

### 6.3 UI 测试

| 测试场景 | 预期结果 |
|----------|----------|
| 存储设置页面显示 | 显示 `~/.cctoggle/skills` |
| 标题文本 | 显示 `CCToggle` |
| **已部署 skill 状态** | **显示正常，可继续使用** |

---

## 七、兼容性说明

- **向后兼容**：老用户数据自动迁移，无需手动操作
- **向前兼容**：新用户直接使用新目录
- **自定义路径**：不受影响，继续使用用户配置的路径
- **数据库标记**：使用 `ccswitch_nest_migrated` 标记迁移状态，避免重复迁移

---

## 八、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 迁移失败 | 用户数据丢失 | 使用 `fs.renameSync` 原子操作，失败时保留旧目录 |
| 新旧目录冲突 | 数据不一致 | 优先使用新目录，保留旧目录供用户手动处理 |
| 权限不足 | 无法创建目录 | 捕获异常，降级处理 |
| **软链接断开** | **已部署 skill 无法使用** | **迁移后自动扫描并修复所有 symlink** |
| **部署目标目录被删除** | **软链接指向不存在的目录** | **跳过不存在的目标，记录日志** |

---

## 九、相关文件

- `src/preload/skills.ts` - 核心迁移逻辑 + 软链接修复
- `src/views/settings/StorageSettings.vue` - UI 显示
- `src/composables/shared.ts` - API 函数（可选重命名）
- `src/composables/useSkills.ts` - Skills 相关 composable

---

## 十、完整迁移流程图

```
插件启动
    │
    ▼
getNestDir() 被调用
    │
    ├─ 用户自定义路径？ ──是──▶ 返回自定义路径（不迁移）
    │
    ▼ 否
    │
    已迁移？(ccswitch_nest_migrated)
    │
    ├─ 是 ──▶ 返回 ~/.cctoggle/skills
    │
    ▼ 否
    │
    ~/.skillnest/skills 存在？
    │
    ├─ 否 ──▶ 标记已迁移，返回 ~/.cctoggle/skills
    │
    ▼ 是
    │
    ~/.cctoggle/skills 已存在？
    │
    ├─ 是 ──▶ 保留两个目录，标记已迁移，返回 ~/.cctoggle/skills
    │
    ▼ 否
    │
    fs.renameSync(旧 → 新)
    │
    ├─ 成功 ──▶ 修复已部署的软链接
    │           │
    │           ├─ 读取 ccswitch_nest_registry
    │           ├─ 遍历所有 symlink 部署
    │           ├─ 检查链接指向旧路径？
    │           │   ├─ 是 → 删除旧链接，创建新链接
    │           │   └─ 否 → 跳过
    │           └─ 记录修复结果
    │
    ├─ 失败 ──▶ 记录错误日志
    │
    ▼
    标记已迁移
    │
    ▼
    返回 ~/.cctoggle/skills
```
