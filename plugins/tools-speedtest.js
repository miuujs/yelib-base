import { execFileSync, execFile } from 'child_process'

const SERVERS = [
  { host: 'iperf.he.net', port: 5201, label: 'HE.NET' },
  { host: 'ping.online.net', port: 5201, label: 'Online.net' },
  { host: 'iperf.biznetnetworks.com', port: 5201, label: 'Biznet' }
]

function fmtBps(bps) {
  if (bps > 1e9) return (bps / 1e9).toFixed(2) + ' Gbps'
  if (bps > 1e6) return (bps / 1e6).toFixed(2) + ' Mbps'
  if (bps > 1e3) return (bps / 1e3).toFixed(2) + ' Kbps'
  return bps.toFixed(2) + ' bps'
}

function runIperf(host, port, dur, direction) {
  return new Promise((resolve, reject) => {
    const args = ['-c', host, '-p', String(port), '-t', String(dur), '-J', '--connect-timeout', '5000']
    if (direction === 'up') args.push('-R')
    execFile('iperf3', args, { timeout: (dur + 10) * 1000 }, (err, stdout) => {
      if (err) return reject(err)
      try {
        const data = JSON.parse(stdout)
        const end = data.end
        const sum = direction === 'up' ? end.sum_sent : end.sum_received
        const bps = sum ? sum.bits_per_second : 0
        resolve(bps)
      } catch {
        reject(new Error('Parse failed'))
      }
    })
  })
}

async function testLatency(host) {
  try {
    const out = execFileSync('ping', ['-c', '4', '-W', '3', host], { timeout: 15000, encoding: 'utf8' })
    const avg = out.match(/rtt.*=.*\/([\d.]+)/)
    return avg ? parseFloat(avg[1]) : 0
  } catch {
    return 0
  }
}

export default async ({ sock, m, args }) => {
  const count = parseInt(args[0]) || 1
  if (count < 1 || count > 20) return m.reply('Count must be 1-20')

  await m.reply('Running speedtest (' + count + 'x)...')

  let totalDl = 0, totalUl = 0, success = 0
  let lastLatency = 0

  for (let i = 0; i < count; i++) {
    let done = false
    for (const sv of SERVERS) {
      if (done) break
      try {
        const [dl, ul] = await Promise.all([
          runIperf(sv.host, sv.port, 5, 'down'),
          runIperf(sv.host, sv.port, 5, 'up')
        ])
        if (dl > 0 || ul > 0) {
          totalDl += dl
          totalUl += ul
          success++
          if (!lastLatency) lastLatency = await testLatency(sv.host)
          done = true
        }
      } catch {}
    }
    if (!done) break
  }

  if (!success) return m.reply('Speedtest failed - no server reachable')

  const avgDl = totalDl / success
  const avgUl = totalUl / success

  let txt =
    'SPEEDTEST RESULTS\n' +
    'Tests completed: ' + success + '/' + count + '\n' +
    'Download: ' + fmtBps(avgDl) + '\n' +
    'Upload: ' + fmtBps(avgUl) + '\n' +
    'Latency: ' + (lastLatency ? lastLatency.toFixed(1) + ' ms' : 'N/A')

  await m.reply(txt)
}

export const aliases = ['speed']
