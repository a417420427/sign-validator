// backend/server.js
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const { validateSignature } = require('./utils/signValidator');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/verify', (req, res) => {
    try {
        const result = validateSignature(req);
        if (!result.valid) {
            return res.status(401).json({ error: result.error });
        }
        res.json({ message: '签名验证成功！' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log('Backend listening on http://localhost:3001');
});
