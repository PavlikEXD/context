# Install
```npm install```

# Configuration:
- Copy files config/game.js.sample and config/twitch.js.sample
- Rename them to config/game.js and config/twitch.js
- Edit them with your own values
## game.js
**GAME_CONTEXT_ID**

Get from url

Example from контекстно.рф/?id=646e9232f56e9d0ad0763273 is 646e9232f56e9d0ad0763273

**CHALLENGE_TYPE**

unofficial or official

**USER_ID**

Get from Network tab in browser
Visit контекстно.рф and open Network tab in browser
Find any request and copy value of user_id parameter

## twitch.js
**username**

Your twitch username or bot username

**password**

Your twitch oauth token
Steps to get token:


First variant (simple):
- Visit https://twitchapps.com/tmi/
- Click Connect with Twitch
- Copy oauth token
- Paste it to password field

Second variant (simple):
- Visit https://twitchtokengenerator.com/
- Choice chat:read
- Click Generate Token

Third variant (hard):
- Register your own application https://dev.twitch.tv/console/apps/create
- Set name, OAuth Redirect URL (http://localhost)
- Get Client ID
- Get Client Secret
- Get code from https://id.twitch.tv/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=chat:read
- Get token from https://id.twitch.tv/oauth2/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&code=CODE&grant_type=authorization_code&redirect_uri=http://localhost
- In future you can get token from https://id.twitch.tv/oauth2/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=refresh_token&refresh_token=REFRESH_TOKEN

**channels**
Array of channels where bot will be active

# Start
node bot.js