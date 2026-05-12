export default async ({ sock, m }) => {
  await sock.sendMessage(m.chat, { text: '*Test Rich: sendTable*' })
  await sock.sendTable(
    m.chat,
    'Language Comparison',
    ['Feature', 'Java', 'JavaScript'],
    [
      ['Type', 'Compiled', 'Interpreted'],
      ['Typing', 'Static', 'Dynamic'],
      ['Main Use', 'Enterprise', 'Web/Full-stack']
    ],
    m,
    { headerText: 'Comparison:', footer: 'yelib' }
  )

  await sock.sendMessage(m.chat, { text: '*Test Rich: sendList*' })
  await sock.sendList(
    m.chat,
    'Bot Info',
    [
      ['Name', 'yelib-base'],
      ['Version', '1.0.0'],
      ['Based on', 'Baileys']
    ],
    m,
    { footer: 'yelib' }
  )

  await sock.sendMessage(m.chat, { text: '*Test Rich: sendCodeBlock*' })
  await sock.sendCodeBlock(
    m.chat,
    `function hello(name) {
  return "Hello " + name
}
hello("World")`,
    m,
    { language: 'javascript', title: 'Example Code', footer: 'yelib' }
  )

  await sock.sendMessage(m.chat, { text: '*Test Rich: sendCodeBlockV2*' })
  await sock.sendCodeBlockV2(
    m.chat,
    `package main
import "fmt"
func main() {
    fmt.Println("Hello, World!")
}`,
    m,
    { language: 'go', title: 'Go Example', text: 'A simple Go program:', footer: 'yelib' }
  )

  await sock.sendMessage(m.chat, { text: '*Test Rich: sendLink*' })
  await sock.sendLink(
    m.chat,
    'Results:\nLink 1: {{IE_0}}click here{{/IE_0}}\nLink 2: {{IE_1}}click here{{/IE_1}}',
    ['https://github.com/miuujs/yelib-base', 'https://github.com/miuujs/baileys'],
    m,
    {
      headerText: 'Search Results',
      footer: 'yelib',
      citations: [
        { sourceTitle: 'yelib-base', citationNumber: 1 },
        { sourceTitle: 'baileys', citationNumber: 2 }
      ]
    }
  )
}
