---
name: utools-cctoggle-dev
description: Development standards for the utools-cctoggle project.
---

# uTools ccToggle Development Standards

## 编码规范

写入文件时必须使用无 BOM 的 UTF-8：

```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
```

**禁止使用** Set-Content -Encoding UTF8（会添加 BOM，导致 Vite/PostCSS 解析失败）

## Tech Stack
- Vue 3.5+ / Vite 6+ / pnpm / Vue Router 4 / ECharts 6+

## Commands
- pnpm dev - Start dev server
- pnpm build - Production build
- pnpm preview - Preview production build