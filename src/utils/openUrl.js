/**
 * 在 uTools 插件中打开外部链接
 * 优先使用 uTools API，降级到 window.open
 * @param {string} url
 */
export function openUrl(url) {
  try {
    window.utools?.shellOpenExternal?.(url);
  } catch (e) {
    window.open(url, "_blank");
  }
}
