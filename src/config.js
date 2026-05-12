import 'dotenv/config'
import * as bail from 'baileys'
import chalk from 'chalk'
import logger from './utils/logger.js'

const required = ['PAIRNO']
for (const key of required) {
  if (!process.env[key]) {
    logger.error('Missing required environment variable: ' + key)
    process.exit(1)
  }
}

const parseList = (str) => str.split(',').map(s => s.trim()).filter(Boolean)

global.owner = {
  numbers: parseList(process.env.OWNERS || process.env.PAIRNO),
  name: process.env.OWNER || 'miuujs'
}

global.set = {
  prefix: parseList(process.env.PREFIX || '.,!,/,#,$,-,+,;,~,&,%'),
  self: process.env.MODE !== 'public',
  noprefix: process.env.NOPREFIX !== 'false'
}

global.pair = {
  no: process.env.PAIRNO,
  isPair: process.env.PAIRCODE !== 'false',
  sesi: process.env.SESSION || 'session'
}

global.sticker = {
  pack: process.env.PACK || 'yelib-base',
  author: process.env.AUTHOR || 'yelib'
}

global.bail = bail
global.chalk = chalk
global.start = Date.now()

logger.info('Config loaded | Mode: ' + (set.self ? 'Self' : 'Public') + ' | Noprefix: ' + set.noprefix + ' | Prefix: ' + set.prefix.join(', '))
