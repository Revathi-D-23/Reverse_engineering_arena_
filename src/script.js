// State Management
window.onerror = function(msg, url, line, col, error) {
    const errorDetail = error ? error.stack : msg;
    console.error('--- CRITICAL ERROR:', errorDetail);
    showToast(`System Error: ${msg}`, 'error');
    return false;
};

let currentTeamId = localStorage.getItem('teamId');
if (!currentTeamId && !window.location.pathname.includes('admin')) {
    console.warn('No teamId found, redirecting to login');
    window.location.href = '/';
}
let gameState = null;
let globalSettings = null;
let timerInterval = null;

const loadingOverlay = document.getElementById('loading-overlay');

// Global Action Handlers
window.handleStartRound1 = async () => {
    if (!gameState || !globalSettings) {
        showToast('System initializing... please wait', 'info');
        refreshStatus(false);
        return;
    }
    if (!globalSettings.r1Open) return showToast('Round is currently locked by Admin', 'error');

    if (!gameState.round1.startTime) await startRound1();
    else {
        showScreen('round1');
        initRound1();
    }
};

window.handleStartRound2 = async () => {
    if (!gameState || !globalSettings) {
        showToast('System initializing... please wait', 'info');
        refreshStatus(false);
        return;
    }
    if (!globalSettings.r2Open) return showToast('Round is currently locked by Admin', 'error');

    if (!gameState.round2.startTime) await startRound2();
    else {
        showScreen('round2');
        initRound2();
    }
};

window.handleStartRound3 = async () => {
    if (!gameState || !globalSettings) {
        showToast('System initializing... please wait', 'info');
        refreshStatus(false);
        return;
    }
    if (!globalSettings.r3Open) return showToast('Round is currently locked by Admin', 'error');

    if (!gameState.round3.startTime) await startRound3();
    else {
        showScreen('round3');
        initRound3();
    }
};

// Navigation
function showScreen(screenId) {
    console.log('--- NAVIGATION: Requesting screen:', screenId);
    
    const targetId = screenId.endsWith('-screen') ? screenId : `${screenId}-screen`;
    const target = document.getElementById(targetId);
    
    if (!target) {
        console.error('--- NAVIGATION: Screen not found:', targetId);
        showToast(`System Error: Screen ${screenId} not found`, 'error');
        return;
    }

    // Hide all sections that look like screens
    const allScreens = document.querySelectorAll('section[id$="-screen"], div[id$="-screen"]');
    console.log(`--- NAVIGATION: Hiding ${allScreens.length} screens`);
    allScreens.forEach(s => s.classList.add('hidden'));
    
    target.classList.remove('hidden');
    // Force reflow to ensure visibility change is applied
    void target.offsetWidth;
    
    console.log('--- NAVIGATION: Switched to', targetId);
}

// Attach to window for HTML onclick handlers if any
window.showScreen = showScreen;

// API Helper
async function apiFetch(url, options = {}) {
    const showLoading = options.showLoading !== false;
    if (loadingOverlay && showLoading) {
        loadingOverlay.classList.remove('hidden');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'X-Team-ID': currentTeamId
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (loadingOverlay && showLoading) {
            loadingOverlay.classList.add('hidden');
        }
        if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Request failed' }));
            showToast(errData.error || 'Request failed', 'error');
        }
        return res;
    } catch (err) {
        clearTimeout(timeoutId);
        if (loadingOverlay && showLoading) {
            loadingOverlay.classList.add('hidden');
        }
        if (err.name === 'AbortError') {
            showToast('Request timed out. Please check your connection.', 'error');
        } else {
            showToast('Network error. Please try again.', 'error');
        }
        throw err;
    }
}

