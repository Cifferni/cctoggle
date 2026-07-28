// 纯 Node 光栅化生成图标 PNG（无第三方依赖）
// 设计：主题蓝渐变圆角底 + 白色拨动开关（象征「一键切换供应商」）
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '..', 'public')

const SS = 4 // 超采样倍数（抗锯齿）

// ---------- 颜色工具 ----------
const hex = (h) => {
  h = h.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const lerp = (a, b, t) => a + (b - a) * t
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]

// ---------- 画布 ----------
function makeCanvas(w, h) {
  const buf = new Float64Array(w * h * 4) // rgba, premult 不用，手动 over
  return { w, h, buf }
}
function setPx(cv, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return
  const i = (y * cv.w + x) * 4
  const dr = cv.buf[i], dg = cv.buf[i + 1], db = cv.buf[i + 2], da = cv.buf[i + 3]
  const outA = a + da * (1 - a)
  if (outA <= 0) return
  cv.buf[i] = (r * a + dr * da * (1 - a)) / outA
  cv.buf[i + 1] = (g * a + dg * da * (1 - a)) / outA
  cv.buf[i + 2] = (b * a + db * da * (1 - a)) / outA
  cv.buf[i + 3] = outA
}

// 有符号距离场：圆角矩形
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r)
  const qy = Math.abs(py - cy) - (hh - r)
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0)
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r
}
function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r
}

// 用 SDF 填充，coverage 用像素级（超采样已提供 AA，这里做硬边即可但保留一点软边）
function fillSDF(cv, sdf, colorFn, alpha = 1) {
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      const d = sdf(x + 0.5, y + 0.5)
      if (d < 0) {
        const c = colorFn(x, y)
        setPx(cv, x, y, c[0], c[1], c[2], alpha)
      }
    }
  }
}

// ---------- 绘制单个尺寸 ----------
function draw(size) {
  const S = size * SS
  const cv = makeCanvas(S, S)

  const top = hex('#60a5fa')
  const bot = hex('#2563eb')
  const white = [255, 255, 255]

  // 背景圆角方块（uTools 图标一般铺满，圆角约 22%）
  const bgHW = S / 2
  const bgR = S * 0.235
  fillSDF(
    cv,
    (x, y) => sdRoundRect(x, y, S / 2, S / 2, bgHW, bgHW, bgR),
    (x, y) => {
      // 垂直渐变 + 轻微对角光
      const t = y / S
      const c = mix(top, bot, t)
      const diag = ((x + y) / (2 * S) - 0.5) * 12
      return [c[0] + diag, c[1] + diag, c[2] + diag]
    }
  )

  // 拨动开关 track（胶囊，半透明白）
  const trackW = S * 0.60
  const trackH = S * 0.30
  const trackCx = S / 2
  const trackCy = S / 2
  const trackR = trackH / 2
  fillSDF(
    cv,
    (x, y) => sdRoundRect(x, y, trackCx, trackCy, trackW / 2, trackH / 2, trackR),
    () => white,
    0.28
  )
  // track 描边（更实的白，做一圈边）
  fillSDF(
    cv,
    (x, y) => {
      const d = sdRoundRect(x, y, trackCx, trackCy, trackW / 2, trackH / 2, trackR)
      // 环形：-stroke < d < 0
      const stroke = S * 0.016
      return Math.max(d, -(d + stroke))
    },
    () => white,
    0.9
  )

  // 开关旋钮（ON 状态，靠右），实心白 + 内圈蓝点
  const knobR = trackH / 2 - S * 0.045
  const knobCx = trackCx + trackW / 2 - trackR
  const knobCy = trackCy
  fillSDF(cv, (x, y) => sdCircle(x, y, knobCx, knobCy, knobR), () => white, 1)
  // 旋钮内的蓝色小圆点（呼应主题）
  fillSDF(
    cv,
    (x, y) => sdCircle(x, y, knobCx, knobCy, knobR * 0.42),
    () => bot,
    1
  )

  // ---------- 下采样到目标尺寸 ----------
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * S + (x * SS + sx)) * 4
          const pa = cv.buf[i + 3]
          r += cv.buf[i] * pa
          g += cv.buf[i + 1] * pa
          b += cv.buf[i + 2] * pa
          a += pa
        }
      }
      const n = SS * SS
      const oi = (y * size + x) * 4
      const alpha = a / n
      if (alpha > 0) {
        out[oi] = Math.round(Math.min(255, Math.max(0, r / a)))
        out[oi + 1] = Math.round(Math.min(255, Math.max(0, g / a)))
        out[oi + 2] = Math.round(Math.min(255, Math.max(0, b / a)))
      }
      out[oi + 3] = Math.round(Math.min(255, Math.max(0, alpha * 255)))
    }
  }
  return out
}

// ---------- PNG 编码 ----------
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(rgba, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 每行前加 filter byte 0
  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- 输出 ----------
const sizes = [
  { name: 'logo.png', size: 256 },
  { name: 'logo@512.png', size: 512 },
]
for (const { name, size } of sizes) {
  const rgba = draw(size)
  const png = encodePNG(rgba, size, size)
  const p = path.join(OUT_DIR, name)
  fs.writeFileSync(p, png)
  console.log(`wrote ${p} (${size}x${size}, ${png.length} bytes)`)
}
