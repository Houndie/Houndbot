# README

## Install Instructions

### Prequsites

This bot uses node.js, so please install that first.

This bot uses two API's that need to be installed:
- [The Turntable Bot API](https://github.com/alaingilbert/Turntable-API)
- [The Sqlite3 API](https://github.com/developmentseed/node-sqlite3)

Make sure you follow all installation instructions.  It is useful if you have them both installed into the same folder, if you're not using npm (The author of this bot did not use npm, so he's not very familiar with the procedure)

### Installing the Bot

After installing these API's, git the source for the bot.  Rename example-keys.js to keys.js, and fill out the relevant information:

__AUTH, USERID, ROOMID:__  Can be determined with this applet:  alaingilbert.github.com/Turntable-API/bookmarklet.html
__DATABASE_LOC:__  The absolute path to an sqlite3 database.
__NODE_LOC:__  The location of the two above apis.

The bot can be run with:

    node swingbot.js