// Dashboard Logic
async function refreshStatus(silent = false) {
    if (!currentTeamId) {
        console.error('--- STATUS: No team ID found in localStorage');
        return;
    }
    
    try {
        console.log('--- STATUS: Fetching for team:', currentTeamId);
        const res = await apiFetch('/api/status', { showLoading: !silent });
        if (!res.ok) {
            console.error('--- STATUS: Fetch failed with status:', res.status);
            throw new Error(`Status fetch failed: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('--- STATUS: Received data:', data);
        
        if (data.status === 'ok') {
            gameState = data.state;
            globalSettings = data.globalSettings;
            console.log('--- STATUS: Game state updated');
            const statusEl = document.getElementById('system-status');
            if (statusEl) {
                statusEl.textContent = 'System: Online';
                statusEl.classList.remove('text-blue-400/50');
                statusEl.classList.add('text-green-400');
            }
            if (!silent) showToast('System Ready', 'success');
            updateDashboard();
        } else if (data.status === 'not_started') {
            console.warn('--- STATUS: Not started, redirecting...');
            localStorage.removeItem('teamId');
            window.location.href = '/';
        }
    } catch (err) {
        console.error('--- STATUS: Error during fetch:', err);
        showToast('Connection error. Retrying...', 'error');
        setTimeout(() => refreshStatus(true), 5000);
    }
}

function updateDashboard() {
    console.log('--- DASHBOARD: Updating UI state');
    
    const r1Card = document.getElementById('card-r1');
    const r2Card = document.getElementById('card-r2');
    const r3Card = document.getElementById('card-r3');

    if (!r1Card || !r2Card || !r3Card) {
        console.warn('--- DASHBOARD: Cards not found in DOM yet');
        return;
    }

    // Define actions
    const r1Action = (e) => {
        if (e) e.stopPropagation();
        window.handleStartRound1();
    };
    const r2Action = (e) => {
        if (e) e.stopPropagation();
        window.handleStartRound2();
    };
    const r3Action = (e) => {
        if (e) e.stopPropagation();
        window.handleStartRound3();
    };

    // Lock or unlock based on global logic
    if (globalSettings) {
        if (globalSettings.r1Open) unlockRound(r1Card, 'r1-status', r1Action);
        else lockRound(r1Card, 'r1-status');

        if (globalSettings.r2Open) unlockRound(r2Card, 'r2-status', r2Action);
        else lockRound(r2Card, 'r2-status');

        if (globalSettings.r3Open) unlockRound(r3Card, 'r3-status', r3Action);
        else lockRound(r3Card, 'r3-status');
    }

    if (gameState) {
        if (gameState.round1 && gameState.round1.isCompleted) {
            markRoundCompleted('card-r1', 'r1-status', 'btn-r1', 'btn-r1-icon', 'btn-r1-text', 'blue');
        }
        if (gameState.round2 && gameState.round2.isCompleted) {
            markRoundCompleted('card-r2', 'r2-status', 'btn-r2', 'btn-r2-icon', 'btn-r2-text', 'purple');
        }
        if (gameState.round3 && gameState.round3.isCompleted) {
            markRoundCompleted('card-r3', 'r3-status', 'btn-r3', 'btn-r3-icon', 'btn-r3-text', 'pink');
        }
    }
}

function markRoundCompleted(cardId, statusId, btnId, iconId, textId, color) {
    const card = document.getElementById(cardId);
    const badge = document.getElementById(statusId);
    const btn = document.getElementById(btnId);
    const icon = document.getElementById(iconId);
    const text = document.getElementById(textId);

    const colorMap = {
        blue:   { badge: 'status-badge px-4 py-1 rounded-full text-xs font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30',   btn: 'w-full bg-blue-800/60 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-80 cursor-default' },
        purple: { badge: 'status-badge px-4 py-1 rounded-full text-xs font-bold tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30', btn: 'w-full bg-purple-800/60 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-80 cursor-default' },
        pink:   { badge: 'status-badge px-4 py-1 rounded-full text-xs font-bold tracking-widest bg-pink-500/20 text-pink-400 border border-pink-500/30',   btn: 'w-full bg-pink-800/60 py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-80 cursor-default' },
    };

    if (badge) {
        badge.textContent = 'COMPLETED ✓';
        badge.className = colorMap[color].badge;
    }
    if (btn) {
        btn.className = colorMap[color].btn;
        btn.onclick = (e) => e.stopPropagation();
    }
    if (icon) icon.classList.remove('hidden');
    if (text) text.textContent = 'COMPLETED';
    if (card) {
        card.onclick = null;
        card.classList.remove('opacity-50');
    }
}

function unlockRound(card, statusId, callback) {
    if (!card) return;
    card.classList.remove('opacity-50');
    const btn = card.querySelector('button');
    if (btn) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.onclick = (e) => {
            e.stopPropagation();
            callback();
        };
    }
    const status = document.getElementById(statusId);
    if (status) {
        status.textContent = 'UNLOCKED';
        status.className = 'status-badge px-4 py-1 rounded-full text-xs font-bold tracking-widest bg-green-500/20 text-green-400 border border-green-500/30';
    }
    card.onclick = callback;
}

function lockRound(card, statusId) {
    if (!card) return;
    card.classList.add('opacity-50');
    const btn = card.querySelector('button');
    if (btn) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.onclick = (e) => { e.stopPropagation(); };
    }
    const status = document.getElementById(statusId);
    if (status) {
        status.textContent = 'LOCKED BY ADMIN';
        status.className = 'status-badge px-4 py-1 rounded-full text-xs font-bold tracking-widest bg-red-500/20 text-red-500 border border-red-500/30';
    }
    card.onclick = null;
}

// Round 1 Logic
function initRound1() {
    try {
        const r1Challenge = document.getElementById('r1-challenge');
        if (!r1Challenge) throw new Error('Round 1 elements not found');

        if (gameState.round1 && gameState.round1.startTime) {
            r1Challenge.classList.remove('hidden');
            startTimer('timer', gameState.round1.startTime);
            updateR1UI();

            if (gameState.round1.isCompleted) {
                const probeInput = document.getElementById('probe-input');
                const probeBtn = document.getElementById('probe-btn');
                const finalInput = document.getElementById('final-answer-input');
                const finalBtn = document.getElementById('submit-final-btn');
                
                if (probeInput) probeInput.disabled = true;
                if (probeBtn) probeBtn.disabled = true;
                if (finalInput) finalInput.disabled = true;
                if (finalBtn) {
                    finalBtn.disabled = true;
                    finalBtn.textContent = 'COMPLETED';
                }
            }
        }
    } catch (err) {
        console.error('--- R1 INIT ERROR:', err);
        showToast('Failed to initialize Round 1', 'error');
    }
}

async function startRound1() {
    const res = await apiFetch('/api/start', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === 'ok') {
        gameState.round1 = data.state;
        showScreen('round1');
        initRound1();
    }
}

// Round 2 Logic
function initRound2() {
    try {
        const r2Challenge = document.getElementById('r2-challenge');
        if (!r2Challenge) throw new Error('Round 2 elements not found');

        if (gameState.round2 && gameState.round2.startTime) {
            r2Challenge.classList.remove('hidden');
            startTimer('timer-r2', gameState.round2.startTime);
            
            const viewBtn = document.getElementById('view-challenge-btn');
            if (viewBtn) {
                viewBtn.onclick = () => {
                    if (gameState.round2.assignedId) {
                        window.open(gameState.round2.assignedId, '_blank');
                    }
                };
            }

            if (gameState.round2.isCompleted) {
                const flagInput = document.getElementById('flag-input');
                const flagBtn = document.getElementById('submit-flag-btn');
                if (flagInput) flagInput.disabled = true;
                if (flagBtn) {
                    flagBtn.disabled = true;
                    flagBtn.textContent = 'COMPLETED';
                }
            }
        }
    } catch (err) {
        console.error('--- R2 INIT ERROR:', err);
        showToast('Failed to initialize Round 2', 'error');
    }
}

async function startRound2() {
    const res = await apiFetch('/api/start-round2', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === 'ok') {
        gameState.round2 = data.state;
        showScreen('round2');
        initRound2();
    }
}

// Round 3 Logic
function initRound3() {
    try {
        const r3Challenge = document.getElementById('r3-challenge');
        if (!r3Challenge) throw new Error('Round 3 elements not found');

        if (gameState.round3 && gameState.round3.startTime) {
            r3Challenge.classList.remove('hidden');
            startTimer('timer-r3', gameState.round3.startTime);
            const prodName = document.getElementById('product-name');
            if (prodName) prodName.textContent = gameState.round3.productId;

            const prodImg = document.getElementById('product-image');
            if (prodImg && gameState.round3.productId) {
                const imageMap = {
                    "Power Bank": "https://upload.wikimedia.org/wikipedia/commons/2/29/Powerbank_Anker_PowerCore_20100.jpg",
                    "Wired Headphones": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Sony_headphones.jpg",
                    "Plastic Water Bottle": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Plastic_water_bottle.jpg",
                    "Laptop Cooling Pad": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Laptop_cooler.jpg",
                    "Extension Board": "https://upload.wikimedia.org/wikipedia/commons/7/77/Power_strip_with_switch.jpg",
                    "Plastic Chair": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Monobloc_chair_%28front-right%29.jpg",
                    "Low Quality Keyboard": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Qwerty.svg",
                    "Ink Cartridge Pen": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Fountain_pen_components.jpg",
                    "LED Study Lamp": "https://upload.wikimedia.org/wikipedia/commons/6/69/Anglepoise_lamp.jpg",
                    "Wired Mouse": "https://upload.wikimedia.org/wikipedia/commons/2/22/3-Tastenmaus_Microsoft.jpg",
                    "USB Pen Drive": "https://upload.wikimedia.org/wikipedia/commons/b/b4/SanDisk-Cruzer-Micro.png",
                    "Plastic Food Container": "https://upload.wikimedia.org/wikipedia/commons/c/cd/Tupperware.jpg",
                    "Smartphone Tripod": "https://upload.wikimedia.org/wikipedia/commons/0/07/Gorillapod_in_use_with_iPhone.jpg",
                    "Food Delivery Products": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Deliveroo_cyclist_in_London.jpg"
                };
                
                prodImg.src = imageMap[gameState.round3.productId] || `https://placehold.co/600x400/162447/FFFFFF/png?text=${encodeURIComponent(gameState.round3.productId)}`;
                prodImg.classList.remove('hidden');
            }

            if (gameState.round3.isCompleted) {
                const probInput = document.getElementById('problems-input');
                const impInput = document.getElementById('improvements-input');
                const r3Btn = document.getElementById('submit-r3-btn');
                
                if (probInput) {
                    probInput.value = gameState.round3.problems;
                    probInput.disabled = true;
                }
                if (impInput) {
                    impInput.value = gameState.round3.improvements;
                    impInput.disabled = true;
                }
                if (r3Btn) {
                    r3Btn.disabled = true;
                    r3Btn.textContent = 'COMPLETED';
                }
            }
        }
    } catch (err) {
        console.error('--- R3 INIT ERROR:', err);
        showToast('Failed to initialize Round 3', 'error');
    }
}

