import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_PATH = join(__dirname, '../data/anticall.json')

function load() {
  try {
    if (existsSync(DATA_PATH)) {
      global.set.anticall = JSON.parse(readFileSync(DATA_PATH, 'utf-8')).anticall
    }
  } catch {}
}

function save() {
  mkdirSync(join(__dirname, '../data'), { recursive: true })
  writeFileSync(DATA_PATH, JSON.stringify({ anticall: !!global.set.anticall }))
}

load()

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')
  const mode = args[0]?.toLowerCase()
  if (!mode) return m.reply('Anticall: ' + (global.set.anticall ? 'on' : 'off'))
  if (mode === 'on') {
    global.set.anticall = true
    save()
    return m.reply('Anticall enabled — incoming calls will be rejected')
  }
  if (mode === 'off') {
    global.set.anticall = false
    save()
    return m.reply('Anticall disabled')
  }
  m.reply('Usage: .anticall on/off')
}
