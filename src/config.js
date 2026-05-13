import * as bail from 'baileys'
import chalk from 'chalk'

const parseList = (str) => str.split(',').map(s => s.trim()).filter(Boolean)

global.owner = {
  numbers: parseList(process.env.OWNERS || process.env.PAIRNO || '6283891882373'),
  name: process.env.OWNER || 'miuujs'
}

global.set = {
  prefix: parseList(process.env.PREFIX || '.,!,/,#,$,-,+,;,~,&,%'),
  self: process.env.MODE !== 'public',
  noprefix: process.env.NOPREFIX !== 'false'
}

global.pair = {
  no: process.env.PAIRNO || '6283891882373',
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

