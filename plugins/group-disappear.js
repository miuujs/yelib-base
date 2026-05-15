export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()
  const durations = {
    off: 0,
    '1d': 86400,
    '24h': 86400,
    '7d': 604800,
    '90d': 7776000
  }

  if (!mode || !(mode in durations)) {
    return m.reply('Usage: .disappear off / 24h / 7d / 90d')
  }

  await sock.groupToggleEphemeral(m.chat, durations[mode])
  m.reply('Disappearing messages: ' + mode)
}

export const aliases = ['dissapear', 'ephemeral']
