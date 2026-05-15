export default async ({ sock, m }) => {
  await sock.sendRichMessage(
    m.chat,
    [
      { messageType: 2, messageText: '*Group Commands*' },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Admin Tools',
          rows: [
            { items: ['.kick', 'Remove members'] },
            { items: ['.add', 'Add or invite members'] },
            { items: ['.promote', 'Promote to admin'] },
            { items: ['.demote', 'Demote from admin'] },
            { items: ['.lock', 'Lock group info'] },
            { items: ['.unlock', 'Unlock group info'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Group Settings',
          rows: [
            { items: ['.group', 'Open / close group'] },
            { items: ['.approval', 'Join approval mode'] },
            { items: ['.addmode', 'Member add mode'] },
            { items: ['.setname', 'Change group name'] },
            { items: ['.setdesc', 'Change description'] },
            { items: ['.gcpublic', 'Per-group public mode'] },
            { items: ['.antitoxic', 'Auto-flag toxic words'] },
            { items: ['.antivirtex', 'Delete virtex & >4000 char'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Info & Invites',
          rows: [
            { items: ['.link', 'Get invite link'] },
            { items: ['.revoke', 'Revoke invite link'] },
            { items: ['.info', 'Group information'] },
            { items: ['.tagall', 'Tag all members'] },
            { items: ['.hidetag', 'Hidden tag all'] },
            { items: ['.requestlist', 'Pending requests'] },
            { items: ['.approve', 'Approve requests'] },
            { items: ['.reject', 'Reject requests'] }
          ]
        }
      },
      {
        messageType: 4,
        tableMetadata: {
          title: 'Other',
          rows: [
            { items: ['.leave', 'Leave group'] }
          ]
        }
      },
      { messageType: 2, messageText: 'github:miuujs/baileys' }
    ],
    m
  )
}
