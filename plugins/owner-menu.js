export default async ({ sock, m }) => {
  await sock.sendRichMessage(
    m.chat,
    [
      { messageType: 2, messageText: '*Owner Commands*' },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Mode',
          rows: [
            { items: ['.self', 'Set mode to self'] },
            { items: ['.public', 'Set mode to public'] }
          ]
        }
      },
      { messageType: 2, messageText: 'github:miuujs/baileys' }
    ],
    m
  )
}
