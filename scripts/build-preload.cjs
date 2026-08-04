const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const destDir = path.resolve(__dirname, '../public/preload')

// 1. 清理并重建 public/preload
try { fs.rmSync(destDir, { recursive: true, force: true }) } catch (e) {}
fs.mkdirSync(destDir, { recursive: true })

// 2. 编译 TypeScript
execSync('tsc -p tsconfig.preload.json', { stdio: 'inherit' })

// 3. 复制静态资源
const srcDir = path.resolve(__dirname, '../src/preload')
const assets = ['package.json', 'proxy-daemon.html']
for (const file of assets) {
  try {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
    console.log(`copied: ${file}`)
  } catch (e) {
    console.warn(`skip: ${file} (${e.message})`)
  }
}
