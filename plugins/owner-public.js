import { adReply } from '../src/utils/reply.js'

export default async ({ sock, m }) => {
  set.self = false
  await adReply(sock, m, 'Public mode activated')
}
