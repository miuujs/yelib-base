import { readdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import chalk from 'chalk'
import logger from './utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pluginsDir = join(__dirname, '../plugins')

let commandMap = {}

export async function reloadPlugins() {
  if (!existsSync(pluginsDir)) {
    logger.error('Plugins directory not found: ' + pluginsDir)
    return
  }

  commandMap = {}
  const files = readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const plugin = await import(join(pluginsDir, file) + '?t=' + Date.now())
      if (!plugin.commands) continue
      const name = file.replace('.js', '')
      for (const [cmd, def] of Object.entries(plugin.commands)) {
        commandMap[cmd] = { ...def, plugin: name }
      }
    } catch (e) {
      logger.error('Failed to load plugin ' + file + ': ' + e.message)
    }
  }

  logger.info('Commands: ' + Object.keys(commandMap).join(', '))
}

await reloadPlugins()

export default async (clients, m) => {
  try {
    const body = m.body || ''
    if (!body) return

    const prefixes = set.prefix || ['.']
    const matchedPrefix = prefixes.find(p => body.startsWith(p))

    let cmd = ''
    let args = ''

    if (matchedPrefix) {
      const sliced = body.slice(matchedPrefix.length).trim()
      const parts = sliced.split(/ +/)
      cmd = parts[0]?.toLowerCase() || ''
      args = parts.slice(1).join(' ')
    } else {
      const parts = body.trim().split(/ +/)
      const first = parts[0]?.toLowerCase() || ''
      if (commandMap[first]) {
        cmd = first
        args = parts.slice(1).join(' ')
      }
    }

    if (!cmd) return

    const def = commandMap[cmd]
    if (!def) return

    const sender = m.sender?.split('@')[0] || ''
    const isOwner = owner.numbers.includes(sender)

    if (def.owner && !isOwner) {
      return m.reply('Owner only')
    }

    if (def.group && !m.isGroup) {
      return m.reply('Group only')
    }

    await def.handler({ clients, m, cmd, args, prefix: matchedPrefix || '', body })
    logger.print(m)

  } catch (e) {
    logger.error('Handler error: ' + e.message)
  }
}
