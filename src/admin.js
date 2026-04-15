// State
let allTeams = [];
let filteredTeams = [];
let currentView = 'dashboard';
let selectedTeamId = null;
let updateInterval = null;

// DOM Elements
const tableBody = document.getElementById('teams-table-body');
const noDataMsg = document.getElementById('no-data-msg');
const searchInput = document.getElementById('search-team');
const filterSelect = document.getElementById('filter-round');
const detailsModal = document.getElementById('details-modal');
const toast = document.getElementById('toast');

// Stats Elements
const statTotal = document.getElementById('stat-total-teams');
const statActive = document.getElementById('stat-active-teams');
const statCompleted = document.getElementById('stat-completed-teams');
const statAvgTime = document.getElementById('stat-avg-time');

// Fetch Data
async function fetchData() {
    try {
        const [logsRes, settingsRes] = await Promise.all([
            fetch('/api/admin/logs'),
            fetch('/api/admin/settings')
        ]);
        
        if (!logsRes.ok || !settingsRes.ok) throw new Error('Failed to fetch data');
        
        allTeams = await logsRes.json();
        const settings = await settingsRes.json();
        
        applyFilters();
        updateStats();
        updateLockToggles(settings);
        // Keep score team selector in sync
        if (currentView === 'scores') populateScoreTeamSelector();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Lock Toggles
function updateLockToggles(settings) {
    const r1Btn = document.getElementById('toggle-r1');
    const r2Btn = document.getElementById('toggle-r2');
    const r3Btn = document.getElementById('toggle-r3');

    const updateBtn = (btn, isOpen, roundStr) => {
        if (!btn) return;
        if (isOpen) {
            btn.textContent = `OPEN: ${roundStr}`;
            btn.className = 'px-6 py-4 rounded-xl border-2 font-bold w-1/3 transition-all border-green-500 text-green-500 hover:bg-green-500/20';
        } else {
            btn.textContent = `LOCKED: ${roundStr}`;
            btn.className = 'px-6 py-4 rounded-xl border-2 font-bold w-1/3 transition-all border-red-500 text-red-500 hover:bg-red-500/20';
        }
    };

    updateBtn(r1Btn, settings.r1Open, 'ROUND 1');
    updateBtn(r2Btn, settings.r2Open, 'ROUND 2');
    updateBtn(r3Btn, settings.r3Open, 'ROUND 3');
}

async function toggleRound(round, isOpen) {
    try {
        const res = await fetch('/api/admin/toggle-round', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round, isOpen })
        });
        if (!res.ok) throw new Error('Failed to toggle round');
        const data = await res.json();
        updateLockToggles(data.globalSettings);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

document.getElementById('toggle-r1').onclick = function() { toggleRound('r1', this.textContent.includes('LOCKED')); };
document.getElementById('toggle-r2').onclick = function() { toggleRound('r2', this.textContent.includes('LOCKED')); };
document.getElementById('toggle-r3').onclick = function() { toggleRound('r3', this.textContent.includes('LOCKED')); };

// Apply Filters & Search
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    filteredTeams = allTeams.filter(t => {
        const matchesSearch = t.teamId.toLowerCase().includes(searchTerm);
        
        let matchesFilter = true;
        if (filterValue === 'r1') matchesFilter = !t.round1.isCompleted && t.round1.timeTaken !== null;
        if (filterValue === 'r2') matchesFilter = !t.round2.isCompleted && t.round2.timeTaken !== null;
        if (filterValue === 'r3') matchesFilter = !t.round3.isCompleted && t.round3.timeTaken !== null;
        if (filterValue === 'completed') matchesFilter = t.round1.isCompleted && t.round2.isCompleted && t.round3.isCompleted;

        return matchesSearch && matchesFilter;
    });

    renderTable();
}

