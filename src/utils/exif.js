import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync, unlinkSync, existsSync, promises as fsp } from 'fs'
import { join } from 'path'
import ff from 'fluent-ffmpeg'
import webp from 'node-webpmux'

const temp = process.platform === 'win32' ? process.env.TEMP : tmpdir()

export async function imageToWebp(media) {
  const tmpFileIn = join(temp, randomBytes(6).readUIntLE(0, 6).toString(36) + '.' + (media?.ext || 'png'))
  const tmpFileOut = join(temp, randomBytes(6).readUIntLE(0, 6).toString(36) + '.webp')

  writeFileSync(tmpFileIn, media.data)

  try {
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf',
          "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease, pad=512:512:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=000000 [p]; [b][p] paletteuse",
        ])
        .toFormat('webp')
        .saveToFile(tmpFileOut)
    })

    await fsp.unlink(tmpFileIn)
    const buff = readFileSync(tmpFileOut)
    await fsp.unlink(tmpFileOut)
    return buff
  } catch (e) {
    if (existsSync(tmpFileIn)) await fsp.unlink(tmpFileIn).catch(() => {})
    if (existsSync(tmpFileOut)) await fsp.unlink(tmpFileOut).catch(() => {})
    throw e
  }
}

export async function videoToWebp(media) {
  const tmpFileIn = join(temp, randomBytes(6).readUIntLE(0, 6).toString(36) + '.' + (media?.ext || 'mp4'))
  const tmpFileOut = join(temp, randomBytes(6).readUIntLE(0, 6).toString(36) + '.webp')

  writeFileSync(tmpFileIn, media.data)

  try {
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf',
          "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease, pad=512:512:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=000000 [p]; [b][p] paletteuse",
          '-loop', '0',
          '-ss', '00:00:00',
          '-t', '00:00:05',
          '-preset', 'default',
          '-an',
          '-vsync', '0',
        ])
        .toFormat('webp')
        .saveToFile(tmpFileOut)
    })

    await fsp.unlink(tmpFileIn)
    const buff = readFileSync(tmpFileOut)
    await fsp.unlink(tmpFileOut)
    return buff
  } catch (e) {
    if (existsSync(tmpFileIn)) await fsp.unlink(tmpFileIn).catch(() => {})
    if (existsSync(tmpFileOut)) await fsp.unlink(tmpFileOut).catch(() => {})
    throw e
  }
}

export async function writeExif(media, metadata) {
  let wMedia = /webp/.test(media.mimetype) ? media.data
    : /image/.test(media.mimetype) ? await imageToWebp(media)
    : /video/.test(media.mimetype) ? await videoToWebp(media)
    : ''

  if (metadata && Object.keys(metadata).length !== 0) {
    const img = new webp.Image()
    const json = {
      'sticker-pack-id': metadata?.packId || 'yelib-' + Date.now(),
      'sticker-pack-name': metadata?.packName || '',
      'sticker-pack-publisher': metadata?.packPublish || '',
      'android-app-store-link': metadata?.androidApp || '',
      'ios-app-store-link': metadata?.iOSApp || '',
      emojis: metadata?.emojis || ['😋', '😎', '🤣', '😂', '😁'],
      'is-avatar-sticker': metadata?.isAvatar || 0,
    }
    const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    await img.load(wMedia)
    img.exif = exif
    return await img.save(null)
  }
}
