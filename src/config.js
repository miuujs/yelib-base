import * as bail from 'baileys'
import chalk from 'chalk'

const parseList = (str) => str.split(',').map(s => s.trim()).filter(Boolean)

global.owner = {
  numbers: parseList('6283891882373'),
  name: 'miuujs'
}

global.set = {
  prefix: parseList('.,!,/,#,-,+,;,~,&,%'),
  self: true,
  noprefix: true
}

global.pair = {
  no: '6283891882373',
  isPair: true,
  sesi: 'session'
}

global.sticker = {
  pack: 'yelib-base',
  author: 'yelib'
}

global.bail = bail
global.chalk = chalk
global.start = Date.now()

