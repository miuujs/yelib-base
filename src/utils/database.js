import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '../../data')
const DATA_PATH = join(DATA_DIR, 'group-settings.json')

let data = {}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

export function load() {
  try {
    if (existsSync(DATA_PATH)) {
      data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
    }
  } catch {}
}

export function save() {
  ensureDir()
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

export function get(jid) {
  return data[jid] || {}
}

export function set(jid, key, value) {
  if (!data[jid]) data[jid] = {}
  data[jid][key] = value
  save()
}

load()
