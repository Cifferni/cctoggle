// uTools ccToggle - stats.ts
// 用量统计（无缓存：每次直接扫描本地 CLI 会话日志）

import * as utils from '../utils';

const fs = utils.fs;
const path = utils.path;
const getHomeDir = utils.getHomeDir;

const CLEARED_KEY = "cctoggle_stat_clearedAt";
const ALL_APP_TYPES = ["codex", "claude", "claude-desktop", "openclaw", "gemini"];

function _statDayKey(d: Date): string {
  var y = d.getFullYear();
  var m = ("0" + (d.getMonth() + 1)).slice(-2);
  var day = ("0" + d.getDate()).slice(-2);
  return y + "-" + m + "-" + day;
}

function _emptyBucket(): { requests: number; input: number; output: number; cacheRead: number; cacheCreate: number; total: number } {
  return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 };
}

function _dayFromTs(ts: string): string {
  if (!ts) return "";
  try { return _statDayKey(new Date(ts)); } catch (e) { return ""; }
}

interface DailyRecord {
  appType: string;
  day: string;
  requests: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheCreate: number;
  total: number;
  models: Record<string, { requests: number; input: number; output: number; cacheRead: number; cacheCreate: number; total: number }>;
}

export class StatsCollector {
  static _getClearedAt(): Record<string, number> {
    const doc = utools.db.get(CLEARED_KEY) || {};
    const result: Record<string, number> = {};
    for (let i = 0; i < ALL_APP_TYPES.length; i++) {
      const t = ALL_APP_TYPES[i];
      result[t] = Number(doc[t]) || 0;
    }
    return result;
  }

  static async _listJsonl(dir: string, out?: string[]): Promise<string[]> {
    out = out || [];
    let entries;
    try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return out; }
    for (let i = 0; i < entries.length; i++) {
      const ent = entries[i];
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await StatsCollector._listJsonl(fullPath, out);
      } else if (ent.isFile() && /\.jsonl$/i.test(ent.name)) {
        out.push(fullPath);
      }
    }
    return out;
  }

  static async _parseLogFile(file: string, appType: string, clearedMs: number, acc: Record<string, DailyRecord>): Promise<void> {
    let text: string;
    try { text = await fs.promises.readFile(file, "utf8"); } catch (e) { return; }
    const lines = text.split(/\r?\n/);
    let codexModel = "";

    function bucketFor(day: string, model: string) {
      const dayKey = appType + "_" + day;
      const d = acc[dayKey] || (acc[dayKey] = { appType: appType, day: day,
        requests: 0, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0, models: {} });
      const m = model || "unknown";
      return d.models[m] || (d.models[m] = _emptyBucket());
    }
    function addUsage(day: string, model: string, input: number, output: number, cacheRead: number, cacheCreate: number) {
      const b = bucketFor(day, model);
      const d = acc[appType + "_" + day];
      b.requests += 1; b.input += input; b.output += output;
      b.cacheRead += cacheRead; b.cacheCreate += cacheCreate; b.total += input + output + cacheRead + cacheCreate;
      d.requests += 1; d.input += input; d.output += output;
      d.cacheRead += cacheRead; d.cacheCreate += cacheCreate; d.total += input + output + cacheRead + cacheCreate;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      let d;
      try { d = JSON.parse(line); } catch (e) { continue; }
      if (!d || typeof d !== "object") continue;

      if (appType === "claude") {
        if (d.type !== "assistant" || !d.message) continue;
        const mu = d.message.usage;
        if (!mu) continue;
        if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs) continue;
        const day = _dayFromTs(d.timestamp);
        if (!day) continue;
        const cIn = Number(mu.input_tokens) || 0;
        const cOut = Number(mu.output_tokens) || 0;
        const cRead = Number(mu.cache_read_input_tokens) || 0;
        const cCreate = Number(mu.cache_creation_input_tokens) || 0;
        if (!cIn && !cOut && !cRead && !cCreate) continue;
        addUsage(day, d.message.model || "unknown", cIn, cOut, cRead, cCreate);
      } else {
        if (d.type === "turn_context" && d.payload && d.payload.model) {
          codexModel = d.payload.model;
          continue;
        }
        if (d.type !== "event_msg" || !d.payload || d.payload.type !== "token_count") continue;
        const info = d.payload.info;
        const last = info && info.last_token_usage;
        if (!last) continue;
        if (clearedMs && d.timestamp && new Date(d.timestamp).getTime() <= clearedMs) continue;
        const day2 = _dayFromTs(d.timestamp);
        if (!day2) continue;
        const totalIn = Number(last.input_tokens) || 0;
        const cachedIn = Number(last.cached_input_tokens) || 0;
        const freshIn = Math.max(0, totalIn - cachedIn);
        const out = Number(last.output_tokens) || 0;
        const cacheCreate = Number(last.cache_write_input_tokens) || 0;
        if (!totalIn && !out && !cacheCreate) continue;
        addUsage(day2, codexModel || "unknown", freshIn, out, cachedIn, cacheCreate);
      }
    }
  }

  static async scanUsageLogs(): Promise<{ daily: DailyRecord[]; error?: string }> {
    try {
      const home = getHomeDir();
      const cleared = StatsCollector._getClearedAt();

      const roots = [
        { dir: utils.getAgentSessionPath("claude") || path.join(home, ".claude", "projects"), appType: "claude" },
        { dir: utils.getAgentSessionPath("codex") || path.join(home, ".codex", "sessions"), appType: "codex" },
      ];
      const acc: Record<string, DailyRecord> = {};
      for (let r = 0; r < roots.length; r++) {
        const root = roots[r];
        const clearedMs = cleared[root.appType] || 0;
        const list = await StatsCollector._listJsonl(root.dir);
        for (let i = 0; i < list.length; i++) {
          await StatsCollector._parseLogFile(list[i], root.appType, clearedMs, acc);
        }
      }
      const daily = Object.keys(acc).map(function (k) { return acc[k]; });
      return { daily: daily };
    } catch (e) {
      return { daily: [], error: String(e && e.message ? e.message : e) };
    }
  }

  static clearStats(appType?: string): { success: boolean; error?: string } {
    const doc = utools.db.get(CLEARED_KEY) || { _id: CLEARED_KEY };
    const now = Date.now();
    if (!appType || appType === "all") { for (let i = 0; i < ALL_APP_TYPES.length; i++) doc[ALL_APP_TYPES[i]] = now; }
    else doc[appType] = now;
    try { utools.db.put(doc); return { success: true }; }
    catch (e) { return { success: false, error: String(e && e.message ? e.message : e) }; }
  }
}
