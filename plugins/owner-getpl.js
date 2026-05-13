import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const aliases = ['getplugin', 'plugin']

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const name = (args[0] || (m.quoted?.text || '')).trim().toLowerCase()
  if (!name || name === 'list') {
    const files = readdirSync(__dirname).filter(f => f.endsWith('.js')).sort()
    const list = files.map(f => f.replace('.js', '')).join('\n')
    return m.reply('*Plugins:*\n' + list)
  }

  const filePath = join(__dirname, name.endsWith('.js') ? name : name + '.js')
  if (!existsSync(filePath)) return m.reply('Plugin not found: ' + name)

  const code = readFileSync(filePath, 'utf-8')
  await sock.sendCodeBlock(m.chat, code, m, {
    title: name,
    language: 'javascript'
  })
}
