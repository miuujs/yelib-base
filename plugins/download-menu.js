export default async ({ sock, m }) => {
  await sock.sendRichMessage(
    m.chat,
    [
      { messageType: 2, messageText: '*Download Commands*' },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Media Downloaders',
          rows: [
            { items: ['.tiktok', 'Download TikTok video (no watermark)'] },
            { items: ['.ig', 'Download Instagram post'] },
            { items: ['.fb', 'Download Facebook video'] },
            { items: ['.twitter', 'Download Twitter/X video'] },
            { items: ['.yt', 'Download YouTube video/audio'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Audio & Files',
          rows: [
            { items: ['.play', 'Play YouTube audio by search/URL'] },
            { items: ['.spotify', 'Download track / browse playlist'] }
          ]
        }
      },
      { messageType: 2, messageText: 'github:miuujs/baileys' }
    ],
    m
  )
}
