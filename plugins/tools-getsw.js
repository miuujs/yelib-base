export default async ({ sock, m }) => {
  if (!m.quoted || !m.quoted.message) return m.reply('Reply to a status/story message')

  try {
    let msg = m.quoted.message
    let type = Object.keys(msg)[0]
    let content

    if (type === 'groupStatusMessageV2') {
      content = msg[type].message
      type = Object.keys(content)[0]
    } else {
      content = msg
    }

    if (content?.[type]?.contextInfo) {
      delete content[type].contextInfo
    }

    await sock.relayMessage(m.chat, content, {})
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['gsw']
