const https = require('https');

const wikiMap = {
  "Power Bank": "Power_bank",
  "Wired Headphones": "Headphones",
  "Plastic Water Bottle": "Water_bottle",
  "Laptop Cooling Pad": "Laptop_cooler",
  "Extension Board": "Power_strip",
  "Plastic Chair": "Monobloc_chair",
  "Low Quality Keyboard": "Computer_keyboard",
  "Ink Cartridge Pen": "Fountain_pen",
  "LED Study Lamp": "Desk_lamp",
  "Wired Mouse": "Computer_mouse",
  "USB Pen Drive": "USB_flash_drive",
  "Plastic Food Container": "Food_storage_container",
  "Smartphone Tripod": "Tripod_(photography)",
  "Food Delivery Products": "Food_delivery"
};

const results = {};
let pending = Object.keys(wikiMap).length;

for (const [key, article] of Object.entries(wikiMap)) {
    https.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${article}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                results[key] = data.thumbnail ? data.thumbnail.source : `https://placehold.co/600x400/162447/FFFFFF/png?text=${encodeURIComponent(key)}`;
            } catch (e) {
                results[key] = `https://placehold.co/600x400/162447/FFFFFF/png?text=${encodeURIComponent(key)}`;
            }
            pending--;
            if (pending === 0) {
                console.log("const imageMap = ", JSON.stringify(results, null, 4) + ";");
            }
        });
    });
}
