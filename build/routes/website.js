import express from "express";
const app = express();
const port = 80;
import fs from 'fs';
import axios from 'axios';
import DiscordOAuth2 from 'discord-oauth2';
const oauth = new DiscordOAuth2();
import functions from "../utilities/structs/functions.js";
import Safety from "../utilities/safety.js";

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const authorizeUrl = `https://discord.com/oauth2/authorize?client_id=${Safety.env.client_id}&redirect_uri=${encodeURIComponent(Safety.env.AUTH_URL)}&response_type=code&scope=identify`;
    res.render('index', { authorizeUrl  });
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await oauth.tokenRequest({
            clientId: Safety.env.CLIENT_ID,
            clientSecret: Safety.env.CLIENT_SECRET,
            code,
            scope: ['identify'], // Match the scopes used in the initial authorization request
            grantType: 'authorization_code',
            redirectUri: Safety.env.AUTH_URL,
        });

        const { access_token } = tokenResponse;

        const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        const { id } = userResponse.data;

        res.render('profile', { id });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.post('/register', (req, res) => {
    const { email, username, password, discordId } = req.body;
    functions.registerUser(discordId, username, email, password, false).then(response => {
        if (response.status == 200)
        {
            res.render('success', { username: username});
        }
        else
        {
            res.render('error', { error: response.message });
        }
      })
});


app.listen(port, () => {
    console.log(`http://localhost:${port} Register Website`);
});

export default app;