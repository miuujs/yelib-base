import { adReply } from '../src/utils/reply.js'

export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')
  global.set.self = false
  await adReply(sock, m, 'Public mode activated')
}
