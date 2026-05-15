import os from 'os'
import fs from 'fs'
import zlib from 'zlib'
import crypto from 'crypto'
import https from 'https'
import dns from 'dns'
import { performance } from 'perf_hooks'
import { execSync } from 'child_process'

function clockString(ms) {
  if (isNaN(ms)) return '--'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000) % 24
  const m = Math.floor(ms / 60000) % 60
  const s = Math.floor(ms / 1000) % 60
  return [d ? d + 'd' : '', h ? h + 'h' : '', m ? m + 'm' : '', s ? s + 's' : ''].filter(Boolean).join(' ')
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + sizes[i]
}

function drawBar(percent, len) {
  const filled = '\u2580'
  const empty = '\u2581'
  const fl = Math.round((percent / 100) * len)
  return filled.repeat(fl) + empty.repeat(len - fl)
}

async function singleCoreTest() {
  const start = performance.now()
  let r = 0
  for (let i = 0; i < 1000000; i++) r += Math.sqrt(i) * Math.sin(i)
  return Math.max(0, 100 - ((performance.now() - start) / 10))
}

async function cpuBench() {
  const cores = os.cpus().length
  const sc = await singleCoreTest()
  const start = performance.now()
  await Promise.all(Array.from({ length: cores }, () => singleCoreTest()))
  const mc = Math.max(0, 100 - ((performance.now() - start) / (cores * 5)))
  const startHash = performance.now()
  let hc = 0
  while (performance.now() - startHash < 1000) {
    crypto.createHash('sha256').update('test' + hc).digest('hex')
    hc++
  }
  const compData = Buffer.from('x'.repeat(100000))
  const compStart = performance.now()
  zlib.deflateSync(compData)
  zlib.inflateSync(zlib.deflateSync(compData))
  const compTime = (performance.now() - compStart) / 1000
  const compSpeed = ((compData.length * 2) / (1024 * 1024) / compTime).toFixed(2)
  const startCpu = os.cpus()
  await new Promise(r => setTimeout(r, 1000))
  const endCpu = os.cpus()
  const usages = startCpu.map((s, i) => {
    const e = endCpu[i]
    const sT = Object.values(s.times).reduce((a, b) => a + b, 0)
    const eT = Object.values(e.times).reduce((a, b) => a + b, 0)
    const usage = (eT - sT) > 0 ? 100 - (((e.times.idle - s.times.idle) / (eT - sT)) * 100) : 0
    return Math.max(0, Math.min(100, usage))
  })
  return { model: os.cpus()[0].model, cores, singleCore: Math.round(sc), multiCore: Math.round(mc), hashSpeed: hc, compSpeed, coreUsages: usages }
}

async function memBench() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const buf = Buffer.alloc(10 * 1024 * 1024)
  const start = performance.now()
  for (let i = 0; i < 10; i++) buf.fill(i % 256)
  const speed = ((10 * 1024 * 1024 * 10) / (1024 * 1024) / ((performance.now() - start) / 1000)).toFixed(2)
  return { total, used, free, usagePercent: ((used / total) * 100).toFixed(1), speedMBps: speed }
}

async function diskBench() {
  let readSpd = 'N/A', writeSpd = 'N/A', randomIO = 'N/A', diskUsage = 'N/A', diskInfo = 'N/A'
  try {
    const td = Buffer.alloc(5 * 1024 * 1024, 'x')
    const wStart = performance.now()
    fs.writeFileSync('/tmp/bench_test', td)
    writeSpd = ((5 * 1024 * 1024) / (1024 * 1024) / ((performance.now() - wStart) / 1000)).toFixed(2)
    const rStart = performance.now()
    const rd = fs.readFileSync('/tmp/bench_test')
    readSpd = (rd.length / (1024 * 1024) / ((performance.now() - rStart) / 1000)).toFixed(2)
    const fd = fs.openSync('/tmp/bench_test', 'r')
    const raStart = performance.now()
    for (let i = 0; i < 1000; i++) {
      const b = Buffer.alloc(1024)
      fs.readSync(fd, b, 0, 1024, Math.floor(Math.random() * (td.length - 1024)))
    }
    fs.closeSync(fd)
    randomIO = Math.round(1000 / ((performance.now() - raStart) / 1000))
    fs.unlinkSync('/tmp/bench_test')
  } catch {}
  try {
    const df = execSync('df -h /', { encoding: 'utf8', timeout: 5000 })
    const lines = df.trim().split('\n')
    if (lines.length >= 2) {
      const data = lines[1].split(/\s+/)
      diskUsage = data[2] + ' / ' + data[1] + ' (' + data[4] + ')'
    }
    diskInfo = df.trim()
  } catch {}
  return { readSpeed: readSpd, writeSpeed: writeSpd, randomAccess: randomIO, usage: diskUsage, info: diskInfo }
}

