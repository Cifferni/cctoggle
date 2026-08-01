const fs = require('fs')
const path = require('path')

const srcDir = path.resolve(__dirname, '../src/preload')
const destDir = path.resolve(__dirname, '../public/preload')

const files = ['package.json', 'proxy-daemon.html']

for (const file of files) {
  const src = path.join(srcDir, file)
  const dest = path.join(destDir, file)
  fs.copyFileSync(src, dest)
  console.log(`copied: ${file}`)
}
