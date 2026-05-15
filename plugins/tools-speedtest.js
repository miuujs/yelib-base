import { execFileSync, execFile } from 'child_process'

function fmtBps(bps) {
  if (bps > 1e9) return (bps / 1e9).toFixed(2) + ' Gbps'
  if (bps > 1e6) return (bps / 1e6).toFixed(2) + ' Mbps'
  if (bps > 1e3) return (bps / 1e3).toFixed(2) + ' Kbps'
  return bps.toFixed(2) + ' bps'
}

function iperfClient(port, dur, reverse) {
  return new Promise((resolve, reject) => {
    const args = ['-c', '127.0.0.1', '-p', String(port), '-t', String(dur), '-J', '--connect-timeout', '5000']
    if (reverse) args.push('-R')
    execFile('iperf3', args, { timeout: (dur + 10) * 1000 }, (err, stdout) => {
      if (err) return reject(err)
      try {
        const data = JSON.parse(stdout)
        const end = data.end
        const sum = reverse ? end.sum_sent : end.sum_received
        const bps = sum ? sum.bits_per_second : 0
        resolve(bps)
      } catch { reject(new Error('Parse failed')) }
    })
  })
}

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner && !m.isAdmin) return m.reply('Admin only')
  const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 10)

  await m.reply('Running localhost speedtest (' + count + 'x)...')

  try {
    execFileSync('which', ['iperf3'], { timeout: 5000 })
  } catch {
    return m.reply('iperf3 not installed. Run: apt install iperf3')
  }

  try {
    execFileSync('pkill', ['iperf3'], { timeout: 3000 })
  } catch {}

  const port = 5201
  execFileSync('iperf3', ['-s', '-D', '-p', String(port)], { timeout: 5000 })
  await new Promise(r => setTimeout(r, 1000))

  let totalDl = 0, totalUl = 0, success = 0

  for (let i = 0; i < count; i++) {
    try {
      const dl = await iperfClient(port, 3, false)
      const ul = await iperfClient(port, 3, true)
      if (dl > 0 || ul > 0) {
        totalDl += dl
        totalUl += ul
        success++
      }
    } catch {}
  }

  try { execFileSync('pkill', ['iperf3'], { timeout: 3000 }) } catch {}

  if (!success) return m.reply('Speedtest failed')

  const avgDl = totalDl / success
  const avgUl = totalUl / success

  let txt =
    'SPEEDTEST RESULTS (localhost)\n' +
    'Runs: ' + success + '/' + count + '\n' +
    'Download: ' + fmtBps(avgDl) + '\n' +
    'Upload: ' + fmtBps(avgUl)

  await m.reply(txt)
}

export const aliases = ['speed']
