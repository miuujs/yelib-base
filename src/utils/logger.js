import chalk from 'chalk'

class Logger {
  log(level, ...args) {
    const colors = { error: chalk.red, warn: chalk.yellow, info: chalk.green, debug: chalk.blue }
    const labels = { error: 'ERROR', warn: 'WARN', info: 'INFO', debug: 'DEBUG' }
    const color = colors[level] || colors.info
    const label = labels[level] || labels.info
    const time = new Date().toLocaleString('en-US', { timeZone: process.env.TZ || 'Asia/Jakarta' })
    const prefix = chalk.cyan(`[${time}]`) + color(` [${label}]`)
    console.log(prefix, ...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a))
  }

  error(...args) { this.log('error', ...args) }
  warn(...args) { this.log('warn', ...args) }
  info(...args) { this.log('info', ...args) }
  debug(...args) { this.log('debug', ...args) }

  print(m) {
    if (!m?.message) return
    const color = m.isGroup ? chalk.hex('#FF6B8B') : chalk.hex('#7BB0FF')
    const time = new Date().toLocaleString('en-US', { timeZone: process.env.TZ || 'Asia/Jakarta' })
    const body = m.body || '-'
    const name = m.pushName || '-'
    const num = m.sender?.split('@')[0] || '-'
    console.log(
      color('\u2500'.repeat(24)) + '\n' +
      chalk.white(time) + '\n' +
      color('| Name: ') + chalk.white(name) + '\n' +
      color('| Num:  ') + chalk.white(num) + '\n' +
      color('| Chat: ') + chalk.white(m.chat || '-') + '\n' +
      color('| Type: ') + chalk.white(m.mtype || '-') + '\n' +
      color('\\-- ') + chalk.white(body)
    )
  }
}

export default new Logger()
