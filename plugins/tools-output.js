export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const q = m.quoted
  if (!q) return m.reply('Reply to a document or use .read <path>')

  const msgId = q.key?.id
  if (msgId && global.evalFiles?.has(msgId)) {
    try {
      const { readFile } = await import('fs/promises')
      const text = await readFile(global.evalFiles.get(msgId), 'utf-8')
      m.reply(text)
    } catch (e) {
      global.evalFiles.delete(msgId)
      m.reply('Temp file not found, use reply to download: ' + e.message)
    }
    return
  }

  if (!q.msg?.directPath) return m.reply('Reply to a document')

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')
    const text = buf.toString('utf-8')
    m.reply(text || '(empty)')
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
