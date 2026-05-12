export default async ({ sock, m }) => {
  const text = `┌─ ❖ *Owner Menu* ❖ ─┐
│
│ ◇ *Mode*
│ ◦ .self
│ ◦ .public
│
│ ◇ *Eksekusi*
│ ◦ .exec [command]
│ ◦ .eval / .ev [code]
│
└───

┌─ ❖ *Group Menu* ❖ ─┐
│
│ ◇ *Manajemen Anggota*
│ ◦ .kick @user
│ ◦ .add 628xx
│ ◦ .promote @user
│ ◦ .demote @user
│
│ ◇ *Pengaturan Grup*
│ ◦ .group open / close
│ ◦ .approval on / off
│ ◦ .addmode all / admin
│ ◦ .lock
│ ◦ .unlock
│ ◦ .setname [nama]
│ ◦ .setdesc [deskripsi]
│ ◦ .setpp [reply media]
│
│ ◇ *Info & Tautan*
│ ◦ .info
│ ◦ .link
│ ◦ .revoke
│ ◦ .tagall [pesan]
│ ◦ .hidetag [pesan]
│
│ ◇ *Permintaan Bergabung*
│ ◦ .requestlist
│ ◦ .approve
│ ◦ .reject
│
│ ◇ *Lainnya*
│ ◦ .leave
│
└───

┌─ ❖ *Download Menu* ❖ ─┐
│
│ ◇ *Media Downloader*
│ ◦ .tiktok / .tt [url]
│ ◦ .ig [url]
│ ◦ .fb [url]
│ ◦ .twitter [url]
│ ◦ .yt [url]
│
│ ◇ *Audio & File*
│ ◦ .play [judul / url]
│ ◦ .spotify [url]
│
└───

┌─ ❖ *Tools & Utility* ❖ ─┐
│
│ ◇ *Web*
│ ◦ .get [url]
│
│ ◇ *Media*
│ ◦ .sticker / .s [reply media / caption]
│
│ ◇ *Channel*
│ ◦ .idch / .cekidch
│ ◦ .upch [reply audio]
│
└───`

  await sock.sendMessage(m.chat, { text }, { quoted: m })
}
