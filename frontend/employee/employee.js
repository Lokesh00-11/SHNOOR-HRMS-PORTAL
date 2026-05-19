/**
 * Shnoor HRM - Employee Dashboard Logic
 * Handles section navigation, profile management, and API communication.
 */

// --- Configuration ---
const API_BASE = "http://127.0.0.1:8000/api";

function formatTime(dateStr) {
    if (!dateStr || dateStr === '-') return '-';

    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(dateStr)) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        let mins = timeMatch[2];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
    }

    return dateStr;
}

function formatHoursToHrMin(decimalHours) {
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
}


function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    try {
        const cleanStr = dateStr.split(' ')[0].split('T')[0].trim();
        const parts = cleanStr.split(/[-/]/);
        if (parts.length === 3) {
            let day, month, year;
            if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
            } else if (parts[2].length === 4) {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                year = parseInt(parts[2], 10);
            }
            if (year && month !== undefined && day) {
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) return d;
            }
        }
    } catch (e) { }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
}

function formatDateDisplay(dateObj, includeTime = false) {
    if (!dateObj || isNaN(dateObj.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    if (!includeTime) return date;
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();

    setTodayAsDefault();

    loadProfile();
    loadDashboardStats();

    updateQueryBadge();
    updateNotificationBadge();
    updateLeavesBadge();

    setInterval(() => {
        const activeNav = document.querySelector('.nav-item.active');
        const currentTarget = activeNav ? activeNav.getAttribute('data-target') : 'dashboard';

        if (currentTarget === 'attendance') {
            loadAttendance();
        } else if (currentTarget === 'dashboard') {
            loadDashboardStats();
        }
        updateQueryBadge();
        updateNotificationBadge();
        updateLeavesBadge();
    }, 5000);
});

function setTodayAsDefault() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = today;
    });
}

/**
 * Sidebar Navigation Controller
 * Manages view switching based on data-target attributes.
 */

function initNavigation() {
    console.log("Navigation initialized");

    document.addEventListener('click', function (e) {
        const item = e.target.closest('.nav-item[data-target]');
        if (!item) return;

        const targetId = item.getAttribute('data-target');
        console.log("NAV CLICK:", targetId);

        const targetView = document.getElementById(targetId);
        if (!targetView) {
            console.error("Section not found:", targetId);
            return;
        }

        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });

        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });

        // activate current
        targetView.classList.add('active');
        item.classList.add('active');

        console.log("Section activated:", targetId);

        // 🔥 CRITICAL
        if (targetId === 'dashboard') loadDashboardStats();
        if (targetId === 'attendance') loadAttendance();
        if (targetId === 'leaves') {
            loadLeaves();
        }
        if (targetId === 'tasks') loadTasks();
        if (targetId === 'holidays') loadHolidays();
        if (targetId === 'orgchart') loadOrgChart();
        if (targetId === 'expenses') loadExpenses();
        if (targetId === 'documents') loadDocuments();
        if (targetId === 'profile') loadProfile();
        if (targetId === 'queries') {
            loadQueries();
            const badge = document.getElementById('query-badge');
            if (badge) {
                setTimeout(() => { badge.style.display = 'none'; }, 2000);
            }
        }
        if (targetId === 'notifications') {
            loadNotifications();
            const badge = document.getElementById('notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
            fetchData('/notifications/').then(data => {
                if (data && data.received) {
                    localStorage.setItem('last_seen_notification_count', data.received.length);
                }
            });
        }
        if (targetId === 'payroll') loadPayroll();
        if (targetId === 'offboardings') loadOffboardings();
        if (targetId === 'reports') loadReports();
        if (targetId === 'appreciations') {
            loadAppreciations();
            const badge = document.getElementById('appr-badge');
            if (badge) badge.style.display = 'none';

            fetchData('/employee/appreciations/self/').then(data => {
                if (data) localStorage.setItem('last_seen_appr_count', data.length);
            });
        }
    });
}

