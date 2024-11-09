const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

// Folder path to player data
const playerFolder = 'C:\\Users\\Administrator\\Downloads\\WinSrc\\x64\\core\\database\\players';

app.use(compression({
    level: 9,
    threshold: 0,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Route to handle login
app.post('/player/login/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/html/dashboard.html');
});

// Function to read all players from the folder
function getPlayerData() {
    const players = [];

    // Read the folder
    const files = fs.readdirSync(playerFolder);
    files.forEach(file => {
        const filePath = path.join(playerFolder, file);

        // Read and parse each player file
        const data = fs.readFileSync(filePath, 'utf8');
        const player = JSON.parse(data);

        // Extract growId and password
        if (player.growId && player.password) {
            players.push({
                growId: player.growId,
                password: player.password
            });
        }
    });

    return players;
}

// Route to validate player login
app.all('/player/growid/login/validate', (req, res) => {
    const { _token, growId, password } = req.body;

    const players = getPlayerData();
    const player = players.find(p => p.growId === growId && p.password === password);

    if (player) {
        const token = Buffer.from(
            `_token=${_token}&growId=${growId}&password=${password}`
        ).toString('base64');

        res.send(
            `{"status":"success","message":"Account Validated.","token":"${token}","url":"","accountType":"growtopia"}`
        );
    } else {
        res.status(401).send(`{"status":"error","message":"Invalid GrowID or password."}`);
    }
});

app.post('/player/validate/close', function (req, res) {
    res.send('<script>window.close();</script>');
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(5000, function () {
    console.log('Listening on port 5000');
});
