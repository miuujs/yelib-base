import { downloadMediaMessage } from '../src/utils/handler.js'
import { adReply } from '../src/utils/reply.js'

const isOwner = (m) => owner.numbers.includes(m.sender?.split('@')[0])

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
  },
  setprefix: {
    owner: true,
    group: false,
    handler: async ({ clients, m, args }) => {
      if (!args) return adReply(clients, m, 'Usage: setprefix [new_prefix]')
      set.prefix = [args.trim()]
      await adReply(clients, m, `Prefix set to: ${set.prefix[0]}`)
    }
  },
  bc: {
    owner: true,
    group: false,
    handler: async ({ clients, m, args }) => {
      const text = m.quoted?.text || args
      if (!text) return adReply(clients, m, 'Provide text or reply to a message')
      let sent = 0
      for (const [jid, chat] of Object.entries(clients.chats)) {
        if (!jid.endsWith('@g.us')) continue
        try {
          await clients.sendMessage(jid, { text })
          sent++
          await new Promise(r => setTimeout(r, 1000))
        } catch {}
      }
      await adReply(clients, m, `Broadcast sent to ${sent} group(s)`)
    }
  },
  runtime: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      const { runtime } = await import('../src/utils/tools.js')
      await adReply(clients, m, `Runtime: ${runtime((Date.now() - global.start) / 1000)}`)
    }
  },
  sticker: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      const quoted = m.quoted
      if (quoted?.message?.imageMessage || quoted?.message?.videoMessage) {
        const buffer = await downloadMediaMessage(quoted)
        await clients.sendMessage(m.chat, {
          sticker: buffer
        }, { quoted: m })
      } else if (m.msg?.imageMessage || m.msg?.videoMessage) {
        const buffer = await downloadMediaMessage(m)
        await clients.sendMessage(m.chat, {
          sticker: buffer
        }, { quoted: m })
      } else {
        await adReply(clients, m, 'Reply to an image or video')
      }
    }
  },
  toimage: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      if (!m.quoted?.message?.stickerMessage) {
        return adReply(clients, m, 'Reply to a sticker')
      }
      const buffer = await downloadMediaMessage(m.quoted)
      await clients.sendMessage(m.chat, {
        image: buffer
      }, { quoted: m })
    }
  },
  ping: {
    owner: false,
    group: false,
    handler: async ({ clients, m }) => {
      await adReply(clients, m, 'Pong!')
    }
  }
}