async function updateQueryBadge() {
    const badge = document.getElementById('query-badge');
    if (!badge) return;
    try {
        const data = await fetchData('/queries/unread-count/');
        if (data && data.unread_count > 0) {
            badge.innerText = data.unread_count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error("Error updating query badge:", err);
    }
}

async function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    const activeNav = document.querySelector('.nav-item.active');
    const isViewingNotif = activeNav && activeNav.getAttribute('data-target') === 'notifications';

    try {
        const data = await fetchData('/notifications/');
        if (data && data.received) {
            const totalCount = data.received.length;
            const lastSeenCount = parseInt(localStorage.getItem('last_seen_notification_count') || '0');

            if (isViewingNotif) {
                localStorage.setItem('last_seen_notification_count', totalCount);
                badge.style.display = 'none';
            } else if (totalCount > lastSeenCount) {
                badge.innerText = totalCount - lastSeenCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error("Error updating notification badge:", err);
    }
}

async function updateAppreciationBadge() {
    const badge = document.getElementById('appr-badge');
    if (!badge) return;
    try {
        const data = await fetchData('/employee/appreciations/self/');
        if (data && data.length > 0) {
            const totalCount = data.length;
            const lastSeenCount = parseInt(localStorage.getItem('last_seen_appr_count') || '0');

            const activeNav = document.querySelector('.nav-item.active');
            const isViewingAppr = activeNav && activeNav.getAttribute('data-target') === 'appreciations';

            if (isViewingAppr) {
                localStorage.setItem('last_seen_appr_count', totalCount);
                badge.style.display = 'none';
            } else if (totalCount > lastSeenCount) {
                badge.innerText = totalCount - lastSeenCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error("Error updating appreciation badge:", err);
    }
}

async function updateLeavesBadge() {
    const badge = document.getElementById('leaves-badge');
    if (!badge) {
        console.error("Leaves badge element not found in DOM");
        return;
    }

    try {
        const data = await fetchData('/notifications/');
        if (data && typeof data.unread_leaves_count !== 'undefined') {
            const count = parseInt(data.unread_leaves_count);
            if (count > 0) {
                badge.innerText = count;
                badge.style.setProperty('display', 'inline-block', 'important');
                badge.style.setProperty('visibility', 'visible', 'important');
                badge.style.setProperty('opacity', '1', 'important');
            } else {
                badge.style.setProperty('display', 'none', 'important');
            }
        }
    } catch (err) {
        console.error("Error updating employee leaves badge:", err);
    }
}

/**
 * Utility: Authenticated Fetch
 * Standardizes API communication with token management.
 */
async function fetchData(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn("Authentication token missing.");
        return null;
    }

    const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const url = API_BASE + endpoint + (endpoint.includes('?') ? '&' : '?') + '_t=' + Date.now();

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = "../login.html";
            return null;
        }

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        return null;
    }
}

/**
 * Profile Module
 * Handles fetching and rendering of employee profile data.
 */
async function loadProfile() {
    console.log("FETCHING PROFILE...");
    try {
        const data = await fetchData('/employee/profile/');
        if (!data) {
            console.error("NO PROFILE DATA RECEIVED");
            return;
        }

        console.log("PROFILE DATA RECEIVED:", data);

        const setT = (id, text) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = (text !== null && text !== undefined && String(text).trim() !== "") ? text : "-";
            }
        };
        const setV = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = (val !== null && val !== undefined) ? val : "";
            }
        };

        const displayName = data.full_name || data.username || "Employee";

        setT('emp_name', displayName);
        setT('emp_designation', data.designation);
        setT('emp_department', data.department);
        setT('emp_email', data.email);
        setT('emp_phone', data.phone_number);
        setT('emp_joining', data.date_of_joining);

        const sideName = document.getElementById('side-prof-name');
        const sideDesig = document.getElementById('side-prof-designation');
        const sideDept = document.getElementById('side-prof-dept');
        const sideId = document.getElementById('side-prof-id');
        const sideJoin = document.getElementById('side-prof-join');
        const sideMode = document.getElementById('side-prof-mode');
        const sideImg = document.getElementById('side-prof-img');

        if (sideName) sideName.innerText = displayName;
        if (sideDesig) sideDesig.innerText = data.designation || 'Employee';
        if (sideDept) sideDept.innerText = data.department || 'General';
        if (sideId) sideId.innerText = data.employee_id || '---';
        if (sideJoin) sideJoin.innerText = data.date_of_joining || '---';
        if (sideMode) sideMode.innerText = data.work_mode || 'Office';
        if (sideImg && data.profile_picture) {
            const backendBase = API_BASE.replace('/api', '');
            const picUrl = data.profile_picture;
            sideImg.src = picUrl.startsWith('http') ? picUrl : backendBase + (picUrl.startsWith('/') ? picUrl : '/' + picUrl);
        }

        // New Dashboard Details
        const dashEmail = document.getElementById('dash-prof-email');
        const dashPhone = document.getElementById('dash-prof-phone');
        const dashBlood = document.getElementById('dash-prof-blood');
        const dashAadhaar = document.getElementById('dash-prof-aadhaar');
        const dashEmergency = document.getElementById('dash-prof-emergency');

        if (dashEmail) dashEmail.innerText = data.email || '---';
        if (dashPhone) dashPhone.innerText = data.phone_number || '---';
        if (dashBlood) dashBlood.innerText = data.blood_group || '---';
        if (dashAadhaar) dashAadhaar.innerText = data.aadhaar_number || '---';
        if (dashEmergency) dashEmergency.innerText = data.emergency_contact_phone || '---';

        // Detailed Form Mapping
        setV('prof-fname', data.first_name);
        setV('prof-lname', data.last_name);
        setV('prof-email', data.email);
        setV('prof-phone', data.phone_number);
        setV('prof-gender', data.gender);
        setV('prof-dob', formatDateForInput(data.date_of_birth));
        setV('prof-address', data.address);
        setV('prof-designation', data.designation);
        setV('prof-department', data.department);
        setV('prof-empid', data.employee_id);
        setV('prof-joining', formatDateForInput(data.date_of_joining));
        setV('prof-bank', data.bank_name);
        setV('prof-acc', data.account_number);
        setV('prof-ifsc', data.ifsc_code);
        setV('prof-branch', data.branch_name);
        setV('prof-shift', data.shift);
        setV('prof-type', data.employment_type);

        // Added Fields Mapping
        setV('prof-aadhaar', data.aadhaar_number);
        setV('prof-pan', data.pan_number);
        setV('prof-marital', data.marital_status);
        setV('prof-nationality', data.nationality);
        setV('prof-blood', data.blood_group);
        setV('prof-perm-address', data.permanent_address);
        setV('prof-emg-name', data.emergency_contact_name);
        setV('prof-emg-phone', data.emergency_contact_phone);
        setV('prof-emg-relation', data.emergency_contact_relation);
        setV('prof-work-mode', data.work_mode);
    } catch (error) {
        console.error("Critical error in loadProfile:", error);
    }
}

/**
 * Toggle Profile Mode
 * Switches between view-only and editable form states.
 */
/**
 * Enable Profile Editing
 * Removes readonly/disabled attributes from profile inputs.
 */
function enableEdit() {
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        if (input.id === 'prof-email') return; // Email remains locked

        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        input.style.background = 'rgba(255,255,255,0.05)';
    });

    // Toggle buttons
    document.getElementById('edit-profile-btn').style.display = 'none';
    document.getElementById('save-profile-btn').style.display = 'inline-block';
}

/**
 * Lock Profile Fields
 * Re-applies readonly/disabled attributes to profile inputs.
 */
function lockFields() {
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        if (input.tagName === 'SELECT') input.setAttribute('disabled', true);
        input.style.background = 'var(--bg-navy)';
    });

    // Toggle buttons
    document.getElementById('edit-profile-btn').style.display = 'inline-block';
    document.getElementById('save-profile-btn').style.display = 'none';
}


