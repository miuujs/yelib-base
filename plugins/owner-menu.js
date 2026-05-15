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
            { items: ['.self', 'Set bot to self mode'] },
            { items: ['.public', 'Set bot to public mode'] },
            { items: ['.anticall', 'Auto-reject incoming calls'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Execution',
          rows: [
            { items: ['$', 'Execute shell command'] },
            { items: ['> / =>', 'Eval JavaScript'] },
            { items: ['.getpl', 'Get plugin source code'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Media',
          rows: [
            { items: ['.rvo', 'Read view-once media'] },
            { items: ['.swgc / .statusgroup', 'Post group status'] },
            { items: ['.upch', 'Upload audio to channel'] }
          ]
        }
      },
      { messageType: 2, messageText: 'github:miuujs/baileys' }
    ],
    m
  )
}
