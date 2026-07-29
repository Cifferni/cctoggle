export { amberTheme } from './amber.js'
export { buildOverrides } from './buildOverrides.js'

import { amberTheme } from './amber.js'

/** 所有可用主题列表，后期新增主题在此添加即可 */
export const themes = [amberTheme]

/** 默认主题名称 */
export const defaultThemeName = 'amber'

/** 按名称查找主题 */
export function getThemeByName(name) {
  return themes.find(t => t.name === name) || themes[0]
}
