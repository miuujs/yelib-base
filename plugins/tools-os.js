import os from 'os'
import v8 from 'v8'

const formatSize = (size) => (size / 1024 / 1024).toFixed(2) + ' MB'

const runtime = (seconds) => {
  seconds = Math.round(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  seconds %= 3600 * 24
  const h = Math.floor(seconds / 3600)
  seconds %= 3600
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return d + 'd ' + h + 'h ' + m + 'm ' + s + 's'
}

const hideIp = (ip) => {
  const seg = ip.split('.')
  if (seg.length === 4) {
    seg[2] = '***'
    seg[3] = '***'
    return seg.join('.')
  }
  return ip
}

export default async ({ sock, m, args }) => {
  try {
    const used = process.memoryUsage()
    const cpus = os.cpus().map(cpu => {
      cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0)
      return cpu
    })
    const cpu = cpus.reduce((last, cpu, _, { length }) => {
      last.total += cpu.total
      last.speed += cpu.speed / length
      last.times.user += cpu.times.user
      last.times.nice += cpu.times.nice
      last.times.sys += cpu.times.sys
      last.times.idle += cpu.times.idle
      last.times.irq += cpu.times.irq
      return last
    }, { speed: 0, total: 0, times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } })

    const heapStat = v8.getHeapStatistics()
    const myip = await fetch('https://ipinfo.io/json').then(r => r.json()).catch(() => ({}))
    const respTime = ((Date.now() - new Date((m.messageTimestamp || 0) * 1000)) / 1000).toFixed(3)

    let teks =
      'INFO SERVER\n' +
      '- Speed Respons: ' + respTime + 's\n' +
      '- Hostname: ' + os.hostname() + '\n' +
      '- CPU Core: ' + cpus.length + '\n' +
      '- Platform: ' + os.platform() + '\n' +
      '- OS: ' + (os.version ? os.version() + ' / ' : '') + os.release() + '\n' +
      '- Arch: ' + os.arch() + '\n' +
      '- RAM: ' + formatSize(os.totalmem() - os.freemem()) + ' / ' + formatSize(os.totalmem()) + '\n' +

      '\nPROVIDER INFO\n' +
      '- IP: ' + (myip.ip ? hideIp(myip.ip) : 'N/A') + '\n' +
      '- Region: ' + (myip.region || 'N/A') + ' ' + (myip.country || '') + '\n' +
      '- ISP: ' + (myip.org || 'N/A') + '\n' +

      '\nRUNTIME OS\n' +
      '- ' + runtime(os.uptime()) + '\n' +

      '\nRUNTIME BOT\n' +
      '- ' + runtime(process.uptime()) + '\n' +

      '\nNODE MEMORY USAGE\n' +
      Object.keys(used).map(key => '- ' + key + ': ' + formatSize(used[key])).join('\n') +
      '\n- Heap Executable: ' + formatSize(heapStat?.total_heap_size_executable || 0) +
      '\n- Physical Size: ' + formatSize(heapStat?.total_physical_size || 0) +
      '\n- Available Size: ' + formatSize(heapStat?.total_available_size || 0) +
      '\n- Heap Limit: ' + formatSize(heapStat?.heap_size_limit || 0) +
      '\n- Malloced Memory: ' + formatSize(heapStat?.malloced_memory || 0) +
      '\n- Peak Malloced: ' + formatSize(heapStat?.peak_malloced_memory || 0) +
      '\n- Native Contexts: ' + (heapStat?.number_of_native_contexts || 0) +
      '\n- Detached Contexts: ' + (heapStat?.number_of_detached_contexts || 0) +
      '\n- Total Global Handles: ' + formatSize(heapStat?.total_global_handles_size || 0) +
      '\n- Used Global Handles: ' + formatSize(heapStat?.used_global_handles_size || 0)

    if (cpus[0]) {
      teks += '\n\nTOTAL CPU USAGE\n'
      teks += cpus[0].model.trim() + ' (' + cpu.speed + ' MHZ)\n'
      teks += Object.keys(cpu.times).map(type =>
        '- ' + type + ': ' + ((100 * cpu.times[type]) / cpu.total).toFixed(2) + '%'
      ).join('\n')

      teks += '\n\nCPU CORE(S) USAGE (' + cpus.length + ' Core CPU)\n'
      teks += cpus.map((cpu, i) =>
        (i + 1) + '. ' + cpu.model.trim() + ' (' + cpu.speed + ' MHZ)\n' +
        Object.keys(cpu.times).map(type =>
          '- ' + type + ': ' + ((100 * cpu.times[type]) / cpu.total).toFixed(2) + '%'
        ).join('\n')
      ).join('\n\n')
    }

    await m.reply(teks)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['os', 'sys', 'info']
