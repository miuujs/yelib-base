import { adReply } from '../src/utils/reply.js'

export const mode = 'public'

export const commands = {
  ping: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      await adReply(clients, m, 'Pong!')
    }
  },
  menu: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      const { runtime } = await import('../src/utils/tools.js')
      const text = [
        `*yelib-base*`,
        `Runtime: ${runtime((Date.now() - global.start) / 1000)}`,
        `Mode: ${set.self ? 'Self' : 'Public'}`,
        ``,
        `*Commands:*`,
        `${set.prefix[0]}ping - Check response`,
        `${set.prefix[0]}menu - Show this menu`,
        `${set.prefix[0]}runtime - Bot uptime`,
      ].join('\n')
      await adReply(clients, m, text)
    }
  },
  runtime: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      const { runtime } = await import('../src/utils/tools.js')
      await adReply(clients, m, `Runtime: ${runtime((Date.now() - global.start) / 1000)}`)
    }
  }
}