/**
 * Save Profile
 * Submits form data to the update endpoint.
 */
/**
 * Save Profile
 * Submits form data to the update endpoint.
 */
async function saveProfile() {
    const payload = {
        first_name: document.getElementById('prof-fname')?.value,
        last_name: document.getElementById('prof-lname')?.value,
        phone_number: document.getElementById('prof-phone')?.value,
        gender: document.getElementById('prof-gender')?.value,
        date_of_birth: document.getElementById('prof-dob')?.value || null,
        address: document.getElementById('prof-address')?.value,
        designation: document.getElementById('prof-designation')?.value,
        department: document.getElementById('prof-department')?.value,
        employee_id: document.getElementById('prof-empid')?.value,
        date_of_joining: document.getElementById('prof-joining')?.value || null,
        bank_name: document.getElementById('prof-bank')?.value,
        account_number: document.getElementById('prof-acc')?.value,
        ifsc_code: document.getElementById('prof-ifsc')?.value,
        branch_name: document.getElementById('prof-branch')?.value,
        aadhaar_number: document.getElementById('prof-aadhaar')?.value,
        pan_number: document.getElementById('prof-pan')?.value,
        marital_status: document.getElementById('prof-marital')?.value,
        nationality: document.getElementById('prof-nationality')?.value,
        blood_group: document.getElementById('prof-blood')?.value,
        permanent_address: document.getElementById('prof-perm-address')?.value,
        emergency_contact_name: document.getElementById('prof-emg-name')?.value,
        emergency_contact_phone: document.getElementById('prof-emg-phone')?.value,
        emergency_contact_relation: document.getElementById('prof-emg-relation')?.value,
        shift: document.getElementById('prof-shift')?.value
    };

    console.log('SAVE_PROFILE_PAYLOAD:', payload);

    const data = await fetchData('/employee/profile/update/', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    console.log('SAVE_PROFILE_RESPONSE:', data);

    if (data) {
        alert('Profile updated successfully!');
        lockFields();
        loadProfile();
    } else {
        alert('Failed to save profile. Please check the console for details.');
    }
}


/**
 * Documents Module
 * Handles fetching and rendering of company documents.
 */
async function loadDocuments() {
    console.log("Fetching documents...");
    const list = document.getElementById('documents-list');
    if (!list) return;

    // Clear table before rendering
    list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem;">Loading documents...</td></tr>';

    try {
        const data = await fetchData('/employee/documents/');
        console.log("Documents Data:", data);

        let docsArray = [];
        if (Array.isArray(data)) {
            docsArray = data;
        } else if (data && typeof data === 'object') {
            // In case the API returns { documents: [...] }
            docsArray = data.documents || data.data || Object.values(data);
        }

        if (!docsArray || docsArray.length === 0) {
            list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">No documents available.</td></tr>';
            return;
        }

        list.innerHTML = '';
        docsArray.forEach(doc => {
            const dateStr = doc.uploaded_at || doc.created_at;
            const date = dateStr ? new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Unknown Date';

            const fileUrl = doc.file || doc.file_url || '#';
            const title = doc.title || 'Untitled Document';
            
            const backendBase = API_BASE.replace('/api', '');
            const fullFileUrl = fileUrl.startsWith('http') ? fileUrl : backendBase + (fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${title}</td>
                <td>${date}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <a href="${fullFileUrl}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration: none;">
                            <i class="fa-solid fa-eye"></i> View
                        </a>
                        <a href="#" onclick="event.preventDefault(); downloadFile('${fullFileUrl}', '${title}.pdf')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration: none;">
                            <i class="fa-solid fa-download"></i> Download
                        </a>
                    </div>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading documents:", error);
        list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">Failed to load documents.</td></tr>';
    }
}

async function downloadFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        window.open(url, '_blank');
    }
}

async function loadAppreciations() {
    const list = document.getElementById('appreciations-list');
    if (!list) return;

    list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading appreciations...</div>';

    try {
        const data = await fetchData('/employee/appreciations/self/');
        if (!data || data.length === 0) {
            list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No appreciations received yet.</div>';
            return;
        }

        list.innerHTML = data.map(app => `
            <div class="glass-panel" style="padding: 1.5rem; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -10px; right: -10px; font-size: 4rem; opacity: 0.05; color: var(--primary);">
                    <i class="fa-solid fa-medal"></i>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(59, 130, 246, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fa-solid fa-award"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; color: #fff;">${app.title}</h4>
                        <small style="color: var(--text-muted);">From: ${app.sender_username} • ${new Date(app.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
                <p style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; margin-bottom: 1rem;">
                    "${app.description}"
                </p>
                ${parseFloat(app.amount) > 0 ? `
                    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 0.4rem 0.8rem; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 8px; font-weight: 600; font-size: 0.85rem;">
                        <i class="fa-solid fa-coins"></i> Reward: ₹${app.amount}
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error("Error loading appreciations:", error);
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #f43f5e;">Failed to load appreciations.</div>';
    }
}

async function loadDashboardStats() {
    const stats = await fetchData('/employee/stats/');
    const todayLogs = await fetchData('/employee/attendance/today/');
    const profile = await fetchData('/employee/profile/');

    if (profile) {
        const nameEl = document.getElementById('side-prof-name');
        const desigEl = document.getElementById('side-prof-designation');
        const deptEl = document.getElementById('side-prof-dept');
        const idEl = document.getElementById('side-prof-id');
        const joinEl = document.getElementById('side-prof-join');
        const modeEl = document.getElementById('side-prof-mode');
        const imgEl = document.getElementById('side-prof-img');

        if (nameEl) nameEl.innerText = profile.full_name || (profile.first_name + ' ' + profile.last_name).trim() || profile.username || 'Employee';
        if (desigEl) desigEl.innerText = profile.designation || 'Employee';
        if (deptEl) deptEl.innerText = profile.department || 'General';
        if (idEl) idEl.innerText = profile.employee_id || '---';
        if (joinEl) joinEl.innerText = profile.date_of_joining || '---';
        if (modeEl) modeEl.innerText = profile.work_mode || 'Office';
        if (imgEl && profile.profile_picture) {
            const picUrl = profile.profile_picture;
            const backendBase = API_BASE.replace('/api', '');
            imgEl.src = picUrl.startsWith('http') ? picUrl : backendBase + (picUrl.startsWith('/') ? picUrl : '/' + picUrl);
        }
        const dashEmail = document.getElementById('dash-prof-email');
        const dashPhone = document.getElementById('dash-prof-phone');
        const dashBlood = document.getElementById('dash-prof-blood');
        const dashAadhaar = document.getElementById('dash-prof-aadhaar');
        const dashEmergency = document.getElementById('dash-prof-emergency');

        if (dashEmail) dashEmail.innerText = profile.email || '---';
        if (dashPhone) dashPhone.innerText = profile.phone_number || '---';
        if (dashBlood) dashBlood.innerText = profile.blood_group || '---';
        if (dashAadhaar) dashAadhaar.innerText = profile.aadhaar_number || '---';
        if (dashEmergency) dashEmergency.innerText = profile.emergency_contact_phone || '---';
    }

    if (stats) {
        const leaveBalEl = document.getElementById('dash-leave-bal');
        if (leaveBalEl) leaveBalEl.innerText = `${stats.total_balance || 0} Days`;

        const paidDashEl = document.getElementById('leave-bal-paid-dash');
        if (paidDashEl) paidDashEl.innerText = stats.paid_leaves_taken || 0;
    }

    if (todayLogs && todayLogs.length > 0) {
        const lastRec = todayLogs[todayLogs.length - 1];
        const statusEl = document.getElementById('dash-status');

        const totalSecs = todayLogs.reduce((sum, rec) => {
            if (rec.hours_worked) return sum + (parseFloat(rec.hours_worked) * 3600);
            if (!rec.check_out) {
                const diff = (new Date() - new Date(rec.check_in)) / 1000;
                return sum + diff;
            }
            return sum;
        }, 0);
        const totalHrsDecimal = (totalSecs / 3600);
        const formattedTotal = formatHoursToHrMin(totalHrsDecimal);

        if (!lastRec.check_out) {
            statusEl.innerHTML = `Clocked In <br><small style="font-size:0.8rem; opacity:0.8;">Since ${formatTime(lastRec.check_in)} (${formattedTotal} total)</small>`;
            statusEl.style.color = '#10b981';
        } else {
            statusEl.innerHTML = `Clocked Out <br><small style="font-size:0.8rem; opacity:0.8;">Total: ${formattedTotal}</small>`;
            statusEl.style.color = 'var(--primary)';
        }
    } else {
        document.getElementById('dash-status').innerText = 'Not Clocked In';
        document.getElementById('dash-status').style.color = '#f59e0b';
    }

    const holidays = await fetchData('/employee/holidays/');
    if (holidays && holidays.length > 0) {
        const now = new Date();
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const futureHolidays = holidays.filter(h => {
            const hDate = parseDate(h.date);
            return hDate && hDate >= todayAtMidnight;
        }).sort((a, b) => parseDate(a.date) - parseDate(b.date));

        if (futureHolidays.length > 0) {
            const h = futureHolidays[0];
            const hDate = parseDate(h.date);
            const dateStr = hDate ? formatDateDisplay(hDate) : h.date;
            document.getElementById('dash-next-hol').innerHTML = `${h.name}<br><small style="font-size:0.8rem; opacity:0.8;">${dateStr}</small>`;
        } else {
            document.getElementById('dash-next-hol').innerText = "No upcoming";
        }
    }

    const appreciations = await fetchData('/employee/appreciations/self/');
    if (appreciations) {
        const appCountEl = document.getElementById('dash-appreciations');
        if (appCountEl) appCountEl.innerText = appreciations.length;
        updateAppreciationBadge();
    }

    const offboardings = await fetchData('/employee/offboardings/');
    if (offboardings) {
        const offCountEl = document.getElementById('dash-offboardings');
        if (offCountEl) offCountEl.innerText = offboardings.length;
    }

    const expenses = await fetchData('/employee/expenses/');
    if (expenses) {
        const pending = expenses.filter(e => e.status.toLowerCase() === 'pending');
        const totalPending = pending.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        document.getElementById('dash-expenses').innerText = `₹${totalPending.toFixed(2)}`;
    }
}

// --- Attendance Module ---
async function loadAttendance() {
    const data = await fetchData('/employee/attendance/');
    if (!data || data.length === 0) return;

    attendanceRawData = data; 
    renderAttendanceCalendar(); 
}

let currentCalendarDate = new Date();
let attendanceRawData = [];

function renderAttendanceCalendar() {
    const calendarGrid = document.getElementById('calendar-days-grid');
    const monthYearEl = document.getElementById('calendar-month-year');
    if (!calendarGrid || !monthYearEl) return;

    calendarGrid.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearEl.innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grouped = {};
    attendanceRawData.forEach(rec => {
        const dateObj = parseDate(rec.date);
        if (dateObj) {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            const normalizedDate = `${y}-${m}-${d}`;
            
            if (!grouped[normalizedDate]) {
                grouped[normalizedDate] = {
                    date: normalizedDate,
                    sessions: [],
                    status: rec.status
                };
            }
            grouped[normalizedDate].sessions.push({
                in: rec.check_in,
                out: rec.check_out
            });
        }
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.padding = '1rem';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.style.padding = '0.5rem';
        dayCell.style.borderRadius = '8px';
        dayCell.style.background = 'rgba(255,255,255,0.02)';
        dayCell.style.border = '1px solid rgba(255,255,255,0.05)';
        dayCell.style.minHeight = '100px';
        dayCell.style.display = 'flex';
        dayCell.style.flexDirection = 'column';
        
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const record = grouped[dateStr];
        
        const dayNum = document.createElement('div');
        dayNum.innerText = day;
        dayNum.style.fontWeight = '600';
        dayNum.style.textAlign = 'left';
        dayNum.style.color = 'var(--text-muted)';
        dayCell.appendChild(dayNum);
        
        if (record) {
            dayCell.style.background = 'rgba(59, 130, 246, 0.1)';
            dayCell.style.borderColor = 'rgba(59, 130, 246, 0.2)';
            dayNum.style.color = '#fff';
            
            const sessionsDiv = document.createElement('div');
            sessionsDiv.style.fontSize = '0.7rem';
            sessionsDiv.style.marginTop = '0.25rem';
            sessionsDiv.style.display = 'flex';
            sessionsDiv.style.flexDirection = 'column';
            sessionsDiv.style.gap = '2px';
            
            record.sessions.forEach(s => {
                const inT = formatTime(s.in);
                const outT = s.out ? formatTime(s.out) : 'Still In';
                const sessionEl = document.createElement('div');
                sessionEl.style.whiteSpace = 'nowrap';
                sessionEl.style.overflow = 'hidden';
                sessionEl.style.textOverflow = 'ellipsis';
                sessionEl.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket" style="font-size:0.6rem; opacity:0.7;"></i> ${inT} - ${outT}`;
                sessionsDiv.appendChild(sessionEl);
            });
            
            dayCell.appendChild(sessionsDiv);
        }
        
        calendarGrid.appendChild(dayCell);
    }
}



// Month Navigation
document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderAttendanceCalendar();
});

document.getElementById('btn-next-month')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderAttendanceCalendar();
});

