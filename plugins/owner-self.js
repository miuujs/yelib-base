import { adReply } from '../src/utils/reply.js'

export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')
  global.set.self = true
  await adReply(sock, m, 'Self mode activated')
}
