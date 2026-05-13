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
            { items: ['.get', 'Fetch & inspect web page'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Media Tools',
          rows: [
            { items: ['.sticker / .s', 'Convert image/video to sticker'] },
            { items: ['.toimg / .toimage', 'Convert sticker to image'] }
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