document.getElementById('clock-in-btn')?.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/employee/attendance/clock-in/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const res = await response.json();
    if (response.ok) {
        alert('Clocked In successfully');
        loadDashboardStats();
        loadAttendance();
    } else {
        alert(res.message || 'Clock-in failed');
    }
});

document.getElementById('clock-out-btn')?.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/employee/attendance/clock-out/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const res = await response.json();
    if (response.ok) {
        alert('Clocked Out successfully');
        loadDashboardStats();
        loadAttendance();
    } else {
        alert(res.message || 'Clock-out failed');
    }
});

// --- Holidays Module ---

// --- Leaves Module ---
async function loadLeaves() {
    const list = document.getElementById('leavesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/employee/leaves/');
    const stats = await fetchData('/employee/stats/');

    // Mark leave-related notifications as read
    try {
        const notifs = await fetchData('/notifications/');
        if (notifs && notifs.received) {
            const leaveNotifIds = notifs.received
                .filter(n => !n.is_read && (n.title.toLowerCase().includes('leave') || n.message.toLowerCase().includes('leave')))
                .map(n => n.id);

            if (leaveNotifIds.length > 0) {
                await fetchData('/notifications/mark-read/', {
                    method: 'POST',
                    body: JSON.stringify({ notification_ids: leaveNotifIds })
                });
                updateNotificationBadge();
                updateLeavesBadge();
            }
        }
    } catch (e) { console.error("Error clearing leave notifications:", e); }

    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No leaves found.</td></tr>';
    } else {
        list.innerHTML = '';
        data.forEach(l => {
            const sDateObj = parseDate(l.start_date);
            const eDateObj = parseDate(l.end_date);
            const sDate = formatDateDisplay(sDateObj) || l.start_date;
            const eDate = formatDateDisplay(eDateObj) || l.end_date;
            let statusCls = l.status.toLowerCase() === 'approved' ? 'active' : (l.status.toLowerCase() === 'rejected' ? 'inactive' : '');
            if (!statusCls) statusCls = 'status';

            list.innerHTML += `<tr><td>${l.leave_type}</td><td>${sDate} - ${eDate}</td><td>${l.reason}</td><td><span class="status ${statusCls}">${l.status}</span></td></tr>`;
        });
    }

    if (stats) {
        document.getElementById('leave-bal-total').innerText = stats.total_balance;
        document.getElementById('leave-bal-approved').innerText = stats.leaves_taken;
        document.getElementById('leave-bal-pending').innerText = `Sick:${stats.sick_leaves} Casual:${stats.casual_leaves} Vacation:${stats.vacation_leaves}`;
        if (document.getElementById('leave-bal-paid')) {
            document.getElementById('leave-bal-paid').innerText = stats.paid_leaves_taken || 0;
        }
    }
}

