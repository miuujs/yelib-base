import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import { formatBytes } from '../src/utils/tools.js'
import { generateWAMessageFromContent } from 'baileys'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const bannerPath = join(__dirname, '../media/banner.jpeg')

let bannerBuffer = null
try {
  if (existsSync(bannerPath)) bannerBuffer = readFileSync(bannerPath)
} catch {}

function getDiskInfo() {
  try {
    const out = execSync('df -h / | tail -1', { encoding: 'utf-8', timeout: 3000 })
    const parts = out.trim().split(/\s+/)
    const used = parts[2] || '?'
    const total = parts[1] || '?'
    const pct = parts[4] || '?%'
    return used + ' / ' + total + ' (' + pct + ')'
  } catch {
    return '?'
  }
}

let diskInfoCache = ''
function getDisk() {
  if (!diskInfoCache) diskInfoCache = getDiskInfo()
  return diskInfoCache
}

function clockString(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export default async ({ sock, m }) => {
  const uptime = clockString(Date.now() - global.start)
  const nodeVer = process.version
  const platform = process.platform
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const ramUsed = formatBytes(usedMem)
  const ramTotal = formatBytes(totalMem)
  const cpus = os.cpus()
  const cpuModel = cpus.length > 0 ? cpus[0].model : '?'
  const cpuCores = cpus.length
  const disk = getDisk()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const now = new Date()
  const dayName = days[now.getDay()]
  const date = now.getDate()
  const month = months[now.getMonth()]
  const year = now.getFullYear()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  const text = `*Welcome To Main Menu*
@${m.sender.split('@')[0]}

*Bot Information:*
*Runtime* : ${uptime}
*Node.js* : ${nodeVer}
*Platform* : ${platform}
*RAM* : ${ramUsed} / ${ramTotal}
*CPU* : ${cpuModel} (${cpuCores} core)
*Disk* : ${disk}

*Time:*
${dayName}, ${month} ${date}, ${year}
${time}`

  const processed = await sock.messageBuilders.handleInteractive({
    interactiveMessage: {
      title: text,
      footer: 'github:miuujs/baileys',
      contextInfo: { mentionedJid: [m.sender] },
      image: bannerBuffer,
      buttons: [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Menu Options',
            sections: [
              {
                title: 'Menu',
                rows: [
                  { title: 'Group Menu', id: 'groupmenu', description: 'Group commands list' }
                ]
              }
            ]
          })
        },
        {
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({ display_text: 'Owner', url: 'https://wa.me/' + owner.numbers[0] })
        }
      ]
    }
  }, m.chat, m)

  if (processed.interactiveMessage.contextInfo) {
    delete processed.interactiveMessage.contextInfo.forwardingScore
    delete processed.interactiveMessage.contextInfo.isForwarded
  }

  const msg = generateWAMessageFromContent(m.chat, processed, {
    quoted: m,
    userJid: sock.user.id
  })

  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}
