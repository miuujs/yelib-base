import { adReply } from '../src/utils/reply.js'

export const mode = 'self'

export const commands = {
  self: {
    owner: true,
    group: false,
    handler: async ({ sock, m }) => {
      set.self = true
      await adReply(sock, m, 'Self mode activated')
    }
  },
  public: {
    owner: true,
    group: false,
    handler: async ({ sock, m }) => {
      set.self = false
      await adReply(sock, m, 'Public mode activated')
    }
  }
}
