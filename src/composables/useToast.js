import { reactive } from "vue";

// 全局 toast 队列（跨组件共享）
const state = reactive({ items: [] });
let _seq = 1;

function _remove(id) {
  const i = state.items.findIndex(t => t.id === id);
  if (i >= 0) state.items.splice(i, 1);
}

/**
 * 显示一条应用内 toast
 * @param {string} message
 * @param {object} [opts]
 * @param {"info"|"success"|"warn"|"error"} [opts.type="info"]
 * @param {number} [opts.duration=2400]  毫秒
 */
export function toast(message, opts = {}) {
  const id = _seq++;
  const item = {
    id,
    message: String(message ?? ""),
    type: opts.type || "info",
    duration: typeof opts.duration === "number" ? opts.duration : 2400,
  };
  state.items.push(item);
  if (item.duration > 0) setTimeout(() => _remove(id), item.duration);
  return id;
}

toast.success = (m, o) => toast(m, { ...(o || {}), type: "success" });
toast.warn    = (m, o) => toast(m, { ...(o || {}), type: "warn" });
toast.error   = (m, o) => toast(m, { ...(o || {}), type: "error" });
toast.info    = (m, o) => toast(m, { ...(o || {}), type: "info" });
toast.dismiss = _remove;

export function useToast() {
  return { toast, state };
}
