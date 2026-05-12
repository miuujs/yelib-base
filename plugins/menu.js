import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import { runtime, formatBytes } from '../src/utils/tools.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const bannerPath = join(__dirname, '../media/banner.jpeg')
const menuPath = join(__dirname, '../media/menu.jpg')

let bannerBuffer = null
let menuBuffer = null
try {
  if (existsSync(bannerPath)) bannerBuffer = readFileSync(bannerPath)
  if (existsSync(menuPath)) menuBuffer = readFileSync(menuPath)
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

  const text = `*Welcome*
*Hello ${m.pushName || m.sender.split('@')[0]} | orgnz miuubyte*

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

  await sock.sendMessage(m.chat, {
    image: bannerBuffer,
    caption: text,
    contextInfo: {
      mentionedJid: [m.sender],
      isForwarded: true,
      forwardingScore: 999,
      externalAdReply: {
        title: 'yelib-base',
        body: '',
        thumbnail: menuBuffer,
        mediaType: 1,
        sourceUrl: 'https://github.com/miuujs/yelib-base',
        sourceType: '1'
      }
    }
  }, { quoted: m })

  await sock.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'Select a menu:',
      footer: 'yelib-base',
      buttons: [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Menu', id: 'menu' }) },
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Info', id: 'info' }) },
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Donate', id: 'donate' }) }
      ]
    }
  })
}
