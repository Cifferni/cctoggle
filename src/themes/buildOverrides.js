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
      tableHeaderColor: c.bgHover,
      tableColor: c.bgCard,
      tableColorHover: c.primaryLight,
      tableColorStriped: c.bgHover,
    },
    Card: {
      ...comp.Card,
      borderColor: c.border,
      color: c.bgCard,
      colorModal: c.bgCard,
    },
    Drawer: {
      color: c.bg,
      colorModal: c.bg,
      headerBorderColor: c.border,
      footerBorderColor: c.border,
      textColor: c.text,
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
      borderHover: c.primary,
      borderFocus: c.primary,
      boxShadowFocus: `0 0 0 2px ${c.primarySuppl}`,
    },
    FormItem: {
      labelTextColor: c.textSecondary,
      labelFontWeight: '600',
      feedbackTextColor: c.danger,
      asteriskColor: c.danger,
    },
    Tag: { ...comp.Tag },
    Select: {
      peers: {
        InternalSelection: {
          color: c.bgCard,
          colorActive: c.bgCard,
          borderHover: c.primary,
          borderFocus: c.primary,
          boxShadowFocus: `0 0 0 2px ${c.primarySuppl}`,
          clearColor: c.textMuted,
          clearColorHover: c.primary,
          clearColorPressed: c.primaryPressed,
        },
        InternalSelectMenu: {
          color: c.bgCard,
          optionColorActive: c.primarySuppl,
          optionColorHover: c.primaryLight,
          optionTextColor: c.text,
          optionTextColorActive: c.primary,
          optionCheckColor: c.primary,
        },
      },
    },
    Checkbox: {
      colorChecked: c.primary,
      borderChecked: c.primary,
      checkMarkColor: '#fff',
      boxShadowFocus: `0 0 0 2px ${c.primarySuppl}`,
    },
    DataTable: {
      borderColor: c.border,
      thColor: c.primaryLight,
      thTextColor: c.text,
      tdColor: c.bg,
      tdColorHover: c.primaryLight,
      tdColorStriped: c.bgHover,
      tdTextColor: c.text,
      thFontWeight: '600',
      borderRadius: '8px',
    },
    Collapse: {
      borderColor: c.border,
      textColor: c.text,
      titleTextColor: c.text,
      arrowColor: c.textMuted,
    },
    List: { borderColor: c.border, color: c.bgCard },
    Divider: { borderColor: c.border },
    Alert: {
      ...comp.Alert,
      color: c.bgCard,
      colorInfo: c.bgCard,
      colorWarning: isDark ? '#3b2a1a' : '#fef3c7',
      colorError: c.dangerLight,
      colorSuccess: isDark ? '#1a3b2a' : '#f0fdf4',
      titleTextColor: c.text,
      contentTextColor: c.textSecondary,
      border: `1px solid ${c.border}`,
    },
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
    Tabs: {
      tabTextColorActive: c.primary,
      tabTextColor: c.textSecondary,
      tabTextColorHover: c.text,
      barColor: c.primary,
      fontWeightStrong: '600',
    },
  }
}
