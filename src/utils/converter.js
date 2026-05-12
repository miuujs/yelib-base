import { promises } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  try {
    const tmp = join(process.cwd(), 'tmp', Date.now() + '.' + ext)
    const out = tmp + '.' + ext2

    await promises.mkdir(join(process.cwd(), 'tmp'), { recursive: true })
    await promises.writeFile(tmp, buffer)

    await new Promise((resolve, reject) => {
      spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
        .on('error', reject)
        .on('close', (code) => {
          if (code !== 0) reject(new Error(`FFmpeg exited with code ${code}`))
          else resolve()
        })
    })

    const data = await promises.readFile(out)
    await promises.unlink(out).catch(() => {})

    return {
      data,
      filename: out,
      delete() { return promises.unlink(out).catch(() => {}) },
    }
  } finally {
    await promises.unlink(tmp).catch(() => {})
  }
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'], ext, 'ogg')
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, ['-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', '-f', 'mp3'], ext, 'mp3')
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4')
}

export { toAudio, toPTT, toVideo, ffmpeg }