async function startRound3() {
    const res = await apiFetch('/api/start-round3', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === 'ok') {
        gameState.round3 = data.state;
        showScreen('round3');
        initRound3();
    }
}

function startTimer(id, startTime) {
    if (timerInterval) clearInterval(timerInterval);
    const display = document.getElementById(id);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// Back Buttons
const logoutBtn = document.getElementById('participant-logout');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem('teamId');
        currentTeamId = null;
        window.location.href = '/';
    };
}

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.onclick = () => {
        if (timerInterval) clearInterval(timerInterval);
        showScreen('dashboard');
        refreshStatus();
    };
});

function formatTime(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl font-bold shadow-2xl animate-slide-up ${
        type === 'success' ? 'bg-green-600 text-white' : 
        type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Round 2 Submission
const submitFlagBtn = document.getElementById('submit-flag-btn');
if (submitFlagBtn) {
    submitFlagBtn.onclick = async () => {
        const flagEl = document.getElementById('flag-input');
        if (!flagEl) return;
        const flag = flagEl.value;
        const res = await apiFetch('/api/round2/submit', {
            method: 'POST',
            body: JSON.stringify({ flag })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'ok') {
            if (data.state.isCorrect) {
                showToast('Flag Submitted Successfully', 'success');
                showScreen('dashboard');
                refreshStatus();
            } else {
                showToast('Incorrect Flag. Try again!', 'error');
                const errEl = document.getElementById('r2-error');
                if(errEl) {
                    errEl.textContent = 'Invalid Flag. Try again.';
                    errEl.classList.remove('hidden');
                }
                const flagInput = document.getElementById('flag-input');
                if (flagInput) flagInput.value = '';
            }
        }
    };
}

// Round 3 Submission
const submitR3Btn = document.getElementById('submit-r3-btn');
if (submitR3Btn) {
    submitR3Btn.onclick = async () => {
        const probEl = document.getElementById('problems-input');
        const impEl = document.getElementById('improvements-input');
        if (!probEl || !impEl) return;
        
        const problems = probEl.value;
        const improvements = impEl.value;
        const res = await apiFetch('/api/round3/submit', {
            method: 'POST',
            body: JSON.stringify({ problems, improvements })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'ok') {
            showToast('Response Submitted', 'success');
            showScreen('dashboard');
            refreshStatus();
        }
    };
}

// Round 1 UI Update
function updateR1UI() {
    const state = gameState.round1;
    const attemptsEl = document.getElementById('attempts-count');
    if (attemptsEl) attemptsEl.textContent = state.attempts;
    
    const historyBody = document.getElementById('history-body');
    const noData = document.getElementById('no-data');
    
    if (historyBody && state.history.length > 0) {
        if (noData) noData.classList.add('hidden');
        historyBody.innerHTML = state.history.map(h => `
            <tr class="border-b border-white/5 group hover:bg-white/5 transition-colors">
                <td class="py-4 text-gray-500">#${h.attempt}</td>
                <td class="py-4 text-blue-400">${h.input}</td>
                <td class="py-4 text-purple-400">${h.output}</td>
            </tr>
        `).reverse().join('');
    }
}

// Round 1 Probe
const probeBtn = document.getElementById('probe-btn');
if (probeBtn) {
    probeBtn.onclick = async () => {
        const inputEl = document.getElementById('probe-input');
        if (!inputEl) return;
        const input = inputEl.value;
        const res = await apiFetch('/api/input', {
            method: 'POST',
            body: JSON.stringify({ input })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'ok') {
            gameState.round1 = data.state;
            updateR1UI();
            inputEl.value = '';
        }
    };
}

// Round 1 final answer submit
const submitFinalBtn = document.getElementById('submit-final-btn');
if (submitFinalBtn) {
    submitFinalBtn.onclick = async () => {
        const answerEl = document.getElementById('final-answer-input');
        if (!answerEl) return;
        const answer = answerEl.value;
        const res = await apiFetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify({ answer })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'ok') {
            showToast('Answer Submitted Successfully', 'success');
            showScreen('dashboard');
            refreshStatus();
        }
    };
}

// Document-level capture: intercept Enter key while inside Round 1 screen
// Using capture phase (true) ensures this fires BEFORE any button can receive the event.
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const round1Screen = document.getElementById('round1-screen');
    if (!round1Screen || round1Screen.classList.contains('hidden')) return;

    // We are on the round1 screen — always prevent default Enter behaviour
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const active = document.activeElement;
    if (!active) return;

    if (active.id === 'probe-input') {
        const btn = document.getElementById('probe-btn');
        if (btn && !btn.disabled) btn.onclick();   // call handler directly, not btn.click()
    } else if (active.id === 'final-answer-input') {
        const btn = document.getElementById('submit-final-btn');
        if (btn && !btn.disabled) btn.onclick();
    }
}, true); // true = capture phase

// Init
if (currentTeamId) {
    refreshStatus(true);
} else {
    console.log('--- INIT: No team ID, waiting for login');
}

// Global exports for HTML onclicks
window.startRound1 = startRound1;
window.startRound2 = startRound2;
window.startRound3 = startRound3;
window.initRound1 = initRound1;
window.initRound2 = initRound2;
window.initRound3 = initRound3;

// Safety: Hide loading overlay on window load
window.addEventListener('load', () => {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
});
