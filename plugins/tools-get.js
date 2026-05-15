import axios from 'axios'

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner && !m.isAdmin) return m.reply('Admin only')
  let url = args.join(' ') || (m.quoted?.text || '')
  if (!url) return m.reply('Usage: .get <url>\nExample: .get instagram.com')

  if (!/^https?:\/\//i.test(url)) {
    if (!url.includes('.')) return m.reply('Invalid URL')
    url = 'https://' + url
  }

  await m.reply('Fetching: ' + url)

  try {
    const start = Date.now()
    const { status, headers, data } = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      },
      validateStatus: () => true
    })
    const ms = Date.now() - start
    const size = headers['content-length']
      ? (parseInt(headers['content-length']) / 1024).toFixed(1) + ' KB'
      : (data.byteLength / 1024).toFixed(1) + ' KB'
    const contentType = headers['content-type'] || 'unknown'
    const server = headers['server'] || '-'
    const location = headers['location'] || '-'

    const info = `*URL:* ${url}
*Status:* ${status}
*Time:* ${ms}ms
*Size:* ${size}
*Type:* ${contentType}
*Server:* ${server}
*Redirect:* ${location}`

    if (contentType.includes('image/')) {
      await sock.sendMessage(m.chat, { image: Buffer.from(data), caption: info }, { quoted: m })
    } else if (contentType.includes('video/')) {
      await sock.sendMessage(m.chat, { video: Buffer.from(data), caption: info }, { quoted: m })
    } else if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('xml')) {
      const text = data.toString('utf-8')
      await m.reply(info + '\n\n```' + text + '```')
    } else {
      await m.reply(info)
    }
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
