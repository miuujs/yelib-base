export default async ({ sock, m }) => {
  await sock.sendRichMessage(
    m.chat,
    [
      { messageType: 2, messageText: '*Tools Commands*' },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Web Tools',
          rows: [
            { items: ['.get', 'Fetch & inspect web page'] },
            { items: ['.ss / .screenshot', 'Screenshot + frame (mac/iphone/etc)'] },
            { items: ['.speedtest', 'Test internet speed'] },
            { items: ['.benchmark', 'System benchmark'] },
            { items: ['.base64 <enc/dec>', 'Base64 encode/decode'] },
            { items: ['.os', 'OS info'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Profile',
          rows: [
            { items: ['.getpp / .pp', 'Get profile picture'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Media Tools',
          rows: [
            { items: ['.sticker / .s', 'Convert image/video to sticker'] },
            { items: ['.toimg / .toimage', 'Convert sticker to image'] },
            { items: ['.tomp3', 'Convert video/audio to MP3'] },
            { items: ['.tovn', 'Convert audio to voice note'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Story',
          rows: [
            { items: ['.getsw / .gsw', 'Retrieve replied status/story'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Channel',
          rows: [
            { items: ['.idch / .cekidch', 'Show channel info & copy ID'] }
          ]
        }
      },
      { messageType: 2, messageText: 'github:miuujs/baileys' }
    ],
    m
  )
}
