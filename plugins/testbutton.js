export default async ({ sock, m }) => {
  await sock.sendMessage(m.chat, { text: '*Test Button: quick_reply*' })
  await sock.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'Quick Reply Button',
      footer: 'yelib-base',
      buttons: [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Click Me', id: 'clicked' }) }
      ]
    }
  })

  await sock.sendMessage(m.chat, { text: '*Test Button: cta_url*' })
  await sock.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'URL Button',
      footer: 'yelib-base',
      buttons: [
        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit GitHub', url: 'https://github.com/miuujs/yelib-base' }) }
      ]
    }
  })

  await sock.sendMessage(m.chat, { text: '*Test Button: cta_copy*' })
  await sock.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'Copy Button',
      footer: 'yelib-base',
      buttons: [
        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Code', copy_code: 'YELIB2024' }) }
      ]
    }
  })

  await sock.sendMessage(m.chat, { text: '*Test Button: single_select*' })
  await sock.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'List Menu',
      footer: 'yelib-base',
      buttons: [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Options',
            sections: [
              {
                title: 'Category',
                rows: [
                  { title: 'Option A', id: 'opt_a', description: 'First option' },
                  { title: 'Option B', id: 'opt_b', description: 'Second option' }
                ]
              }
            ]
          })
        }
      ]
    }
  })

  await sock.sendMessage(m.chat, { text: '*Test Button: call_permission_request*' })
  await sock.sendMessage(m.chat, {
    interactiveMessage: {
      title: 'Call Request Button',
      footer: 'yelib-base',
      buttons: [
        { name: 'call_permission_request', buttonParamsJson: JSON.stringify({ display_text: 'Request Call', id: 'call_req' }) }
      ]
    }
  })
}