// Update Stats
function updateStats() {
    statTotal.textContent = allTeams.length;
    statActive.textContent = allTeams.filter(t => (t.round1.timeTaken || t.round2.timeTaken || t.round3.timeTaken) && !(t.round1.isCompleted && t.round2.isCompleted && t.round3.isCompleted)).length;
    statCompleted.textContent = allTeams.filter(t => t.round1.isCompleted && t.round2.isCompleted && t.round3.isCompleted).length;
    
    const completedTeams = allTeams.filter(t => t.round1.isCompleted && t.round2.isCompleted && t.round3.isCompleted);
    if (completedTeams.length > 0) {
        const totalTime = completedTeams.reduce((acc, t) => acc + (t.round1.timeTaken || 0) + (t.round2.timeTaken || 0) + (t.round3.timeTaken || 0), 0);
        statAvgTime.textContent = `${Math.round(totalTime / completedTeams.length / 60)}m`;
    } else {
        statAvgTime.textContent = '0m';
    }
}

// Render Table
function renderTable() {
    tableBody.innerHTML = '';
    
    if (filteredTeams.length === 0) {
        noDataMsg.classList.remove('hidden');
        return;
    }
    
    noDataMsg.classList.add('hidden');

    // Sort teams descending by total score
    filteredTeams.sort((a, b) => b.totalScore - a.totalScore);

    filteredTeams.forEach((t, index) => {
        const row = document.createElement('tr');
        row.className = `team-row border-b border-white/5 hover:bg-white/5 transition-all ${t.round3.isCompleted ? 'completed' : ''}`;
        
        // Dynamic rank colors
        let rankColor = 'text-gray-500';
        if (index === 0) rankColor = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'; // Gold
        else if (index === 1) rankColor = 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.8)]'; // Silver
        else if (index === 2) rankColor = 'text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.8)]'; // Bronze

        row.innerHTML = `
            <td class="p-6">
                <span class="text-2xl font-black ${rankColor} font-mono">#${index + 1}</span>
            </td>
            <td class="p-6">
                <div class="flex flex-col">
                    <span class="font-bold text-blue-400">${t.teamId} <span class="text-gray-400 font-normal ml-1">— ${t.teamName || 'Unknown'}</span></span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-widest">ACTIVE</span>
                </div>
            </td>
            <td class="p-6">
                ${renderStatusBadge(t.round1)}
                <p class="text-[10px] text-gray-500 mt-1">${formatTime(t.round1.timeTaken)} | ${t.round1.attempts} Att</p>
            </td>
            <td class="p-6">
                ${renderStatusBadge(t.round2)}
                <p class="text-[10px] text-gray-500 mt-1">${formatTime(t.round2.timeTaken)}</p>
            </td>
            <td class="p-6">
                ${renderStatusBadge(t.round3)}
                <p class="text-[10px] text-gray-500 mt-1">${formatTime(t.round3.timeTaken)}</p>
            </td>
            <td class="p-6">
                <span class="text-xl font-black neon-text">${t.totalScore}</span>
            </td>
            <td class="p-6">
                <button onclick="viewDetails('${t.teamId}')" class="bg-blue-600/20 border border-blue-500/50 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600/40 transition-all mr-2">
                    VIEW DETAILS
                </button>
                <button onclick="deleteTeam('${t.teamId}')" class="bg-red-600/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600/40 transition-all">
                    DELETE
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderStatusBadge(round) {
    if (round.isCompleted) return `<span class="status-badge text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">COMPLETED</span>`;
    if (round.startTime !== null && round.startTime !== undefined) return `<span class="status-badge text-[10px] px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">IN PROGRESS</span>`;
    return `<span class="status-badge text-[10px] px-2 py-1 rounded bg-gray-500/20 text-gray-500 border border-white/5">PENDING</span>`;
}

// Delete Team
window.deleteTeam = async (teamId) => {
    if (!confirm(`Are you absolutely sure you want to delete ${teamId}? This action cannot be undone.`)) return;
    try {
        const res = await fetch(`/api/admin/team/${teamId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete team');
        showToast(`Team ${teamId} deleted successfully!`);
        fetchData();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// View Details Modal
window.viewDetails = (teamId) => {
    selectedTeamId = teamId;
    const team = allTeams.find(t => t.teamId === teamId);
    if (!team) return;

    document.getElementById('modal-team-id').textContent = teamId;
    document.getElementById('modal-total-score').textContent = `TOTAL: ${team.totalScore}`;

    // Round 1
    document.getElementById('modal-r1-status').textContent = team.round1.isCompleted ? 'COMPLETED' : 'PENDING';
    document.getElementById('modal-r1-question').textContent = team.round1.question;
    document.getElementById('modal-r1-key').textContent = team.round1.correctAnswer;
    document.getElementById('modal-r1-final').textContent = team.round1.finalAnswer || 'None';
    const r1C = document.getElementById('modal-r1-correctness');
    if (team.round1.isCompleted) {
        r1C.textContent = team.round1.isCorrect ? '(CORRECT)' : '(INCORRECT)';
        r1C.className = team.round1.isCorrect ? 'text-green-500 font-bold ml-2 text-sm' : 'text-red-500 font-bold ml-2 text-sm';
    } else {
        r1C.classList.add('hidden');
    }
    document.getElementById('modal-r1-history').innerHTML = team.round1.history.map(h => `
        <div class="flex justify-between border-b border-white/5 py-1">
            <span>In: ${h.input}</span>
            <span class="text-purple-400">Out: ${h.output}</span>
        </div>
    `).join('');

    // Round 2
    document.getElementById('modal-r2-status').textContent = team.round2.isCompleted ? 'COMPLETED' : 'PENDING';
    document.getElementById('modal-r2-url').textContent = team.round2.url || 'N/A';
    document.getElementById('modal-r2-url').href = team.round2.url || '#';
    document.getElementById('modal-r2-key').textContent = team.round2.correctFlag;
    document.getElementById('modal-r2-final').textContent = team.round2.currentFlag || 'None';
    const r2C = document.getElementById('modal-r2-correctness');
    if (team.round2.isCompleted) {
        r2C.textContent = team.round2.isCorrect ? '(CORRECT)' : '(INCORRECT)';
        r2C.className = team.round2.isCorrect ? 'text-green-500 font-bold ml-2 text-sm' : 'text-red-500 font-bold ml-2 text-sm';
    } else {
        r2C.classList.add('hidden');
    }
    document.getElementById('modal-r2-attempts').innerHTML = team.round2.attempts.map(a => `
        <div class="border-b border-white/5 py-1">${a}</div>
    `).join('');

    // Round 3
    document.getElementById('modal-r3-status').textContent = team.round3.isCompleted ? 'COMPLETED' : 'PENDING';
    document.getElementById('modal-r3-product').textContent = team.round3.product || 'N/A';
    document.getElementById('modal-r3-points').innerHTML = team.round3.expectedPoints.map(p => `<li>${p}</li>`).join('');
    document.getElementById('modal-r3-problems').textContent = team.round3.problems || 'No response yet';
    document.getElementById('modal-r3-improvements').textContent = team.round3.improvements || 'No response yet';

    // Scores
    document.getElementById('input-score-r1-logic').value = team.round1.logicScore || 0;
    document.getElementById('input-score-r1-accuracy').value = team.round1.accuracyScore || 0;
    
    document.getElementById('input-score-r2-flag').value = team.round2.flagScore || 0;
    document.getElementById('input-score-r2-path').value = team.round2.pathScore || 0;
    document.getElementById('input-score-r2-method').value = team.round2.methodScore || 0;
    
    document.getElementById('input-score-r3-clarity').value = team.round3.clarityScore || 0;
    document.getElementById('input-score-r3-creativity').value = team.round3.creativityScore || 0;
    document.getElementById('input-score-r3-realism').value = team.round3.realismScore || 0;
    document.getElementById('input-score-r3-teamwork').value = team.round3.teamworkScore || 0;

    detailsModal.classList.remove('hidden');
};

// Save Scores via Modal
document.getElementById('save-score-btn').onclick = async () => {
    const r1Logic = parseFloat(document.getElementById('input-score-r1-logic').value) || 0;
    const r1Accuracy = parseFloat(document.getElementById('input-score-r1-accuracy').value) || 0;
    const r2Flag = parseFloat(document.getElementById('input-score-r2-flag').value) || 0;
    const r2Path = parseFloat(document.getElementById('input-score-r2-path').value) || 0;
    const r2Method = parseFloat(document.getElementById('input-score-r2-method').value) || 0;
    const r3Clarity = parseFloat(document.getElementById('input-score-r3-clarity').value) || 0;
    const r3Creativity = parseFloat(document.getElementById('input-score-r3-creativity').value) || 0;
    const r3Realism = parseFloat(document.getElementById('input-score-r3-realism').value) || 0;
    const r3Teamwork = parseFloat(document.getElementById('input-score-r3-teamwork').value) || 0;

    if (r1Logic > 25 || r1Accuracy > 25 || r2Flag > 25 || r2Path > 15 || r2Method > 10 || r3Clarity > 25 || r3Creativity > 25 || r3Realism > 25 || r3Teamwork > 25) {
        showToast('Exceeds maximum allowed marks', 'error');
        return;
    }

    try {
        const res = await fetch('/api/admin/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                teamId: selectedTeamId, 
                r1Logic, r1Accuracy, 
                r2Flag, r2Path, r2Method, 
                r3Clarity, r3Creativity, r3Realism, r3Teamwork 
            })
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to save scores');
        
        showToast('Scores updated successfully!');
        detailsModal.classList.add('hidden');
        fetchData();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// UI Helpers
function formatTime(seconds) {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl font-bold shadow-2xl transition-all duration-500 ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
    }, 3000);
}

// Render Logs View
function renderLogs() {
    const container = document.getElementById('logs-container');
    if (!container) return;

    if (allTeams.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-12">No team data to display.</p>';
        return;
    }

    container.innerHTML = allTeams.map(t => {
        const r1Status = t.round1.isCompleted 
            ? (t.round1.isCorrect ? '<span class="text-green-400 font-bold">✓ CORRECT</span>' : '<span class="text-red-400 font-bold">✗ WRONG</span>')
            : '<span class="text-gray-500">PENDING</span>';
        const r2Status = t.round2.isCompleted 
            ? (t.round2.isCorrect ? '<span class="text-green-400 font-bold">✓ CORRECT</span>' : '<span class="text-red-400 font-bold">✗ WRONG</span>')
            : '<span class="text-gray-500">PENDING</span>';
        const r3Status = t.round3.isCompleted 
            ? '<span class="text-pink-400 font-bold">✓ SUBMITTED</span>' 
            : '<span class="text-gray-500">PENDING</span>';

        const historyRows = (t.round1.history || []).map(h =>
            `<div class="flex justify-between text-[10px] border-b border-white/5 py-1"><span class="text-gray-500">In: ${h.input}</span><span class="text-purple-400">Out: ${h.output}</span></div>`
        ).join('') || '<p class="text-[10px] text-gray-600">No probes yet</p>';

        const flagAttempts = (t.round2.attempts || []).map(a =>
            `<div class="text-[10px] border-b border-white/5 py-1 font-mono text-gray-400">${a}</div>`
        ).join('') || '<p class="text-[10px] text-gray-600">No attempts yet</p>';

        return `
        <div class="glass rounded-3xl border border-white/10 overflow-hidden">
            <div class="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all log-toggle" data-team="${t.teamId}">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">${t.teamId.slice(0,2).toUpperCase()}</div>
                    <div>
                        <p class="font-bold text-blue-400">${t.teamId} <span class="text-gray-400 font-normal ml-1">— ${t.teamName || 'Unknown'}</span></p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-widest">Score: ${t.totalScore} pts</p>
                    </div>
                </div>
                <div class="flex gap-6 text-center">
                    <div><p class="text-[10px] text-gray-500 mb-1">R1</p>${r1Status}</div>
                    <div><p class="text-[10px] text-gray-500 mb-1">R2</p>${r2Status}</div>
                    <div><p class="text-[10px] text-gray-500 mb-1">R3</p>${r3Status}</div>
                    <div><p class="text-[10px] text-gray-500 mb-1">TIME</p><span class="text-xs font-mono text-gray-400">${formatTime((t.round1.timeTaken || 0) + (t.round2.timeTaken || 0) + (t.round3.timeTaken || 0))}</span></div>
                </div>
                <svg class="log-chevron transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="log-detail hidden border-t border-white/5 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- R1 Detail -->
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-blue-400 tracking-widest">ROUND 1 — BLACK BOX</h4>
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                        <p class="text-[10px] text-gray-500 font-bold">QUESTION LOGIC</p>
                        <code class="text-[10px] text-blue-300 block bg-black/40 p-2 rounded break-all">${t.round1.question || 'N/A'}</code>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">KEY: <span class="text-green-400">${t.round1.correctAnswer || 'N/A'}</span> vs ANSWER: <span class="text-yellow-400">${t.round1.finalAnswer || 'None'}</span></p>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">STATUS: ${r1Status} | SCORE: <span class="text-white">${t.round1.score}</span> (Auto: ${t.round1.autoScore}, Manual: ${t.round1.manualScore})</p>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">PROBES</p>
                        <div class="max-h-24 overflow-y-auto">${historyRows}</div>
                    </div>
                </div>
                <!-- R2 Detail -->
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-purple-400 tracking-widest">ROUND 2 — TREASURE HUNT</h4>
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                        <p class="text-[10px] text-gray-500 font-bold">CHALLENGE</p>
                        <a href="${t.round2.url || '#'}" target="_blank" class="text-[10px] text-purple-300 underline break-all">${t.round2.url || 'Not assigned'}</a>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">CORRECT FLAG: <span class="text-green-400 break-all">${t.round2.correctFlag || 'N/A'}</span></p>
                        <p class="text-[10px] text-gray-500 font-bold">SUBMITTED: <span class="text-yellow-400 break-all">${t.round2.currentFlag || 'None'}</span></p>
                        <p class="text-[10px] text-gray-500 font-bold">STATUS: ${r2Status} | SCORE: <span class="text-white">${t.round2.score}</span> (Auto: ${t.round2.autoScore}, Manual: ${t.round2.manualScore})</p>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">FLAG ATTEMPTS</p>
                        <div class="max-h-24 overflow-y-auto">${flagAttempts}</div>
                    </div>
                </div>
                <!-- R3 Detail -->
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-pink-400 tracking-widest">ROUND 3 — PRODUCT ANALYST</h4>
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                        <p class="text-[10px] text-gray-500 font-bold">PRODUCT: <span class="text-pink-300">${t.round3.product || 'Not assigned'}</span></p>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">PROBLEMS</p>
                        <p class="text-[10px] text-gray-300 bg-black/40 p-2 rounded">${t.round3.problems || 'No response yet'}</p>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">IMPROVEMENTS</p>
                        <p class="text-[10px] text-gray-300 bg-black/40 p-2 rounded">${t.round3.improvements || 'No response yet'}</p>
                        <p class="text-[10px] text-gray-500 font-bold mt-2">STATUS: ${r3Status} | SCORE: <span class="text-white">${t.round3.score}</span> (Pres: ${t.round3.presentationScore}, Viab: ${t.round3.viabilityScore})</p>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Wire up accordion toggles
    container.querySelectorAll('.log-toggle').forEach(toggle => {
        toggle.onclick = () => {
            const detail = toggle.nextElementSibling;
            const chevron = toggle.querySelector('.log-chevron');
            const isHidden = detail.classList.contains('hidden');
            detail.classList.toggle('hidden', !isHidden);
            if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
        };
    });
}

// Scores View
function populateScoreTeamSelector() {
    const sel = document.getElementById('score-team-select');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- Choose a team --</option>' + 
        allTeams.map(t => `<option value="${t.teamId}" ${t.teamId === currentVal ? 'selected' : ''}>${t.teamId} — ${t.teamName || 'Unknown'} (Score: ${t.totalScore})</option>`).join('');
    if (currentVal) sel.value = currentVal;
}

function loadTeamScores(teamId) {
    const team = allTeams.find(t => t.teamId === teamId);
    const panel = document.getElementById('scores-panel');
    if (!team || !panel) return;
    
    panel.classList.remove('hidden');
    document.getElementById('scores-panel-team').textContent = teamId;
    
    // Load existing manual scores
    document.getElementById('score-r1-logic').value = team.round1.logicScore || 0;
    document.getElementById('score-r1-accuracy').value = team.round1.accuracyScore || 0;
    
    document.getElementById('score-r2-flag').value = team.round2.flagScore || 0;
    document.getElementById('score-r2-path').value = team.round2.pathScore || 0;
    document.getElementById('score-r2-method').value = team.round2.methodScore || 0;
    
    document.getElementById('score-r3-clarity').value = team.round3.clarityScore || 0;
    document.getElementById('score-r3-creativity').value = team.round3.creativityScore || 0;
    document.getElementById('score-r3-realism').value = team.round3.realismScore || 0;
    document.getElementById('score-r3-teamwork').value = team.round3.teamworkScore || 0;
    
    const r1Auto = team.round1.autoScore || 0;
    const r2Auto = team.round2.autoScore || 0;
    document.getElementById('score-r1-auto-badge').textContent = `AUTO: +${r1Auto}`;
    document.getElementById('score-r2-auto-badge').textContent = `AUTO: +${r2Auto}`;
    
    updateScoreTotals(team);
}

function updateScoreTotals(team) {
    const r1Logic = parseInt(document.getElementById('score-r1-logic').value) || 0;
    const r1Acc   = parseInt(document.getElementById('score-r1-accuracy').value) || 0;
    const r1Manual = r1Logic + r1Acc;

    const r2Flag   = parseInt(document.getElementById('score-r2-flag').value) || 0;
    const r2Path   = parseInt(document.getElementById('score-r2-path').value) || 0;
    const r2Method = parseInt(document.getElementById('score-r2-method').value) || 0;
    const r2Manual = r2Flag + r2Path + r2Method;

    const r3Clarity   = parseInt(document.getElementById('score-r3-clarity').value) || 0;
    const r3Creativity= parseInt(document.getElementById('score-r3-creativity').value) || 0;
    const r3Realism   = parseInt(document.getElementById('score-r3-realism').value) || 0;
    const r3Teamwork  = parseInt(document.getElementById('score-r3-teamwork').value) || 0;
    const r3Total  = r3Clarity + r3Creativity + r3Realism + r3Teamwork;

    const r1Auto = team ? (team.round1.autoScore || 0) : 0;
    const r2Auto = team ? (team.round2.autoScore || 0) : 0;
    const totalManual = r1Manual + r2Manual + r3Total;
    const totalAuto   = r1Auto + r2Auto;
    const grandTotal  = totalManual + totalAuto;

    document.getElementById('score-r1-manual-total').textContent = r1Manual;
    document.getElementById('score-r2-manual-total').textContent = r2Manual;
    document.getElementById('score-r3-total').textContent = r3Total;
    document.getElementById('score-panel-auto').textContent = totalAuto;
    document.getElementById('score-panel-manual').textContent = totalManual;
    document.getElementById('score-panel-total').textContent = grandTotal;
}

// Wire score team selector
const scoreTeamSelect = document.getElementById('score-team-select');
if (scoreTeamSelect) {
    scoreTeamSelect.onchange = function() {
        if (this.value) {
            loadTeamScores(this.value);
            selectedTeamId = this.value;
        } else {
            const panel = document.getElementById('scores-panel');
            if (panel) panel.classList.add('hidden');
        }
    };
}

// Wire live-updating score totals
['score-r1-logic', 'score-r1-accuracy', 'score-r2-flag', 'score-r2-path', 'score-r2-method', 'score-r3-clarity', 'score-r3-creativity', 'score-r3-realism', 'score-r3-teamwork'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.oninput = () => {
            const team = allTeams.find(t => t.teamId === selectedTeamId);
            updateScoreTotals(team);
        };
    }
});

// Save scores from SCORES view
const saveScoresMainBtn = document.getElementById('save-scores-main-btn');
if (saveScoresMainBtn) {
    saveScoresMainBtn.onclick = async () => {
        if (!selectedTeamId) {
            showToast('No team selected', 'error');
            return;
        }

        const r1Logic = parseFloat(document.getElementById('score-r1-logic').value) || 0;
        const r1Accuracy = parseFloat(document.getElementById('score-r1-accuracy').value) || 0;
        const r2Flag = parseFloat(document.getElementById('score-r2-flag').value) || 0;
        const r2Path = parseFloat(document.getElementById('score-r2-path').value) || 0;
        const r2Method = parseFloat(document.getElementById('score-r2-method').value) || 0;
        const r3Clarity = parseFloat(document.getElementById('score-r3-clarity').value) || 0;
        const r3Creativity = parseFloat(document.getElementById('score-r3-creativity').value) || 0;
        const r3Realism = parseFloat(document.getElementById('score-r3-realism').value) || 0;
        const r3Teamwork = parseFloat(document.getElementById('score-r3-teamwork').value) || 0;

        if (r1Logic > 25 || r1Accuracy > 25 || r2Flag > 25 || r2Path > 15 || r2Method > 10 || r3Clarity > 25 || r3Creativity > 25 || r3Realism > 25 || r3Teamwork > 25) {
            showToast('Exceeds maximum allowed marks', 'error');
            return;
        }

        try {
            const res = await fetch('/api/admin/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    teamId: selectedTeamId, 
                    r1Logic, r1Accuracy, 
                    r2Flag, r2Path, r2Method, 
                    r3Clarity, r3Creativity, r3Realism, r3Teamwork 
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to save scores');
            
            showToast(`Scores saved for ${selectedTeamId}!`);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
}

// Refresh logs button
const refreshLogsBtn = document.getElementById('refresh-logs-btn');
if (refreshLogsBtn) {
    refreshLogsBtn.onclick = async () => {
        await fetchData();
        renderLogs();
        showToast('Logs refreshed');
    };
}

// Event Listeners
searchInput.oninput = applyFilters;
filterSelect.onchange = applyFilters;
document.getElementById('close-modal').onclick = () => detailsModal.classList.add('hidden');

document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('adminName');
    window.location.href = '/';
};

document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        
        // Update nav UI
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Hide all views
        document.querySelectorAll('main > section').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('block');
        });
        
        // Show target view
        currentView = link.dataset.view;
        const targetSection = document.getElementById(`view-${currentView}`);
        if (targetSection) targetSection.classList.add('block');
        if (targetSection) targetSection.classList.remove('hidden');

        document.getElementById('view-title').textContent = currentView.toUpperCase();

        // Initialize view-specific content
        if (currentView === 'logs') renderLogs();
        if (currentView === 'scores') populateScoreTeamSelector();
    };
});

// Init
const adminName = localStorage.getItem('adminName');
if (adminName) {
    document.getElementById('admin-name-display').textContent = adminName;
}

fetchData();
updateInterval = setInterval(fetchData, 3000);