document.getElementById('applyLeaveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('leaveStart').value,
        end_date: document.getElementById('leaveEnd').value,
        reason: document.getElementById('leaveReason').value
    };
    const res = await fetchData('/employee/leaves/apply/', { method: 'POST', body: JSON.stringify(payload) });
    if (res) {
        alert('Leave request submitted successfully! An email has been sent to your manager.');
        document.getElementById('leave-form-container').style.display = 'none';
        document.getElementById('applyLeaveForm').reset();
        loadLeaves();
    }
});

// --- Holidays Module ---
async function loadHolidays() {
    const list = document.getElementById('holidaysList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="2" style="text-align:center;">Loading...</td></tr>';
    const data = await fetchData('/employee/holidays/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="2" style="text-align:center;">No upcoming holidays.</td></tr>';
        return;
    }
    list.innerHTML = '';
    data.forEach(h => {
        const hDateObj = parseDate(h.date);
        const date = formatDateDisplay(hDateObj) || h.date;
        list.innerHTML += `<tr><td><strong>${h.name}</strong></td><td>${date}</td></tr>`;
    });
}

// --- Expenses Module ---
async function loadExpenses() {
    const list = document.getElementById('expensesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    const data = await fetchData('/employee/expenses/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No expenses claimed.</td></tr>';
        return;
    }
    list.innerHTML = '';
    data.forEach(e => {
        const eDateObj = parseDate(e.date);
        const date = formatDateDisplay(eDateObj) || e.date;
        const statusCls = e.status.toLowerCase() === 'approved' ? 'active' : (e.status.toLowerCase() === 'rejected' ? 'inactive' : '');
        list.innerHTML += `<tr><td>${date}</td><td>${e.category}</td><td>₹${parseFloat(e.amount).toFixed(2)}</td><td><span class="status ${statusCls}">${e.status}</span></td></tr>`;
    });
}

document.getElementById('applyExpenseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        category: document.getElementById('expenseCategory').value,
        date: document.getElementById('expenseDate').value,
        amount: document.getElementById('expenseAmount').value,
        description: document.getElementById('expenseDesc').value
    };
    const res = await fetchData('/employee/expenses/', { method: 'POST', body: JSON.stringify(payload) });
    if (res) {
        alert('Expense claimed successfully!');
        document.getElementById('expense-form-container').style.display = 'none';
        document.getElementById('applyExpenseForm').reset();
        loadExpenses();
        loadDashboardStats();
    }
});

