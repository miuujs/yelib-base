import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const aliases = ['getplugin', 'plugin']

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const name = args[0] || (m.quoted?.text || '').trim().toLowerCase()
  if (!name) return m.reply('Usage: .getpl <plugin name>')

  const filePath = join(__dirname, name.endsWith('.js') ? name : name + '.js')
  try {
    const code = readFileSync(filePath, 'utf-8')
    await sock.sendCodeBlock(m.chat, code, m, {
      title: '📄 ' + name,
      language: 'javascript'
    })
  } catch {
    m.reply('Plugin not found: ' + name)
  }
}
