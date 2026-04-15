const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'challenges');
const files = fs.readdirSync(dir);

for (const file of files) {
    if (file.endsWith('.html')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        
        let changed = false;
        if (content.includes("headers: { 'Content-Type': 'application/json' },")) {
            content = content.replace(
                "headers: { 'Content-Type': 'application/json' },",
                "headers: { 'Content-Type': 'application/json', 'X-Team-ID': localStorage.getItem('teamId') },"
            );
            changed = true;
        }

        // Just in case it's written differently in some files:
        if (content.includes("headers: { 'Content-type': 'application/json' },")) {
             content = content.replace(
                "headers: { 'Content-type': 'application/json' },",
                "headers: { 'Content-Type': 'application/json', 'X-Team-ID': localStorage.getItem('teamId') },"
            );
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${file}`);
        }
    }
}