// --- Tasks Module ---
async function loadTasks() {
    const list = document.getElementById('tasksList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/employee/tasks/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center;">No tasks assigned.</td></tr>';
        return;
    }

    list.innerHTML = '';
    let rows = '';
    data.forEach(task => {
        const dDateObj = parseDate(task.deadline);
        const deadline = formatDateDisplay(dDateObj) || (task.deadline || '-');
        const priorityColor = task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981');
        const statusCls = task.status === 'Completed' ? 'active' : (task.status === 'In Progress' ? 'pending' : 'expired');

        rows += `
            <tr>
                <td style="font-weight: 500;">${task.title}</td>
                <td style="font-size:0.85rem; color:var(--text-muted); max-width:250px;">${task.description || '-'}</td>
                <td style="font-size:0.85rem; color:var(--primary); max-width:200px;"><i>${task.employee_note || '-'}</i></td>
                <td>${deadline}</td>
                <td><span style="color:${priorityColor}">${task.priority}</span></td>
                <td><span class="status ${statusCls}">${task.status}</span></td>
                <td>
                    <div style="display:flex; gap:0.5rem;">
                        ${task.status !== 'Completed' ? `<button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="updateTask(${task.id})">Update</button>` : '<span style="color:#10b981;"><i class="fa-solid fa-check"></i> Finished</span>'}
                    </div>
                </td>
            </tr>
        `;
    });
    list.innerHTML = rows;
}

async function updateTask(taskId) {
    const note = prompt('Add a note or update task status (leave blank if none):');
    if (note === null) return;

    const markDone = confirm('Mark this task as completed?');

    const payload = { task_id: taskId };
    if (note) payload.employee_note = note;
    if (markDone) payload.status = 'Completed';

    const res = await fetchData('/employee/tasks/update/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (res) {
        alert('Task updated!');
        loadTasks();
    }
}

// --- Org Chart Module ---
async function loadOrgChart() {
    const container = document.getElementById('orgChartTree');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center;">Loading hierarchy...</div>';

    const data = await fetchData('/org-chart/');
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); text-align:center;">No organization data found.</div>';
        return;
    }

    container.innerHTML = '';
    const treeRoot = document.createElement('ul');

    // Find top-level nodes (those whose manager is null)
    const topLevelNodes = data.filter(node => !node.manager);

    topLevelNodes.forEach(node => {
        treeRoot.appendChild(buildTreeNode(node, data));
    });

    container.appendChild(treeRoot);
}

function buildTreeNode(node, allData) {
    const li = document.createElement('li');

    // Node's content
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';

    // extra content 
    if (node.work_mode) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'node-mode';
        modeBadge.innerText = node.work_mode;
        nodeDiv.appendChild(modeBadge);
    }

    // Profile picture
    if (node.profile_picture) {
        const img = document.createElement('img');
        img.src = node.profile_picture;
        img.className = 'node-img';
        nodeDiv.appendChild(img);
    } else {
        const icon = document.createElement('div');
        icon.className = 'node-img';
        icon.innerHTML = '<i class="fa-solid fa-user" style="margin-top:12px; font-size:1.5rem; color:var(--text-muted);"></i>';
        icon.style.display = 'flex';
        icon.style.justifyContent = 'center';
        nodeDiv.appendChild(icon);
    }

    // ID Badge
    const idBadge = document.createElement('span');
    idBadge.innerText = `#${node.id}`;
    idBadge.style = 'position:absolute; top:5px; right:5px; font-size:0.6rem; color:var(--text-muted); font-weight:bold;';
    nodeDiv.appendChild(idBadge);

    const name = document.createElement('span');
    name.className = 'node-name';
    name.innerText = node.name;

    const role = document.createElement('span');
    role.className = 'node-role';
    role.innerText = node.role;

    const dept = document.createElement('span');
    dept.className = 'node-dept';
    dept.innerText = node.department;

    nodeDiv.appendChild(name);
    nodeDiv.appendChild(role);
    nodeDiv.appendChild(dept);

    li.appendChild(nodeDiv);

    // children
    const children = allData.filter(item => item.manager === node.id);
    if (children.length > 0) {
        const ul = document.createElement('ul');
        children.forEach(child => {
            ul.appendChild(buildTreeNode(child, allData));
        });
        li.appendChild(ul);
    }

    return li;
}

