import { mkdirSync, existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const tmpDir = join(__dirname, '../../tmp')
const MAX_FILES = 25

function ensure() {
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
}

function clean() {
  ensure()
  const files = readdirSync(tmpDir).map(f => ({ name: f, time: statSync(join(tmpDir, f)).mtimeMs }))
  if (files.length <= MAX_FILES) return
  files.sort((a, b) => a.time - b.time)
  const toDelete = files.slice(0, files.length - MAX_FILES)
  for (const f of toDelete) rmSync(join(tmpDir, f), { force: true })
}

export function save(filename, data) {
  ensure()
  clean()
  const fp = join(tmpDir, filename)
  writeFileSync(fp, data)
  return fp
}

export function getPath(filename) {
  ensure()
  return join(tmpDir, filename)
}
