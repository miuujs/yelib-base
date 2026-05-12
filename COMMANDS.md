# Command Reference

## Main

| Command       | Description          |
|---------------|----------------------|
| .menu         | Show main menu       |
| .groupmenu    | Show group commands  |
| .self         | Enable self mode     |
| .public       | Enable public mode   |

## Admin Tools

| Command       | Description              |
|---------------|--------------------------|
| .kick         | Remove members           |
| .add          | Add or invite members    |
| .promote      | Promote to admin         |
| .demote       | Demote from admin        |
| .lock         | Lock group info          |
| .unlock       | Unlock group info        |

## Group Settings

| Command       | Description              |
|---------------|--------------------------|
| .group open   | Open group (all send)    |
| .group close  | Close group (admins only)|
| .approval     | Toggle join approval     |
| .addmode      | Set member add mode      |
| .setname      | Change group name        |
| .setdesc      | Change group description |
| .setpp        | Change group icon        |

## Info & Invites

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

## Other

| Command       | Description              |
|---------------|--------------------------|
| .leave        | Leave group              |

## Plugin Development

Create a file in `plugins/` named after your command:

```js
export default async ({ sock, m, args, isOwner, isGroup }) => {
  // your code here
}
```

Prefix the filename with `group-` to restrict the command to groups and automatically register an alias without the prefix (e.g. `group-kick.js` registers `.kick`).