// --- Notifications Module ---
async function loadNotifications() {
    const list = document.getElementById('receivedNotificationsList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading announcements...</td></tr>';

    const data = await fetchData('/notifications/');

    try {
        await fetchData('/notifications/mark-all-read/', { method: 'POST' });
        updateNotificationBadge();
        updateLeavesBadge();
    } catch (e) { console.error("Error marking all read:", e); }

    if (!data) return;

    list.innerHTML = '';
    if (data.received.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No announcements from management.</td></tr>';
        return;
    }

    data.received.forEach(notif => {
        const nDateObj = parseDate(notif.created_at);
        const date = formatDateDisplay(nDateObj, true) || notif.created_at;
        list.innerHTML += `
            <tr>
                <td>${date}</td>
                <td style="font-weight:600; color:var(--primary);">${notif.title}</td>
                <td>${notif.message}</td>
                <td>${notif.sender_name} (${notif.sender_role})</td>
            </tr>
        `;
    });
}

// --- Queries section---
async function loadQueries() {
    const list = document.getElementById('myQueriesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/admin/queries/'); // Reusing the same endpoint, backend handles filtering
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center;">No queries found.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(q => {
        const qDateObj = parseDate(q.created_at);
        const date = formatDateDisplay(qDateObj) || q.created_at;
        const target = q.target_role === 'manager' ? 'Manager' : 'Team Leader';
        const statusCls = q.status === 'resolved' ? 'active' : (q.status === 'in_progress' ? 'pending' : 'expired');

        list.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${target}</td>
                <td style="font-weight:500;">${q.subject}</td>
                <td style="font-size:0.85rem; color:var(--text-muted); max-width:300px;">${q.message}</td>
                <td><span class="status ${statusCls}">${q.status}</span></td>
            </tr>
        `;
    });
}

async function sendQuery(role) {
    const subject = document.getElementById('query-subject').value;
    const message = document.getElementById('query-message').value;

    if (!subject || !message) {
        alert('Please fill in both subject and message.');
        return;
    }

    const payload = {
        subject: subject,
        message: message,
        target_role: role
    };

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/queries/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const res = await response.json().catch(() => null);

    if (response.ok) {
        alert(`Query sent to ${role.replace('_', ' ')} successfully!`);
        document.getElementById('query-subject').value = '';
        document.getElementById('query-message').value = '';
        loadQueries();
    } else {
        console.error('Query Submission Error:', res);
        const errMsg = res && res.message ? res.message : (res ? JSON.stringify(res) : 'Unknown error');
        alert('Failed to send query: ' + errMsg);
    }
}

/* Payroll Module-Handles fetching and rendering of employee payroll data.
 */
async function loadPayroll() {
    const list = document.getElementById('selfPayrollList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading payroll records...</td></tr>';

    const data = await fetchData('/employee/payroll/');
    if (!data) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Failed to load payroll.</td></tr>';
        return;
    }

    if (data.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No payroll records found.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(p => {
        const tr = document.createElement('tr');
        const statClass = p.status === 'Paid' ? 'active' : 'pending';

        const isNightShift = (p.shift || '').toLowerCase() === 'night';
        const baseSalary = parseFloat(p.base_salary) || 10000.00;
        const bonus = isNightShift ? (baseSalary * 0.1) : 0;
        const totalAmount = baseSalary + bonus;

        tr.innerHTML = `
            <td>${p.month_year}</td>
            <td>₹${baseSalary.toFixed(2)}</td>
            <td>₹${bonus.toFixed(2)} ${isNightShift ? '<small>(Night Shift Bonus)</small>' : ''}</td>
            <td style="font-weight:700; color:var(--primary);">₹${totalAmount.toFixed(2)}</td>
            <td><span class="status ${statClass}">${p.status}</span></td>
            <td>
                <button class="btn btn-ghost" onclick="downloadSalarySlip(${p.id})" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                    <i class="fa-solid fa-download"></i> Download
                </button>
            </td>
        `;
        list.appendChild(tr);
    });
}

async function downloadSalarySlip(payrollId) {
    try {
        const payrolls = await fetchData('/employee/payroll/');
        const p = payrolls.find(item => item.id === payrollId);
        if (!p) return alert("Payroll record not found.");

        const leavesData = await fetchData('/employee/leaves/');
        let deductibleDays = 0;
        let totalLeavesInMonth = 0;
        const usedInYear = { sick: 0, casual: 0, vacation: 0 };
        const countedDates = { sick: new Set(), casual: new Set(), vacation: new Set() };

        if (leavesData && Array.isArray(leavesData)) {
            const [pMonthName, pYear] = p.month_year.toLowerCase().split(' ');
            const monthMap = {
                'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
                'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
                'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
                'nov': 11, 'november': 11, 'dec': 12, 'december': 12
            };
            const targetMonth = monthMap[pMonthName];
            const targetYear = parseInt(pYear);

            const holidays2026 = ['2026-01-26', '2026-08-15', '2026-10-02', '2026-12-25'];

            const approvedYearLeaves = leavesData
                .filter(l => String(l.status).toLowerCase() === 'approved')
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            approvedYearLeaves.forEach(l => {
                const [sY, sM, sD] = l.start_date.split('-').map(Number);
                const [eY, eM, eD] = l.end_date.split('-').map(Number);
                const start = new Date(sY, sM - 1, sD);
                const end = new Date(eY, eM - 1, eD);

                const type = String(l.leave_type).toLowerCase();
                let category = 'vacation';
                if (type.includes('sick')) category = 'sick';
                else if (type.includes('casual')) category = 'casual';

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    if (d.getFullYear() === targetYear) {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${day}`;

                        const dayOfWeek = d.getDay();
                        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                        const isHoliday = holidays2026.includes(dateStr);

                        if (!isWeekend && !isHoliday && !countedDates[category].has(dateStr)) {
                            countedDates[category].add(dateStr);
                            usedInYear[category]++;

                            if ((d.getMonth() + 1) === targetMonth) {
                                totalLeavesInMonth++;
                                if (usedInYear[category] > 6) {
                                    deductibleDays++;
                                }
                            }
                        }
                    }
                }
            });
        }

        const isNightShift = (p.shift || '').toLowerCase() === 'night';
        const baseSalary = parseFloat(p.base_salary) || 10000.00;
        const bonus = isNightShift ? (baseSalary * 0.1).toFixed(2) : '0.00';
        const deduction = deductibleDays * 500;
        const totalAmount = (baseSalary + parseFloat(bonus)) - deduction;

        const fullName = p.employee_name && p.employee_name.trim() !== '' ? p.employee_name : (p.username || 'Employee');

        const element = document.createElement('div');
        element.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #333; background: #fff; width: 700px; margin: 0 auto; border: 1px solid #eee;">
                <!-- Header with Logo -->
                <div style="display: flex; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
                    <img src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop/AQEZlaZbvrt8n2qw/shnoor_tm_logo-removebg-preview-Y4LPVNJDezc30XEY.png" 
                         style="height: 60px; margin-right: 20px;" alt="Company Logo">
                    <div style="flex: 1; text-align: left;">
                        <div style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 2px;">SHNOOR HRMS PORTAL</div>
                        <div style="font-size: 16px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Salary Slip for ${p.month_year}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
                    <div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Employee Name:</strong> ${fullName}</div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Employee ID:</strong> ${p.id}</div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Designation:</strong> ${p.employment_type || 'Staff'}</div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Shift:</strong> ${p.shift || 'Day'}</div>
                    </div>
                    <div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Bank Name:</strong> ${p.bank_account ? 'HDFC Bank' : '-'}</div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>Account Number:</strong> ${p.bank_account || '-'}</div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>IFSC Code:</strong> ${p.ifsc_code || '-'}</div>
                        <div style="font-size: 14px; margin-bottom: 8px;"><strong>PAN Number:</strong> ${p.pan_number || '-'}</div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px;">
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Description</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Base Salary</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">₹${baseSalary.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Shift Bonus (10% ${isNightShift ? 'Night Shift' : 'Applicable for Night'})</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">₹${bonus}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Leaves Taken (${totalLeavesInMonth} working days)</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; color: ${deductibleDays > 0 ? '#f43f5e' : '#333'};">
                                ${deductibleDays > 0 ? `- ₹${deduction.toFixed(2)}` : '₹0.00'}
                            </td>
                        </tr>
                        <tr style="background: #f1f5f9; font-weight: 700; font-size: 18px;">
                            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Net Payable</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">₹${totalAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="text-align: center; margin-top: 80px; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; pt: 20px;">
                    This is a computer-generated salary slip and does not require a physical signature.
                </div>
            </div>
        `;

        const opt = {
            margin: 0.5,
            filename: `Salary_Slip_${p.month_year.replace(' ', '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const img = element.querySelector('img');
        if (img) {
            img.onload = () => {
                html2pdf().from(element).set(opt).save();
            };
            if (img.complete) {
                html2pdf().from(element).set(opt).save();
            }
        } else {
            html2pdf().from(element).set(opt).save();
        }

    } catch (err) {
        console.error("Salary slip generation error:", err);
        alert("Failed to generate salary slip.");
    }
}

