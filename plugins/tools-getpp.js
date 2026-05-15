export default async ({ sock, m, args, isGroup }) => {
  let target = m.sender
  if (isGroup) {
    if (m.quoted) target = m.quoted.sender
    else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    else target = m.chat
  } else {
    if (m.quoted) target = m.quoted.sender
    else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  }
  try {
    const ppUrl = await sock.profilePictureUrl(target, 'image')
    await sock.sendMessage(m.chat, {
      image: { url: ppUrl },
      caption: `@${target.split('@')[0]}`,
      contextInfo: { mentionedJid: [target] }
    })
  } catch {
    m.reply('No profile picture found')
  }
}

export const aliases = ['getprofile', 'pp']
