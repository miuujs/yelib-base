import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const bannerPath = join(__dirname, '../media/menu.jpg')

let bannerBuffer = null
try {
  if (existsSync(bannerPath)) bannerBuffer = readFileSync(bannerPath)
} catch {}

const CH_ID = '120363425402680588@newsletter'
const INVITE_CODE = '0029VbCih2O1noz41RfWbV3X'

export default async ({ sock, m }) => {
  const chId = CH_ID
  const inviteCode = INVITE_CODE = '0029VbCih2O1noz41RfWbV3X'

  try {
    const content = {
      interactiveMessage: {
        title: 'Copy the channel ID from the button below',
        footer: 'github:miuujs/baileys',
        buttons: [
          {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text: 'Copy Channel ID', copy_code: chId })
          },
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text: 'Open Channel', url: `https://whatsapp.com/channel/${inviteCode}` })
          }
        ]
      }
    }

    if (bannerBuffer) content.interactiveMessage.image = bannerBuffer

    await sock.sendMessage(m.chat, content)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