async function netBench() {
  function testDownload() {
    return new Promise(r => {
      const s = Date.now()
      https.get('https://speed.cloudflare.com/__down?bytes=5000000', res => {
        let total = 0
        res.on('data', c => total += c.length)
        res.on('end', () => r((total * 8) / (((Date.now() - s) / 1000) * 1000000)))
        res.on('error', () => r(0))
      }).on('error', () => r(0)).setTimeout(15000, function(){ this.destroy(); r(0) })
    })
  }
  function testUpload() {
    return new Promise(r => {
      const data = Buffer.alloc(500000, 'x')
      const s = Date.now()
      const req = https.request({ hostname: 'httpbin.org', port: 443, path: '/post', method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': data.length } }, res => {
        res.on('data', () => {})
        res.on('end', () => r((data.length * 8) / (((Date.now() - s) / 1000) * 1000000)))
      })
      req.on('error', () => r(0))
      req.setTimeout(15000, function(){ this.destroy(); r(0) })
      req.write(data)
      req.end()
    })
  }
  function testLatency() {
    return new Promise(r => {
      const s = Date.now()
      https.get('https://www.google.com', res => { r(Date.now() - s); res.destroy() })
        .on('error', () => r(0)).setTimeout(5000, function(){ this.destroy(); r(0) })
    })
  }
  function testDNS() {
    return new Promise(r => {
      const s = Date.now()
      dns.resolve('google.com', () => r(Date.now() - s))
      setTimeout(() => r(0), 5000)
    })
  }
  const [dl, ul, lat, dnsT] = await Promise.all([testDownload(), testUpload(), testLatency(), testDNS()])
  return { download: dl.toFixed(2), upload: ul.toFixed(2), latency: lat.toFixed(2), dnsResolve: dnsT.toFixed(2) }
}

function calcScore(b) {
  const cpuS = (b.cpu.singleCore + b.cpu.multiCore) / 2
  const memS = Math.min(100, parseFloat(b.mem.speedMBps) / 10)
  const diskS = Math.min(100, (parseFloat(b.disk.readSpeed) + parseFloat(b.disk.writeSpeed)) / 2)
  const netS = Math.min(100, (parseFloat(b.net.download) + parseFloat(b.net.upload)) / 2)
  return Math.round(cpuS * 0.3 + memS * 0.25 + diskS * 0.25 + netS * 0.2)
}

function rating(s) {
  if (s >= 90) return 'EXCEPTIONAL'
  if (s >= 80) return 'EXCELLENT'
  if (s >= 70) return 'VERY GOOD'
  if (s >= 60) return 'GOOD'
  if (s >= 50) return 'AVERAGE'
  if (s >= 40) return 'BELOW AVERAGE'
  return 'POOR'
}

export default async ({ sock, m }) => {
  await m.reply('[ *] Running VPS benchmark...')

  try {
    const [cpu, mem, disk, net] = await Promise.all([cpuBench(), memBench(), diskBench(), netBench()])
    const score = calcScore({ cpu, mem, disk, net })

    const maxCores = 8
    const showCores = cpu.coreUsages.slice(0, maxCores)
    const extraCores = cpu.coreUsages.length - maxCores

    let txt =
      '*VPS BENCHMARK RESULTS*\n' +
      'Score: ' + score + '/100 (' + rating(score) + ')\n' +
      '\n*SYSTEM*\n' +
      '- CPU: ' + cpu.model + '\n' +
      '- Cores: ' + cpu.cores + '\n' +
      '- Platform: ' + os.platform() + ' ' + os.arch() + '\n' +
      '- Hostname: ' + os.hostname() + '\n' +

      '\n*MEMORY*\n' +
      '- ' + formatBytes(mem.used) + ' / ' + formatBytes(mem.total) + ' (' + mem.usagePercent + '%)\n' +
      drawBar(parseFloat(mem.usagePercent), 15) + '\n' +
      '- Speed: ' + mem.speedMBps + ' MB/s\n' +

      '\n*CPU*\n' +
      '- Single Core: ' + cpu.singleCore + '/100\n' +
      '- Multi Core: ' + cpu.multiCore + '/100\n' +
      '- Hash: ' + cpu.hashSpeed + ' h/s\n' +
      '- Compression: ' + cpu.compSpeed + ' MB/s\n' +
      showCores.map((u, i) => '- Core ' + (i + 1) + ': ' + drawBar(u, 12) + ' ' + u.toFixed(1) + '%').join('\n') +
      (extraCores > 0 ? '\n- ...and ' + extraCores + ' more cores' : '') + '\n' +

      '\n*DISK*\n' +
      '- Read: ' + disk.readSpeed + ' MB/s\n' +
      '- Write: ' + disk.writeSpeed + ' MB/s\n' +
      '- Random: ' + disk.randomAccess + ' IOPS\n' +
      '- Usage: ' + disk.usage + '\n' +

      '\n*NETWORK*\n' +
      '- Download: ' + net.download + ' Mbps\n' +
      '- Upload: ' + net.upload + ' Mbps\n' +
      '- Latency: ' + net.latency + ' ms\n' +
      '- DNS: ' + net.dnsResolve + ' ms\n' +

      '\n*UPTIME*\n' +
      '- System: ' + clockString(os.uptime() * 1000) + '\n' +
      '- Bot: ' + clockString(process.uptime() * 1000) + '\n' +
      '- Load: ' + os.loadavg().map(v => v.toFixed(2)).join(' / ')

    await m.reply(txt)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['benchmark', 'bench', 'vpstest']
