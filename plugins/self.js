import { adReply } from '../src/utils/reply.js'

export const mode = 'self'

export const commands = {
  self: {
    owner: true,
    group: false,
    handler: async ({ clients, m }) => {
      set.self = true
      await adReply(clients, m, 'Self mode activated')
    }
  },
  public: {
    owner: true,
    group: false,
    handler: async ({ clients, m }) => {
      set.self = false
      await adReply(clients, m, 'Public mode activated')
    }
  }
}
