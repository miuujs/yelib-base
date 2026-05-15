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
      m.reply('```' + result + '```')
    } catch (e) {
      m.reply('Error:\n```' + e.message + '```')
    }
  }
}
