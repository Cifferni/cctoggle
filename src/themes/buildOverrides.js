/**
 * 从主题定义生成 Naive UI themeOverrides
 * @param {object} theme - 主题对象（来自 themes/*.js）
 * @param {boolean} isDark - 是否暗色模式
 * @returns {object} Naive UI themeOverrides
 */
export function buildOverrides(theme, isDark) {
  const c = isDark ? theme.colors.dark : theme.colors.light
  const comp = theme.components

  return {
    common: {
      ...comp.common,
      primaryColor: c.primary,
      primaryColorHover: c.primaryHover,
      primaryColorPressed: c.primaryPressed,
      primaryColorSuppl: c.primarySuppl,
    },
    Card: {
      ...comp.Card,
      borderColor: c.border,
      color: c.bgCard,
      colorModal: c.bgCard,
    },
    Button: { ...comp.Button },
    Input: {
      ...comp.Input,
      color: c.bgCard,
      colorFocus: c.bgCard,
      borderHover: c.primary,
      borderFocus: c.primary,
      boxShadowFocus: isDark
        ? `0 0 0 2px ${c.primarySuppl}`
        : `0 0 0 2px ${c.primarySuppl}`,
    },
    InputNumber: {
      ...comp.InputNumber,
      color: c.bgCard,
      colorFocus: c.bgCard,
    },
    Tag: { ...comp.Tag },
    Collapse: { borderColor: c.border },
    List: { borderColor: c.border, color: c.bgCard },
    Divider: { borderColor: c.border },
    Alert: { ...comp.Alert },
    Statistic: { ...comp.Statistic },
    Descriptions: {
      ...comp.Descriptions,
      borderColor: c.border,
      labelColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      thColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    },
    Code: {
      ...comp.Code,
      textColor: c.text,
      color: c.bgHover,
    },
  }
}
