import { reactive } from "vue";

// 全局确认弹窗状态（应用内，替代 window.confirm）
const state = reactive({ item: null });

/**
 * 显示应用内确认弹窗，返回 Promise<boolean>
 * @param {string} message 正文
 * @param {object} [opts]
 * @param {string} [opts.title="确认"]
 * @param {string} [opts.confirmText="确定"]
 * @param {string} [opts.cancelText="取消"]
 * @param {boolean} [opts.danger=false] 确定按钮是否用危险色
 */
export function confirm(message, opts = {}) {
  return new Promise((resolve) => {
    state.item = {
      message: String(message ?? ""),
      title: opts.title || "确认",
      confirmText: opts.confirmText || "确定",
      cancelText: opts.cancelText || "取消",
      danger: !!opts.danger,
      _resolve: resolve,
    };
  });
}

function _settle(result) {
  const it = state.item;
  state.item = null;
  if (it && it._resolve) it._resolve(result);
}

confirm.accept = () => _settle(true);
confirm.cancel = () => _settle(false);

export function useConfirm() {
  return { confirm, state };
}
