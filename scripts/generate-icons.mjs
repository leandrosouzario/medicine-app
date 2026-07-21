/**
 * Gera PNGs a partir de public/icons/icon.svg (PWA + Apple Touch Icon).
 * Uso: node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const iconsDir = resolve(rootDir, 'public/icons')
const svgPath = resolve(iconsDir, 'icon.svg')

function renderSvgToPng(svg, size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
  return resvg.render().asPng()
}

const svg = readFileSync(svgPath, 'utf8')

const outputs = [
  { file: 'icon-180.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon-180.png', size: 180 },
]

for (const { file, size } of outputs) {
  const output = resolve(iconsDir, file)
  writeFileSync(output, renderSvgToPng(svg, size))
  console.log(`  ✓ ${file}`)
}

console.log('Ícones PWA gerados a partir de icon.svg.')
