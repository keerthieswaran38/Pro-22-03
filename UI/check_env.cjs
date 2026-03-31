const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');

lines.forEach(line => {
    if (line.includes('CCAV_')) {
        const [key, val] = line.split('=');
        if (val) {
            console.log(`${key}: [${val.trim()}] (Length: ${val.trim().length})`);
            console.log('Hex:', Buffer.from(val.trim()).toString('hex'));
        }
    }
});