// --- Offboarding Module ---
async function loadOffboardings() {
    const list = document.getElementById('offboardingList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem;">Loading...</td></tr>';

    try {
        const data = await fetchData('/employee/offboardings/');
        if (!data || data.length === 0) {
            list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">No offboarding records found.</td></tr>';
            return;
        }

        list.innerHTML = data.map(item => `
            <tr>
                <td>${item.date || new Date(item.created_at).toLocaleDateString()}</td>
                <td><span class="status ${item.action_type === 'warning' ? 'inactive' : 'expired'}">${item.action_type.toUpperCase()}</span></td>
                <td>${item.reason}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error loading offboardings:", error);
        list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color: #f43f5e;">Failed to load data.</td></tr>';
    }
}

// --- Reports Module ---
async function loadReports() {
    const totalTasksEl = document.getElementById('report-total-tasks');
    const onTimeTasksEl = document.getElementById('report-on-time-tasks');
    const monthlyHoursEl = document.getElementById('report-monthly-hours');
    const monthlyLeavesEl = document.getElementById('report-monthly-leaves');
    const summaryTextEl = document.getElementById('report-summary-text');

    if (!totalTasksEl) return;

    totalTasksEl.innerText = '...';
    onTimeTasksEl.innerText = '...';
    monthlyHoursEl.innerText = '...';
    monthlyLeavesEl.innerText = '...';

    try {
        const data = await fetchData('/employee/reports/');
        if (!data) return;

        totalTasksEl.innerText = data.total_tasks || 0;
        onTimeTasksEl.innerText = data.on_time_tasks || 0;
        monthlyHoursEl.innerText = (data.monthly_hours || 0).toFixed(1) + 'h';
        monthlyLeavesEl.innerText = data.total_used_leaves || 0;

        const efficiency = data.total_tasks > 0 ? ((data.on_time_tasks / data.total_tasks) * 100).toFixed(1) : '0';

        let insight = `
            <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem;">
                <li style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-circle-check" style="color: #10b981; width: 20px;"></i>
                    <span>Out of <strong>${data.total_tasks} tasks</strong> assigned, <strong>${data.on_time_tasks}</strong> were completed on time.</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-bolt" style="color: #f59e0b; width: 20px;"></i>
                    <span>Your overall completion efficiency is <strong>${efficiency}%</strong>.</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-clock" style="color: var(--primary); width: 20px;"></i>
                    <span>Total attendance recorded this month: <strong>${data.monthly_hours.toFixed(1)} hrs</strong>.</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-calendar-xmark" style="color: #f43f5e; width: 20px;"></i>
                    <span>Total leaves taken: <strong>${data.total_used_leaves} days</strong>.</span>
                </li>
            </ul>
        `;

        summaryTextEl.innerHTML = insight;

    } catch (error) {
        console.error("Error loading reports:", error);
        summaryTextEl.innerText = "Failed to load report data. Please try again later.";
    }
}
