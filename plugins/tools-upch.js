import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const readme = readFileSync(join(__dirname, '../README.md'), 'utf-8')

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  try {
    let chJid = args[0] || '120363425402680588@newsletter'
    if (!chJid.includes('@newsletter')) {
      const meta = await sock.newsletterMetadata('invite', chJid).catch(() => null)
      if (!meta?.id) return m.reply('Invalid channel invite code')
      chJid = meta.id
    }

    await sock.newsletterFollow(chJid).catch(() => {})

    await sock.sendMessage(chJid, { text: readme })
    m.reply('README sent to channel successfully')
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
