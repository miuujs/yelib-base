import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import { runtime, formatBytes } from '../src/utils/tools.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const bannerPath = join(__dirname, '../media/banner')

let bannerBuffer = null
try {
  if (existsSync(bannerPath)) {
    bannerBuffer = readFileSync(bannerPath)
  }
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

export default async ({ sock, m }) => {
  const uptime = runtime((Date.now() - global.start) / 1000)
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
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const now = new Date()
  const dayName = days[now.getDay()]
  const date = now.getDate()
  const month = months[now.getMonth()]
  const year = now.getFullYear()
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const text = `Selamat Datang
Halo ${m.pushName || m.sender.split('@')[0]} | orgnz miuubyte

Informasi Bot:
Runtime : ${uptime}
Node.js : ${nodeVer}
Platform : ${platform}
RAM : ${ramUsed} / ${ramTotal}
CPU : ${cpuModel} (${cpuCores} core)
Disk : ${disk}

Waktu:
${dayName}, ${date} ${month} ${year}
${time}`

  const buttons = [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Menu', id: 'menu' }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Info', id: 'info' }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Donate', id: 'donate' }) }
  ]

  try {
    const msg = {
      interactiveMessage: {
        title: text,
        footer: 'yelib-base',
        externalAdReply: {
          title: 'yelib-base',
          body: '',
          thumbnail: bannerBuffer,
          mediaType: 1,
          sourceUrl: 'https://github.com/miuujs/yelib-base',
          sourceType: '1'
        },
        buttons
      }
    }

    await sock.sendMessage(m.chat, msg, { quoted: m })
  } catch (e) {
    await sock.sendMessage(m.chat, { text }, { quoted: m })
  }
}
