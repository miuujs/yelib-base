export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const q = m.quoted
  if (!q) return m.reply('Reply to a document')

  if (q.msg?.mimetype?.includes('text') || q.msg?.fileName?.endsWith('.txt') || (q.msg?.directPath && !/image|video|audio/.test(q.msg?.mimetype || ''))) {
    try {
      const buf = await q.download()
      if (!buf) return m.reply('Download failed')
      const text = buf.toString('utf-8')
      m.reply(text || '(empty file)')
    } catch (e) {
      m.reply('Download error: ' + e.message)
    }
  } else {
    m.reply('Reply to a text document')
  }
}
