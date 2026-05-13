import { execFileSync } from 'child_process'
import os from 'os'

export default async ({ sock, m }) => {
  try {
    const fmtUptime = s => {
      const d = Math.floor(s / 86400)
      const h = Math.floor((s % 86400) / 3600)
      const m = Math.floor((s % 3600) / 60)
      return d + 'd ' + h + 'h ' + m + 'm'
    }
    const sysUptime = fmtUptime(os.uptime())
    const botUptime = fmtUptime(process.uptime())

    const totalMem = os.totalmem() / (1024 ** 3)
    const freeMem = os.freemem() / (1024 ** 3)
    const usedMem = totalMem - freeMem

    let diskInfo = ''
    try {
      const df = execFileSync('df', ['-h', '/'], { encoding: 'utf8' })
      const lines = df.trim().split('\n')
      const parts = lines[1].split(/\s+/)
      diskInfo = parts[1] + ' / ' + parts[3] + ' (used: ' + parts[4] + ')'
    } catch {
      diskInfo = 'N/A'
    }

    let cpuInfo = ''
    try {
      const cpu = execFileSync('cat', ['/proc/cpuinfo'], { encoding: 'utf8' })
      const modelLine = cpu.split('\n').find(l => l.startsWith('model name'))
      const cores = os.cpus().length
      cpuInfo = (modelLine ? modelLine.split(':')[1].trim() : 'Unknown') + ' (' + cores + ' cores)'
    } catch {
      cpuInfo = (os.cpus()[0]?.model || 'Unknown') + ' (' + os.cpus().length + ' cores)'
    }

    const loadAvg = os.loadavg().map(v => v.toFixed(2)).join(', ')
    const hostname = os.hostname()

    const text =
      '*System Information*\n' +
      '*Runtime:* ' + sysUptime + '\n' +
      '*OS:* ' + os.type() + ' ' + os.release() + '\n' +
      '*Platform:* ' + os.platform() + ' ' + os.arch() + '\n' +
      '*Hostname:* ' + hostname + '\n' +
      '*CPU:* ' + cpuInfo + '\n' +
      '*Load:* ' + loadAvg + '\n' +
      '*RAM:* ' + usedMem.toFixed(1) + 'GB / ' + totalMem.toFixed(1) + 'GB (' + freeMem.toFixed(1) + 'GB free)\n' +
      '*Disk (/):* ' + diskInfo + '\n' +
      '*Node:* ' + process.version + '\n' +
      '*Bot Uptime:* ' + botUptime

    await m.reply(text)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['os', 'sys']
