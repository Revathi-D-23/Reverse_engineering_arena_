// Auto-redirect if already logged in
if (localStorage.getItem('teamId') && !window.location.pathname.includes('admin')) {
    window.location.href = '/dashboard.html';
}

// State
let selectedRole = null;

// DOM Elements
const roleSelection = document.getElementById('role-selection');
const inputContainer = document.getElementById('input-container');
const nameInput = document.getElementById('name-input');
const adminPasswordInput = document.getElementById('admin-password-input');
const teamIdInput = document.getElementById('team-id-input');
const loginActionBtn = document.getElementById('login-action-btn');
const btnParticipant = document.getElementById('btn-participant');
const btnAdmin = document.getElementById('btn-admin');
const backToRoles = document.getElementById('back-to-roles');
const loadingOverlay = document.getElementById('loading-overlay');
const toast = document.getElementById('toast');

const ADMIN_PASSWORD = 'cyberhunt@admin';

// Role Selection
btnParticipant.onclick = () => {
    selectedRole = 'participant';
    showInput('Enter Team Name...', 'START MISSION', 'blue');
};

btnAdmin.onclick = () => {
    selectedRole = 'admin';
    showInput('Enter Admin Name...', 'LOGIN AS ADMIN', 'purple');
};

backToRoles.onclick = () => {
    inputContainer.classList.add('hidden');
    roleSelection.classList.remove('hidden');
    selectedRole = null;
    nameInput.value = '';
    teamIdInput.value = '';
    adminPasswordInput.value = '';
    teamIdInput.classList.add('hidden');
    adminPasswordInput.classList.add('hidden');
};

function showInput(placeholder, btnText, theme) {
    roleSelection.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    nameInput.placeholder = placeholder;
    loginActionBtn.textContent = btnText;

    if (theme === 'blue') {
        teamIdInput.classList.remove('hidden');
        adminPasswordInput.classList.add('hidden');
        loginActionBtn.className = "w-full bg-blue-600 text-white py-5 rounded-2xl font-black tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 btn-glow";
        nameInput.focus();
    } else {
        teamIdInput.classList.add('hidden');
        adminPasswordInput.classList.remove('hidden');
        loginActionBtn.className = "w-full bg-purple-600 text-white py-5 rounded-2xl font-black tracking-widest hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 active:scale-95 btn-glow";
        nameInput.focus();
    }
}

// Login Action
loginActionBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const teamId = teamIdInput.value.trim();

    if (!name) {
        showToast('Please enter a valid name', 'error');
        return;
    }

    if (selectedRole === 'participant' && !teamId) {
        showToast('Please enter your Team ID', 'error');
        return;
    }

    loadingOverlay.classList.remove('hidden');

    try {
        if (selectedRole === 'participant') {
            const res = await fetch('/api/login-participant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamName: name, teamId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('role', 'participant');
            localStorage.setItem('teamId', teamId);
            showToast('Mission Initialized. Redirecting...', 'success');
            window.location.href = '/dashboard.html';
        } else {
            const password = adminPasswordInput.value.trim();
            if (password !== ADMIN_PASSWORD) {
                showToast('Incorrect password. Access denied.', 'error');
                loadingOverlay.classList.add('hidden');
                return;
            }
            localStorage.setItem('role', 'admin');
            localStorage.setItem('adminName', name);
            showToast('Admin Access Granted. Redirecting...', 'success');
            window.location.href = '/admin.html';
        }
    } catch (err) {
        showToast(err.message, 'error');
        loadingOverlay.classList.add('hidden');
    }
};

// Helpers
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl font-bold shadow-2xl transition-all duration-500 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
    }, 3000);
}

// Safety: Hide loading overlay on window load
window.addEventListener('load', () => {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
});
