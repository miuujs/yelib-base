export default async ({ sock, m, isOwner }) => {
  try {
    if (!isOwner) return m.reply('Owner only')

    const q = m.quoted
    if (!q) return m.reply('Reply to a document')

    const msgId = q.key?.id
    if (msgId && global.evalFiles?.has(msgId)) {
      const { readFile } = await import('fs/promises')
      const text = await readFile(global.evalFiles.get(msgId), 'utf-8')
      if (text.length > 4000) {
        const { writeFile } = await import('fs/promises')
        const { join } = await import('path')
        const { tmpdir } = await import('os')
        const fp = join(tmpdir(), 'output_' + Date.now() + '.txt')
        await writeFile(fp, text)
        await sock.sendMessage(m.chat, { document: { url: fp }, mimetype: 'text/plain', fileName: 'output.txt' }, { quoted: m })
      } else {
        await m.reply(text)
      }
      return
    }

    if (!q.msg?.directPath) return m.reply('Reply to a document')

    const buf = await q.download()
    if (!buf) return m.reply('Download failed')
    const text = buf.toString('utf-8')
    if (text.length > 4000) {
      const { writeFile } = await import('fs/promises')
      const { join } = await import('path')
      const { tmpdir } = await import('os')
      const fp = join(tmpdir(), 'output_' + Date.now() + '.txt')
      await writeFile(fp, text)
      await sock.sendMessage(m.chat, { document: { url: fp }, mimetype: 'text/plain', fileName: 'output.txt' }, { quoted: m })
    } else {
      await m.reply(text || '(empty)')
    }
  } catch (e) {
    await m.reply('Output error: ' + e.message).catch(() => {})
  }
}
