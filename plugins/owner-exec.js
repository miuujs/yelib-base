import { execSync } from 'child_process'
import * as bail from 'baileys'

export default async ({ sock, m, args, cmd, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  if (cmd === 'exec') {
    const code = args.join(' ') || (m.quoted?.text || '')
    if (!code) return m.reply('Usage: .exec <shell command>')
    try {
      const out = execSync(code, { timeout: 15000, encoding: 'utf-8', shell: true })
      m.reply('```' + (out || 'Done (no output)') + '```')
    } catch (e) {
      m.reply('Error:\n```' + e.message + '```')
    }
  } else if (cmd === 'eval' || cmd === 'ev') {
    Object.assign(global, bail)
    global.sock = sock
    const code = args.join(' ')
    if (!code) return m.reply(JSON.stringify(m, null, 2).slice(0, 4000))
    try {
      let result
      try {
        result = eval('(' + code + ')')
      } catch {
        result = eval(code)
      }
      if (result instanceof Promise) result = await result
      if (typeof result === 'function') result = result.toString()
      else if (typeof result !== 'string') result = JSON.stringify(result, null, 2)
      if (result.length > 4000) {
        const { writeFile } = await import('fs/promises')
        const { join } = await import('path')
        const { tmpdir } = await import('os')
        const d = new Date()
        const dateStr = [d.getDate(), d.getMonth()+1, d.getFullYear()].join('-')
        const fp = join(tmpdir(), dateStr + '.txt')
        await writeFile(fp, result)
        if (!global.evalFiles) global.evalFiles = new Map()
        const sent = await sock.sendMessage(m.chat, { document: { url: fp }, mimetype: 'text/plain', fileName: dateStr + '.txt', caption: 'Output too long, sent as file' }, { quoted: m })
        global.evalFiles.set(sent.key.id, fp)
      } else {
        m.reply('```' + result + '```')
      }
    } catch (e) {
      m.reply('Error:\n```' + e.message + '```')
    }
  }
}
