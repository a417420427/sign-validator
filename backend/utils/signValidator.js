const crypto = require('crypto');
const qs = require('qs');

const ACCESS_SECRET = 'your-access-secret';
const SIMPLE_SIGN_MODE = true;
const REPLAY_CHECK = true;

function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

function validateTimestamp(timestamp) {
    if (!timestamp || isNaN(timestamp)) throw new Error('无效的时间戳');
    const now = Date.now();
    const drift = Math.abs(now - Number(timestamp));
    if (drift > 5 * 60 * 1000) throw new Error('时间戳过期');
}

function validateSignature(req) {
    const headers = req.headers;
    const timestamp = headers['x-open-timestamp'];
    validateTimestamp(timestamp);
    console.log(req.body, 'rr')
    const appId = headers['x-open-appid'];
    if (!appId) return { valid: false, error: '缺少 x-open-appId' };

    const nonceStr = headers['x-open-noncestr'] || '';
    if (REPLAY_CHECK && !nonceStr) return { valid: false, error: '缺少 x-open-nonceStr' };

    const sign = headers['x-open-sign'];
    const signMode = headers['x-open-sign-mode'] || '';
   
    let signBaseString = '';
    if (SIMPLE_SIGN_MODE && signMode === 'simple') {
        signBaseString = '';
    } else if (req.method === 'GET') {
        signBaseString = qs.stringify(req.query, { encode: false });
    } else if (typeof req.body === 'object') {
        signBaseString = qs.stringify(req.body, { encode: false });
    } else {
        signBaseString = req.body || '';
    }

    console.log('signBaseString:', signBaseString)
    console.log('timestamp:', timestamp)
    console.log('nonceStr:', nonceStr)
    console.log('ACCESS_SECRET:', ACCESS_SECRET)

    const expectedSign = md5(signBaseString + timestamp + nonceStr + ACCESS_SECRET);

    console.log('expectedSign:' , expectedSign )
    return {
        valid: sign === expectedSign,
        error: sign !== expectedSign ? '签名不匹配' : null
    };
}

module.exports = { validateSignature };
