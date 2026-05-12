# yelib-base

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-v7-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/reiwabyte/yelib-base/pulls)

WhatsApp bot built on Baileys with modular plugin system, group management, and interactive rich message menus.

---

## Features

- Modular plugin architecture -- each command is a standalone file
- Multi-prefix support (`.`, `!`, `/`, `#`, `$`, `-`, `+`, `;`, `~`, `&`, `%`)
- No-prefix mode for natural command input
- Self/Public mode toggle
- Pairing code authentication
- Interactive rich message menus (tables, lists)
- Auto-session management with corruption recovery
- Memory-aware auto-restart
- Group administration tools

---

## Prerequisites

- Node.js 18+
- npm

---

## Installation

```bash
git clone https://github.com/reiwabyte/yelib-base.git
cd yelib-base
npm install
cp .env.example .env
```

Edit `.env` with your WhatsApp number:

```env
PAIRNO=6281234567890
```

---

## Environment Variables

| Variable    | Description                          | Default                        |
|-------------|--------------------------------------|--------------------------------|
| PAIRNO      | Phone number for pairing             | (required)                     |
| PAIRCODE    | Enable pairing code                  | true                           |
| SESSION     | Session folder name                  | session                        |
| MODE        | Bot mode (self/public)               | self                           |
| PREFIX      | Command prefixes (comma-separated)   | .,!,/,#,$,-,+,;,~,&,%         |
| NOPREFIX    | Enable commands without prefix       | true                           |
| OWNERS      | Owner numbers (comma-separated)      | (same as PAIRNO)               |
| OWNER       | Owner display name                   | miuujs                         |
| PACK        | Sticker pack name                    | yelib-base                     |
| AUTHOR      | Sticker author name                  | yelib                          |
| TZ          | Timezone                             | Asia/Jakarta                   |

---

## Usage

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

---

## Command Reference

### Main

| Command       | Description          |
|---------------|----------------------|
| .menu         | Show main menu       |
| .groupmenu    | Show group commands  |
| .self         | Enable self mode     |
| .public       | Enable public mode   |

### Admin Tools

| Command       | Description              |
|---------------|--------------------------|
| .kick         | Remove members           |
| .add          | Add or invite members    |
| .promote      | Promote to admin         |
| .demote       | Demote from admin        |
| .lock         | Lock group info          |
| .unlock       | Unlock group info        |

### Group Settings

| Command       | Description              |
|---------------|--------------------------|
| .group open   | Open group (all send)    |
| .group close  | Close group (admins only)|
| .approval     | Toggle join approval     |
| .addmode      | Set member add mode      |
| .setname      | Change group name        |
| .setdesc      | Change group description |
| .setpp        | Change group icon        |

### Info & Invites

| Command       | Description              |
|---------------|--------------------------|
| .link         | Get invite link          |
| .revoke       | Revoke invite link       |
| .info         | Show group information   |
| .tagall       | Tag all members          |
| .hidetag      | Hidden tag all           |
| .requestlist  | List pending requests    |
| .approve      | Approve join requests    |
| .reject       | Reject join requests     |

### Other

| Command       | Description              |
|---------------|--------------------------|
| .leave        | Leave group              |

---

## Project Structure

```
yelib-base/
  index.js              Entry point
  plugins/              Command plugins (one file per command)
    menu.js
    group-menu.js
    self.js
    public.js
    group-kick.js
    group-add.js
    ...
  src/
    config.js           Global configuration
    utils/
      handler.js        Message handler (smsg)
      reply.js          Ad reply formatter
      logger.js         Logging utility
      tools.js          Helper functions
      tmp.js            Temp file manager
  media/                Assets (banner, thumbnails)
  session/              Auth session data (gitignored)
  tmp/                  Temp files (auto-cleaned)
```

---

## Extending

Create a new file in `plugins/` named after the command:

```js
export default async ({ sock, m, args, isOwner, isGroup }) => {
  // your logic here
}
```

The plugin loads automatically. For group-only plugins, prefix with `group-` to enable `.command` alias.

---

## License

[MIT](LICENSE)

---

## Code of Conduct

This project follows a standard code of conduct. By participating, you agree to maintain a respectful and harassment-free environment for everyone.

- Use inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community

Violations may result in temporary or permanent exclusion from the project.

---

## Disclaimer

This project is not affiliated with or endorsed by WhatsApp. Use at your own discretion.
