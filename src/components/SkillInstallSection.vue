<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useMessage } from "naive-ui";
import { openUrl } from "../utils/openUrl.js";

const message = useMessage();

const searchQuery = ref("");
const installing = ref(null);
const installedNames = ref(new Set());
const results = ref([]);
const loading = ref(false);

let reqId = 0;
let debounceTimer = null;
let cancelled = false;

async function runSearch(q) {
  const myId = ++reqId;
  const fn = window.utoolsCctoggle?.searchSkills || (() => Promise.resolve([]));
  loading.value = true;
  try {
    const data = await fn(q || "");
    if (cancelled || myId !== reqId) return;
    results.value = Array.isArray(data) ? data : [];
  } catch (e) {
    if (cancelled || myId !== reqId) return;
    results.value = [];
  } finally {
    if (!cancelled && myId === reqId) loading.value = false;
  }
}

watch(searchQuery, function(q) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runSearch(q), 250);
}, { immediate: true });

onBeforeUnmount(function() {
  cancelled = true;
  reqId++;
  if (debounceTimer) clearTimeout(debounceTimer);
  loading.value = false;
});

// 加载已安装的 skill 列表，填充 installedNames
onMounted(function() {
  if (window.utoolsCctoggle?.listNestSkills) {
    var list = window.utoolsCctoggle.listNestSkills();
    if (Array.isArray(list)) {
      installedNames.value = new Set(list.map(function(s) { return skillKey(s); }));
    }
  }
});

function formatCount(n) {
  n = n || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n >= 1 ? n.toLocaleString() : "";
}

function skillKey(s) {
  return (s.name || "") + "||" + (s.repo || "");
}

function install(skill) {
  installing.value = skillKey(skill);
  const fn = window.utoolsCctoggle?.installSkill || (() => ({ success: false }));
  const result = fn(skill.name, skill.repo || "", skill.path || "", "");
  setTimeout(function() {
    if (result.success) {
      installedNames.value = new Set([...installedNames.value, skillKey(skill)]);
      if (window.utoolsCctoggle?.listNestSkills) {
        window.utoolsCctoggle.listNestSkills();
      }
    }
    else if (result.error) { message.error(result.error); }
    installing.value = null;
  }, 300);
}
</script>

<template>
  <div class="install-section">
    <div class="search-wrap">
      <input v-model="searchQuery" placeholder="搜索 skill.sh 中的 skill..." class="search-input">
      <div v-if="loading" class="search-spinner"></div>
    </div>

    <div class="results">
      <div v-if="loading && !results.length" class="results-loading">
        <div class="spinner"></div>
        <span>搜索中...</span>
      </div>
      <div v-else-if="searchQuery && results.length === 0" class="results-empty">无匹配结果</div>

      <div v-if="results.length" class="results-grid">
      <div v-for="s in results" :key="skillKey(s)" class="result-card">
        <div class="card-top">
          <span class="result-name">{{ s.name }}</span>
          <span class="result-installs">&#8595; {{ formatCount(s.installs || 0) }}</span>
        </div>
        <a v-if="s.repo" href="#" class="result-repo" @click.prevent.stop="openUrl(s.repo)">{{ s.repo }}</a>
        <button
          v-if="installedNames.has(skillKey(s))"
          class="btn-install btn-install--done"
          disabled
        >&#10003; 已安装</button>
        <button
          v-else-if="installing === skillKey(s)"
          class="btn-install btn-install--loading"
          disabled
        >安装中...</button>
        <button
          v-else
          class="btn-install"
          @click="install(s)"
        >安装</button>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.install-section { display: flex; flex-direction: column; height: 100%; }

.search-wrap { margin-bottom: 14px; flex-shrink: 0; position: relative; }
.search-input {
  width: 100%; padding: 10px 16px;
  border: 1px solid var(--border); border-radius: var(--radius);
  font-size: 14px; background: var(--bg-card); color: var(--text);
  outline: none; transition: border-color .15s;
  padding-right: 36px;
}
.search-input:focus { border-color: var(--primary); }
.search-input::placeholder { color: var(--text-muted); }

.search-spinner {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .6s linear infinite;
  pointer-events: none;
}
@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

.results { flex: 1; overflow-y: auto; }
.results-empty { text-align: center; padding: 40px 0; font-size: 14px; color: var(--text-muted); }

.results-loading {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 0; color: var(--text-muted); font-size: 14px;
}
.results-loading .spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .6s linear infinite;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.result-card {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  transition: border-color .15s;
}
.result-card:hover { border-color: var(--primary); }

.card-top {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 6px;
}
.result-name {
  font-size: 13px; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.result-installs {
  font-size: 10px; color: var(--text-muted);
  background: var(--bg-hover); padding: 2px 7px;
  border-radius: 8px; white-space: nowrap; flex-shrink: 0;
}
.result-repo {
  display: block; font-size: 10px; color: var(--text-muted);
  font-family: monospace; text-decoration: none;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-bottom: 8px;
}
.result-repo:hover { color: var(--primary); text-decoration: underline; }
.btn-install {
  padding: 6px 16px; border: 1px solid var(--primary);
  border-radius: var(--radius); font-size: 12px; font-weight: 500;
  cursor: pointer; background: var(--primary); color: #fff;
  transition: all .15s; white-space: nowrap;
}
.btn-install:hover { background: var(--primary-hover); }
.btn-install--done {
  background: var(--bg-hover); color: var(--text-secondary);
  border-color: var(--border); cursor: default;
}
.btn-install--loading {
  opacity: .6; cursor: default;
}
</style>
