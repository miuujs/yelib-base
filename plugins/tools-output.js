export default async ({ sock, m }) => {
  const q = m.quoted
  if (!q || !q.isMedia) return m.reply('Reply to a document')

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')
    const text = buf.toString('utf-8')
    m.reply(text)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
