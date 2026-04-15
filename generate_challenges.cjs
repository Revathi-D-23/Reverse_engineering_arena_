const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'challenges');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper to generate base HTML structure
const layout = (id, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Treasure Hunt | Challenge ${id}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Poppins', sans-serif; background-color: #000; color: #fff; overflow-x: hidden; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .neon-text { text-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="glass w-full max-w-2xl p-8 rounded-3xl text-center shadow-2xl">
        <div class="mb-8">
            <h1 class="text-4xl font-black tracking-tighter neon-text mb-2">CHALLENGE _${id.toString().padStart(2, '0')}</h1>
            <p class="text-gray-400 font-bold tracking-widest text-xs uppercase">Find the hidden flag</p>
        </div>
        
        <div class="bg-black/50 p-6 rounded-2xl border border-white/5 mb-8 relative">
            ${content}
        </div>
        
        <div class="text-left bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
            <p class="text-sm text-blue-400 font-mono flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Hint: Check the source, console, network, or inspect elements. You must submit your flag back in the main dashboard.
            </p>
        </div>
    </div>
</body>
</html>
`;

const challenges = [
  { id: 1, flag: "flag{b4s1c_c0nn3ct}", content: `<!-- Did you check the source code properly? flag{b4s1c_c0nn3ct} --><p class="text-xl">Nothing to see here...</p>` },
  { id: 2, flag: "flag{c0ns0l3_h4ck3r}", content: `<p class="text-xl">The developer left some logs behind.</p><script>console.log("Debug mode enabled. Flag: flag{c0ns0l3_h4ck3r}");</script>` },
  { id: 3, flag: "flag{styl3_1nj3ct}", content: `<p class="text-xl">Sometimes things are invisible.</p><div style="display:none;" id="secret">flag{styl3_1nj3ct}</div>` },
  { id: 4, flag: "flag{b4s3_s1xty_f0ur}", content: `<p class="text-xl">Decode this message: <span class="bg-black/60 p-2 font-mono text-xs rounded text-gray-500">ZmxhZ3tiNHMzX3MxeHR5X2YwdXJ9</span></p>` },
  { id: 5, flag: "flag{cl1ck_t0_sh0w}", content: `<p class="text-xl">Patience is key.</p><button onclick="document.getElementById('r').innerText='flag{cl1ck_t0_sh0w}'" class="mt-4 bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors text-xs font-bold">CLICK ME</button><div id="r" class="mt-4 font-mono text-green-400"></div>` },
  { id: 6, flag: "flag{n3tw0rk_r3sp}", content: `<p class="text-xl">Inspect the network tab.</p><script>fetch(window.location.href, { headers: { 'X-Secret-Flag': 'flag{n3tw0rk_r3sp}' } });</script>` },
  { id: 7, flag: "flag{w1nd0w_gl0b4l}", content: `<p class="text-xl">The window sees all.</p><script>window.secretFlag = "flag{w1nd0w_gl0b4l}";</script>` },
  { id: 8, flag: "flag{d0m_4ttr1but3s}", content: `<div data-flag="flag{d0m_4ttr1but3s}"><p class="text-xl">Inspect my attributes.</p></div>` },
  { id: 9, flag: "flag{r0s3s_4r3_r3d}", content: `<style>.hidden-flag::after { content: 'flag{r0s3s_4r3_r3d}'; display: none; }</style><p class="text-xl hidden-flag">Roses are red, violets are blue, the flag is hidden from you.</p>` },
  { id: 10, flag: "flag{l0c4l_st0r4g3}", content: `<p class="text-xl">It's in your storage.</p><script>localStorage.setItem('bonus_flag', 'flag{l0c4l_st0r4g3}');</script>` },
  { id: 11, flag: "flag{c00k13_m0nst3r}", content: `<p class="text-xl">Have a cookie.</p><script>document.cookie = "flag=flag{c00k13_m0nst3r}";</script>` },
  { id: 12, flag: "flag{h3xdump_m4st3r}", content: `<p class="text-xl">Hexadecimal conversion required.</p><p class="font-mono mt-4 text-xs text-gray-500">66 6c 61 67 7b 68 33 78 64 75 6d 70 5f 6d 34 73 74 33 72 7d</p>` },
  { id: 13, flag: "flag{c0l0r_bl1nd}", content: `<p class="text-xl">Can you read this?</p><p style="color: #1a1a1a; background-color: #1a1a1a;" class="mt-4 font-mono">flag{c0l0r_bl1nd}</p>` },
  { id: 14, flag: "flag{v4r14bl3_m4th}", content: `<p class="text-xl">Math is fun.</p><script>var a = "flag{v4r14b"; var b = "l3_m4th}"; console.log(a);</script>` },
  { id: 15, flag: "flag{b1n4ry_0110}", content: `<p class="text-xl">01100110 01101100 01100001 01100111 01111011 01100010 01100001 01110011 01100101 01111111 01101110 01100101 01111101</p><!-- hint: the flag format applies (flag{something}) -->` }
];

challenges.forEach(ch => {
  const filePath = path.join(outDir, `ch${ch.id}.html`);
  fs.writeFileSync(filePath, layout(ch.id, ch.content));
});

console.log("Successfully generated all 15 challenge files.");
