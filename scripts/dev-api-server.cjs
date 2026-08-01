// 开发 API 服务器 - 让浏览器前端访问真实文件系统数据
// 用法: node scripts/dev-api-server.cjs
//
// 原理：注入 mock utools 对象，直接复用编译好的 preload 模块

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3456;
const DB_FILE = path.join(__dirname, '..', '.dev-db.json');
const PRELOAD_DIR = path.join(__dirname, '..', 'public', 'preload');

// ─────────── 简单数据库 (JSON文件，模拟 utools.db) ───────────

let db = {};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) { db = {}; }
}

function saveDb() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); } catch (e) {}
}

// ─────────── Mock utools 对象 ───────────

global.utools = {
  getPath: (name) => {
    if (name === 'home') return os.homedir();
    if (name === 'appData') return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return '';
  },
  db: {
    allDocs: (prefix) => Object.keys(db).filter(k => k.startsWith(prefix)).map(k => ({ _id: k, ...db[k] })),
    get: (key) => db[key] || null,
    put: (doc) => { db[doc._id] = doc; saveDb(); },
    remove: (key) => { delete db[key]; saveDb(); },
  },
  dbStorage: {
    getItem: (key) => db[key] || null,
    setItem: (key, value) => { db[key] = value; saveDb(); },
    removeItem: (key) => { delete db[key]; saveDb(); },
  },
  dbCryptoStorage: {
    getItem: (key) => db['_crypto_' + key] || null,
    setItem: (key, value) => { db['_crypto_' + key] = value; saveDb(); },
    removeItem: (key) => { delete db['_crypto_' + key]; saveDb(); },
  },
};

// ─────────── 加载 preload 模块 ───────────

loadDb();

// 需要先加载 utils（其他模块依赖它）
const utils = require(path.join(PRELOAD_DIR, 'utils'));
const configRw = require(path.join(PRELOAD_DIR, 'config-rw'));
const providerDb = require(path.join(PRELOAD_DIR, 'provider-db'));
const sessions = require(path.join(PRELOAD_DIR, 'sessions'));
const stats = require(path.join(PRELOAD_DIR, 'stats'));

// 启动时标记当前供应商
try {
  ['codex', 'claude', 'claude-desktop', 'gemini'].forEach(appType => {
    providerDb.markCurrent(appType, providerDb.getCurrentProviderId(appType));
  });
} catch (e) {}

// ─────────── HTTP 请求处理 ───────────

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({}); } });
  });
}

function sendJson(res, data) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendError(res, error) { sendJson(res, { error }); }

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    // ─── 路径 ───
    if (pathname === '/api/paths') {
      return sendJson(res, {
        home: utils.getHomeDir(),
        codexAuth: utils.getCodexAuthPath(),
        codexConfig: utils.getCodexConfigPath(),
        claudeSettings: utils.getClaudeSettingsPath(),
        claudeDesktopConfig: utils.getClaudeDesktopConfigPath(),
        openclawConfig: utils.getOpenClawConfigPath(),
        geminiEnv: utils.getGeminiEnvPath(),
      });
    }

    // ─── 配置读取 ───
    if (pathname === '/api/configs') return sendJson(res, configRw.getCurrentConfigs());
    if (pathname === '/api/config/codex') return sendJson(res, configRw.readCodexConfig());
    if (pathname === '/api/config/claude') return sendJson(res, configRw.readClaudeSettings());
    if (pathname === '/api/config/gemini') return sendJson(res, configRw.readGeminiEnv());
    if (pathname === '/api/config/openclaw') return sendJson(res, configRw.readOpenClawConfig());
    if (pathname === '/api/config/claude-desktop') return sendJson(res, configRw.readClaudeDesktopConfig());

    // ─── 供应商 ───
    if (pathname === '/api/providers' && req.method === 'GET') {
      const appType = url.searchParams.get('appType');
      if (!appType) return sendError(res, 'appType required');
      return sendJson(res, providerDb.listProviders(appType));
    }

    if (pathname === '/api/provider' && req.method === 'GET') {
      const appType = url.searchParams.get('appType');
      const id = url.searchParams.get('id');
      if (!appType || !id) return sendError(res, 'appType and id required');
      return sendJson(res, providerDb.getProvider(appType, id));
    }

    if (pathname === '/api/provider' && req.method === 'POST') {
      const body = await parseBody(req);
      const id = providerDb.saveProvider(body.appType, body.data);
      return sendJson(res, { success: true, id });
    }

    if (pathname === '/api/provider-delete' && req.method === 'POST') {
      const body = await parseBody(req);
      providerDb.deleteProvider(body.appType, body.id);
      return sendJson(res, { success: true });
    }

    if (pathname === '/api/provider/current') {
      const appType = url.searchParams.get('appType');
      if (!appType) return sendError(res, 'appType required');
      return sendJson(res, { id: providerDb.getCurrentProviderId(appType) });
    }

    // ─── 会话管理 ───
    if (pathname === '/api/sessions') {
      const app = url.searchParams.get('app') || 'claude';
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || '';
      const sort = url.searchParams.get('sort') || 'time-desc';
      const result = await sessions.scanSessions(app, { offset, limit, search, sort });
      return sendJson(res, result);
    }

    if (pathname === '/api/session/detail') {
      const filePath = url.searchParams.get('filePath');
      if (!filePath) return sendError(res, 'filePath required');
      const detail = await sessions.loadSessionDetail(filePath);
      return sendJson(res, detail);
    }

    if (pathname === '/api/session-delete' && req.method === 'POST') {
      const body = await parseBody(req);
      return sendJson(res, sessions.deleteSession(body.filePath));
    }

    // ─── 统计 ───
    if (pathname === '/api/stats') {
      const result = await stats.scanUsageLogs();
      return sendJson(res, result);
    }

    if (pathname === '/api/stats/clear' && req.method === 'POST') {
      const body = await parseBody(req);
      return sendJson(res, stats.clearStats(body.appType));
    }

    sendError(res, 'Not found: ' + pathname);
  } catch (e) {
    sendError(res, e.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n  🚀 Dev API Server running at http://localhost:${PORT}\n`);
  console.log('  Using compiled preload modules from public/preload/\n');
});
