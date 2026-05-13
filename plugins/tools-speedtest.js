import { execFile } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const script = join(__dirname, '../spdtest.py')

export default async ({ sock, m }) => {
  await m.reply('Running speedtest... (60s)')

  try {
    const out = await new Promise((resolve, reject) => {
      execFile('python3', [script], { timeout: 120000 }, (err, stdout) => {
        if (err) return reject(new Error('Speedtest failed'))
        resolve(stdout)
      })
    })

    const data = JSON.parse(out)
    if (data.error) throw new Error(data.error)

    const text =
      '*Speedtest Result*\n' +
      'Download: ' + data.download + ' Mbps\n' +
      'Upload: ' + data.upload + ' Mbps\n' +
      'Ping: ' + data.ping + ' ms\n' +
      'Server: ' + data.server + '\n' +
      'IP: ' + data.ip + '\n' +
      'ISP: ' + data.isp

    await sock.sendMessage(m.chat, { text }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['speedtest']
