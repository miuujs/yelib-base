import 'dotenv/config'
import * as bail from 'baileys'
import chalk from 'chalk'
import logger from './utils/logger.js'

const required = ['PAIR_NO']
for (const key of required) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`)
    process.exit(1)
  }
}

const parseList = (str) => str.split(',').map(s => s.trim()).filter(Boolean)

global.owner = {
  numbers: parseList(process.env.OWNER_NUMBERS || process.env.PAIR_NO),
  name: process.env.OWNER_NAME || 'Owner'
}

global.set = {
  prefix: parseList(process.env.PREFIX || '.'),
  self: (process.env.BOT_MODE || 'public') === 'self'
}

global.pair = {
  no: process.env.PAIR_NO,
  isPair: process.env.PAIR_ISPAIR !== 'false',
  sesi: process.env.SESSION_DIR || 'session'
}

global.sticker = {
  pack: process.env.STICKER_PACK || 'yelib-base',
  author: process.env.STICKER_AUTHOR || 'yelib'
}

global.bail = bail
global.chalk = chalk
global.start = Date.now()

logger.info('Configuration loaded')
logger.info(`Mode: ${set.self ? 'Self' : 'Public'}`)
logger.info(`Prefix: ${set.prefix.join(', ')}`)
logger.info(`Pairing: ${pair.isPair ? 'Code' : 'QR'}`)
logger.info(`Owner: ${owner.numbers.join(', ')}`)
