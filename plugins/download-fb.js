import axios from 'axios'
import vm from 'vm'
import { save } from '../src/utils/tmp.js'

async function savefrom(url) {
  const body = new URLSearchParams({
    sf_url: encodeURI(url),
    sf_submit: '',
    new: 2,
    lang: 'id',
    app: '',
    country: 'id',
    os: 'Windows',
    browser: 'Chrome',
    channel: ' main',
    'sf-nomad': 1
  })
  const { data } = await axios.post('https://worker.sf-tools.com/savefrom.php', body, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://id.savefrom.net',
      'referer': 'https://id.savefrom.net/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/99'
    }
  })
  const exec = '[]["filter"]["constructor"](b).call(a);'
  const patched = data.replace(exec,
    `try { i++; if (i === 2) scriptResult = ${exec.split('.call')[0]}.toString(); else (${exec.replace(/;/, '')}); } catch {}`)
  const ctx = { scriptResult: '', i: 0 }
  vm.createContext(ctx)
  new vm.Script(patched).runInContext(ctx)
  const match = ctx.scriptResult.match(/window\.parent\.sf\.videoResult\.show\((.*?)\);/)
  if (!match) return null
  const info = JSON.parse(match[1])
  return {
    title: info?.title || '',
    urls: []
  }
}

export default async ({ sock, m, args }) => {
  const url = args[0]
  if (!url) return m.reply('Usage: .fb <url>')

  await m.reply('Downloading Facebook video...')

  try {
    const info = await savefrom(url)
    if (!info) throw new Error('No media found')

    const dlUrl = info.urls?.[0]
    if (dlUrl) {
      const { data: buf } = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://id.savefrom.net/' }
      })
      save('fb_' + Date.now() + '.mp4', Buffer.from(buf))
      await sock.sendMessage(m.chat, {
        video: Buffer.from(buf),
        caption: info.title || ''
      }, { quoted: m })
    } else {
      throw new Error('No download URL found')
    }
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
