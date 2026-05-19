const BASE_URL = 'http://127.0.0.1:8000/api';
let currentMode = 'manager'; // 'manager' or 'self'

// --- Auth & API Fetch ---
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
    }
    return token;
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

    // Normalize string: take only the date part and trim
    const cleanStr = dateStr.split(' ')[0].split('T')[0].trim();

    // Try splitting by common separators
    const parts = cleanStr.split(/[-/]/);

    if (parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const p3 = parseInt(parts[2], 10);

        // Case 1: YYYY-MM-DD
        if (parts[0].length === 4) {
            return new Date(p1, p2 - 1, p3);
        }
        // Case 2: DD-MM-YYYY
        if (parts[2].length === 4) {
            return new Date(p3, p2 - 1, p1);
        }
    }

    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
}

function formatDateDisplay(date) {
    if (!date || isNaN(date.getTime())) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTime(dateStr) {
    if (!dateStr || dateStr === '-') return '-';

    // If it's already in "HH:MM AM/PM" format, return it
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(dateStr)) {
        return dateStr;
    }

    // Try standard Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    // Fallback for custom formats like "13-05-2026 10:23:22" or "13 05 2026 11:13:02"
    // Extract HH:MM part using regex
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

/**
 * Format Decimal Hours to Hr Min
 */
function formatHoursToHrMin(decimalHours) {
    const val = parseFloat(decimalHours);
    if (isNaN(val)) return '-';
    const totalMinutes = Math.round(val * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
}

async function fetchData(endpoint, options = {}) {
    const token = getToken();
    const defaultHeaders = {
        'Authorization': `Token ${token}`
    };

    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const url = BASE_URL + endpoint + (endpoint.includes('?') ? '&' : '?') + '_t=' + Date.now();

        const response = await fetch(url, config);
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            return null;
        }

        // For 204 No Content
        if (response.status === 204) return true;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// --- Navigation & Mode Toggle ---
const navItems = document.querySelectorAll('.nav-item[data-target]');
const views = document.querySelectorAll('.view-section');

function switchTab(targetId) {
    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));

    const activeItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (activeItem) activeItem.classList.add('active');

    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active');

    loadDataForTab(targetId);

    // If opening queries, hide badge after 3 seconds
    if (targetId === 'queries') {
        const badge = document.getElementById('query-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }

    // If opening leaves, hide badge immediately
    if (targetId === 'leaves') {
        const badge = document.getElementById('leaves-badge');
        if (badge) badge.style.display = 'none';
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target');
        switchTab(targetId);
    });
});

const modeBtns = document.querySelectorAll('.mode-toggle-btn');
const managerElements = document.querySelectorAll('.manager-only');
const selfElements = document.querySelectorAll('.self-only');

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
        modeBtns.forEach(b => b.classList.add('btn-ghost'));

        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-ghost');

        currentMode = btn.getAttribute('data-mode');
        document.body.classList.remove('mode-manager', 'mode-self');
        document.body.classList.add('mode-' + currentMode);

        if (currentMode === 'manager') {
            managerElements.forEach(el => el.style.display = '');
            selfElements.forEach(el => el.style.display = 'none');
        } else {
            managerElements.forEach(el => el.style.display = 'none');
            selfElements.forEach(el => el.style.display = '');
        }

        const activeNav = document.querySelector('.nav-item.active');
        let currentTarget = activeNav ? activeNav.getAttribute('data-target') : 'dashboard';

        if (activeNav && activeNav.style.display === 'none') {
            currentTarget = 'dashboard';
            switchTab(currentTarget);
        } else {
            loadDataForTab(currentTarget);
        }
    });
});

function loadDataForTab(tabId) {
    console.log(`Loading data for tab: ${tabId}`);
    if (tabId === 'dashboard') {
        loadDashboardStats();
    } else if (tabId === 'employees') {
        loadEmployees();
    } else if (tabId === 'attendance') {
        const search = document.getElementById('team-attendance-search')?.value || '';
        const date = document.getElementById('team-attendance-date')?.value || '';
        loadAttendance(search, date);
    } else if (tabId === 'leaves') {
        loadLeaves();
    } else if (tabId === 'profile') {
        loadProfile();
    } else if (tabId === 'documents') {
        loadDocuments();
    } else if (tabId === 'tasks') {
        loadTasks();
    } else if (tabId === 'payroll') {
        loadPayroll();
    } else if (tabId === 'expenses') {
        loadManagerExpenses();
    } else if (tabId === 'policies') {
        loadPolicies();
    } else if (tabId === 'orgchart') {
        loadOrgChart();
    } else if (tabId === 'notifications') {
        loadNotifications();
    } else if (tabId === 'manage-profiles-section') {
        loadEmployeeProfiles();
    } else if (tabId === 'queries') {
        loadQueries();
    } else if (tabId === 'appreciations') {
        loadAppreciations();
    } else if (tabId === 'offboardings') {
        loadOffboardings();
    }
}

// --- Data Loaders ---

async function loadDashboardStats() {
    if (currentMode === 'manager') {
        const now = new Date();
        // Format for attendance comparison (matches backend DD-MM-YYYY)
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const todayAttendance = `${dd}-${mm}-${yyyy}`;

        // Format for leave comparison (YYYY-MM-DD)
        const todayLeave = now.toLocaleDateString('en-CA');

        const lastUpdatedEl = document.getElementById('dash-last-updated');
        if (lastUpdatedEl) lastUpdatedEl.innerText = now.toLocaleTimeString();

        const emps = await fetchData('/manager/employees/');
        const teamTotalEl = document.getElementById('dash-team-total');
        if (emps && teamTotalEl) {
            teamTotalEl.innerText = emps.length;
        }

        const att = await fetchData('/manager/attendance/');
        const teamPresentEl = document.getElementById('dash-team-present');
        const teamHoursEl = document.getElementById('dash-team-hours');
        if (att) {
            // Count UNIQUE employees who are present today
            const presentToday = att.filter(a => a.status === 'Present');
            const uniquePresent = new Set(presentToday.map(a => a.employee_name)).size;
            if (teamPresentEl) teamPresentEl.innerText = uniquePresent;

            // Calculate total hours today
            const totalHoursToday = att.reduce((sum, a) => sum + parseFloat(a.hours_worked || 0), 0);
            if (teamHoursEl) teamHoursEl.innerText = totalHoursToday.toFixed(1);
        }

        const leaves = await fetchData('/manager/leaves/');
        const teamLeaveEl = document.getElementById('dash-team-leave');
        if (leaves && teamLeaveEl) {
            // Only count APPROVED leaves where TODAY is within the range
            const onLeave = leaves.filter(l => {
                const status = (l.status || '').toLowerCase();
                return status === 'approved' && todayLeave >= l.start_date && todayLeave <= l.end_date;
            }).length;
            teamLeaveEl.innerText = onLeave;
        }
    } else {
        const stats = await fetchData('/employee/stats/');
        const profile = await fetchData('/manager/profile/');
        if (profile) {
            document.getElementById('self-dash-name').innerText = (profile.first_name || '') + ' ' + (profile.last_name || '');
            document.getElementById('self-dash-role').innerText = profile.designation || 'Manager';
            document.getElementById('self-dash-email').innerText = profile.email || '';
        }
    }

    // Update Notification Badges
    updateQueryBadge();
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

async function loadEmployees() {
    if (currentMode !== 'manager') return;
    const emps = await fetchData('/manager/employees/');
    if (!emps) return;
    const tbody = document.getElementById('employeesList');
    tbody.innerHTML = '';
    emps.forEach(emp => {
        tbody.innerHTML += `
            <tr>
                <td>${emp.first_name} ${emp.last_name}</td>
                <td>${emp.email}</td>
                <td>${emp.designation}</td>
                <td><span class="status active">Active</span></td>
            </tr>
        `;
    });
}

let managerAttendanceRawData = [];
let managerCurrentCalendarDate = new Date();
let selfAttendanceRawData = [];
let selfCurrentCalendarDate = new Date();

async function loadAttendance(passedSearch = '', passedDate = '') {
    console.log("loadAttendance called, currentMode:", currentMode);
    if (currentMode === 'manager') {
        const selectEl = document.getElementById('team-attendance-employee-select');
        if (selectEl && selectEl.options.length <= 1) {
            const emps = await fetchData('/manager/employees/');
            if (emps) {
                emps.forEach(emp => {
                    const name = (emp.first_name || emp.last_name) ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : `Employee #${emp.id}`;
                    if (!name.trim()) return; // Skip if empty
                    const option = document.createElement('option');
                    option.value = emp.id;
                    option.textContent = name;
                    option.style.background = '#1e293b';
                    option.style.color = '#fff';
                    selectEl.appendChild(option);
                });
            }
        }

        const inputSearch = selectEl && selectEl.value ? selectEl.options[selectEl.selectedIndex].text : '';
        const inputDate = document.getElementById('team-attendance-date')?.value;

        const search = passedSearch || inputSearch || '';
        const date = passedDate || inputDate || '';

        const year = managerCurrentCalendarDate.getFullYear();
        const month = managerCurrentCalendarDate.getMonth();
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

        let url = '/manager/attendance/?t=' + new Date().getTime();
        if (search) url += `&search=${encodeURIComponent(search)}`;
        // Always fetch data for the whole month for the calendar view
        url += `&start_date=${startDate}&end_date=${endDate}`;

        const data = await fetchData(url);
        if (!data) return;

        managerAttendanceRawData = data; // Save for calendar view

        const tbody = document.getElementById('teamAttendanceList');

        if (data.length > 0) {
            // Group by employee_name and date
            const grouped = {};
            const order = [];

            data.forEach(rec => {
                const key = `${rec.employee_name}_${rec.date}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        employee_id: rec.employee_id,
                        employee_name: rec.employee_name,
                        date: rec.date,
                        sessions: [],
                        status: rec.status
                    };
                    order.push(key);
                }
                grouped[key].sessions.push({
                    id: rec.attendance_id,
                    in: rec.check_in,
                    out: rec.check_out,
                    hours: parseFloat(rec.hours_worked || 0)
                });
            });

            let rows = '';
            order.forEach(key => {
                const item = grouped[key];
                const dateObj = parseDate(item.date);
                const todayStr = new Date().toLocaleDateString('en-CA');
                const isToday = dateObj && dateObj.toLocaleDateString('en-CA') === todayStr;

                const totalDayHoursRaw = item.sessions.reduce((sum, s) => sum + s.hours, 0);
                const totalDayHoursFormatted = formatHoursToHrMin(totalDayHoursRaw);

                // Format sessions
                const sortedSessions = item.sessions.sort((a, b) => {
                    if (a.in === '-') return 1;
                    if (b.in === '-') return -1;
                    return new Date(`2000-01-01 ${a.in}`) - new Date(`2000-01-01 ${b.in}`);
                });

                let sessionHtml = sortedSessions.map(s => {
                    if (s.in === '-' && s.out === '-') {
                        return `<div style="margin-bottom: 4px; font-size: 0.9rem; font-family: monospace;">-</div>`;
                    }
                    return `<div style="margin-bottom: 4px; font-size: 0.9rem; font-family: monospace; display: flex; justify-content: space-between; align-items: center;">
                                <span>${s.in} <i class="fa-solid fa-arrow-right" style="font-size: 0.7rem; opacity: 0.5; margin: 0 5px;"></i> ${s.out}</span>
                                <button class="btn btn-ghost" style="padding: 0.1rem 0.3rem; font-size: 0.7rem; margin-left: 5px;" onclick="editAttendance('${s.id}', '${item.date}', '${s.in}', '${s.out}')"><i class="fa-solid fa-edit"></i></button>
                            </div>`;
                }).join('');

                const statClass = item.status === 'Present' ? 'badge-success' : 'badge-danger';

                rows += `
                    <tr>
                        <td style="vertical-align: top; font-weight: 500;">${item.employee_name}</td>
                        <td style="vertical-align: top;">${isToday ? 'Today' : item.date}</td>
                        <td>${sessionHtml}</td>
                        <td style="text-align: center; vertical-align: top; font-weight: 700; color: var(--primary); font-size: 1.1rem;">${totalDayHoursFormatted}</td>
                        <td style="vertical-align: top;"><span class="status ${statClass}">${item.status}</span></td>
                        <td style="vertical-align: top;">
                            <button class="btn btn-ghost" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="addAttendance('${item.employee_id}', '${item.date}')" title="Add Session"><i class="fa-solid fa-plus"></i></button>
                        </td>
                    </tr>
                `;
            });
            if (tbody) {
                tbody.innerHTML = rows;
            }
        } else {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No attendance records found for this date.</td></tr>';
            }
        }

        console.log("Calling renderManagerAttendanceCalendar from loadAttendance");
        renderManagerAttendanceCalendar(); // Render calendar view
    } else {
        const data = await fetchData('/employee/attendance/');
        if (!data) return;
        
        selfAttendanceRawData = data; // Save for calendar view
        renderSelfAttendanceCalendar(); // Render calendar view
        
        const tbody = document.getElementById('selfAttendanceList');
        if (!tbody) return;

        const grouped = {};
        const order = [];

        data.forEach(rec => {
            if (!grouped[rec.date]) {
                grouped[rec.date] = {
                    date: rec.date,
                    sessions: [],
                    total_hours: rec.total_day_hours || 0,
                    status: rec.status
                };
                order.push(rec.date);
            }
            grouped[rec.date].sessions.push({ in: rec.check_in, out: rec.check_out });
        });

        tbody.innerHTML = '';
        order.forEach(dateKey => {
            const item = grouped[dateKey];
            const dateObj = parseDate(item.date);
            const dateStr = dateObj ? formatDateDisplay(dateObj) : item.date;

            const sortedSessions = item.sessions.sort((a, b) => new Date(a.in) - new Date(b.in));
            const sessionHtml = sortedSessions.map(s => {
                const inT = formatTime(s.in);
                const outT = s.out ? formatTime(s.out) : 'Still In';
                return `<div style="margin-bottom: 4px; font-family: monospace;">${inT} - ${outT}</div>`;
            }).join('');

            const statClass = item.status === 'Present' ? 'active' : 'expired';
            const totalHoursFormatted = formatHoursToHrMin(parseFloat(item.total_hours));

            tbody.innerHTML += `
                <tr>
                    <td style="vertical-align: top; font-weight: 500;">${dateStr}</td>
                    <td>${sessionHtml}</td>
                    <td style="text-align: center; vertical-align: top; font-weight: 700; color: var(--primary);">${totalHoursFormatted}</td>
                    <td style="vertical-align: top;"><span class="status ${statClass}">${item.status}</span></td>
                </tr>
            `;
        });
    }
}

async function loadLeaves() {
    if (currentMode === 'manager') {
        const data = await fetchData('/manager/leaves/');
        if (!data) return;
        const tbody = document.getElementById('teamLeavesList');
        tbody.innerHTML = '';
        data.forEach(req => {
            const status = (req.status || '').toLowerCase();
            const statClass = status === 'approved' ? 'active' : (status === 'rejected' ? 'expired' : 'pending');

            tbody.innerHTML += `
                <tr>
                    <td>${req.employee_name}</td>
                    <td>${req.leave_type}</td>
                    <td>${req.start_date} to ${req.end_date}</td>
                    <td>
                        ${status === 'pending' ? `
                            <button class="btn btn-primary" onclick="updateLeaveStatus(${req.id}, 'Approved')" style="padding: 0.25rem 0.75rem; font-size:0.75rem; margin-right: 5px;">Approve</button>
                            <button class="btn btn-ghost" onclick="updateLeaveStatus(${req.id}, 'Rejected')" style="padding: 0.25rem 0.75rem; font-size:0.75rem; color:#f43f5e;">Reject</button>
                        ` : `<span class="status ${statClass}">${req.status}</span>`}
                    </td>
                </tr>
            `;
        });
    } else {
        const data = await fetchData('/employee/leaves/');
        if (!data) return;
        const tbody = document.getElementById('selfLeavesList');
        tbody.innerHTML = '';
        data.forEach(req => {
            const status = (req.status || '').toLowerCase();
            const statClass = status === 'approved' ? 'active' : (status === 'rejected' ? 'expired' : 'pending');
            tbody.innerHTML += `
                <tr>
                    <td>${req.leave_type}</td>
                    <td>${req.start_date} to ${req.end_date}</td>
                    <td><span class="status ${statClass}">${req.status}</span></td>
                </tr>
            `;
        });
    }
}

async function updateLeaveStatus(id, newStatus) {
    const res = await fetchData('/manager/leaves/update-status/', {
        method: 'POST',
        body: JSON.stringify({ leave_id: id, status: newStatus })
    });
    if (res) loadLeaves();
}

async function loadProfile() {
    const data = await fetchData('/manager/profile/');
    if (!data) return;
    // Personal Details
    document.getElementById('prof-fname').value = data.first_name || '';
    document.getElementById('prof-lname').value = data.last_name || '';
    document.getElementById('prof-email').value = data.email || '';
    document.getElementById('prof-phone').value = data.phone || '';
    document.getElementById('prof-gender').value = data.gender || '';
    document.getElementById('prof-dob').value = formatDateForInput(data.date_of_birth);
    document.getElementById('prof-address').value = data.address || '';

    // Professional Details
    document.getElementById('prof-empid').value = data.employee_id || '';
    document.getElementById('prof-joining').value = formatDateForInput(data.joining_date);
    document.getElementById('prof-designation').value = data.designation || '';
    document.getElementById('prof-department').value = data.department || '';

    // Bank Details
    document.getElementById('prof-bankname').value = data.bank_name || '';
    document.getElementById('prof-account').value = data.account_number || '';
    document.getElementById('prof-ifsc').value = data.ifsc_code || '';
    document.getElementById('prof-branch').value = data.branch || '';

    // Added Fields Mapping
    document.getElementById('prof-aadhaar').value = data.aadhaar_number || '';
    document.getElementById('prof-pan').value = data.pan_number || '';
    document.getElementById('prof-marital').value = data.marital_status || '';
    document.getElementById('prof-nationality').value = data.nationality || '';
    document.getElementById('prof-blood').value = data.blood_group || '';
    document.getElementById('prof-perm-address').value = data.permanent_address || '';
    document.getElementById('prof-emg-name').value = data.emergency_contact_name || '';
    document.getElementById('prof-emg-phone').value = data.emergency_contact_phone || '';
    document.getElementById('prof-emg-relation').value = data.emergency_contact_relation || '';
}

async function loadTasks() {
    if (currentMode === 'manager') {
        const data = await fetchData('/manager/tasks/');
        if (!data) return;
        window.allTeamTasks = data; // Store globally to avoid passing complex strings in onclick
        const tbody = document.getElementById('teamTasksList');
        tbody.innerHTML = '';
        data.forEach(task => {
            const statClass = task.status === 'Completed' ? 'active' : (task.status === 'In Progress' ? 'pending' : 'expired');
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:600; padding: 0.75rem; word-break: break-word;">${task.title}</td>
                    <td style="color:var(--text-muted); padding: 0.75rem; word-break: break-word; white-space: normal;">${task.description || '-'}</td>
                    <td style="padding: 0.75rem; word-break: break-all;">${task.assigned_to_email}</td>
                    <td style="padding: 0.75rem;">${task.deadline || '-'}</td>
                    <td style="padding: 0.75rem;"><span style="color:${task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981')}">${task.priority}</span></td>
                    <td style="padding: 0.75rem;"><span class="status ${statClass}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">${task.status}</span></td>
                    <td style="color:var(--primary); padding: 0.75rem; word-break: break-word; white-space: normal;"><i>${task.employee_note || '-'}</i></td>
                    <td style="padding: 0.75rem;">
                        <button class="btn btn-ghost" style="padding: 0.2rem 0.4rem; font-size:0.7rem;" onclick="editTask(${task.id})">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } else {
        const data = await fetchData('/employee/tasks/');
        if (!data) return;
        const tbody = document.getElementById('selfTasksList');
        tbody.innerHTML = '';
        data.forEach(task => {
            const statClass = task.status === 'Completed' ? 'active' : (task.status === 'In Progress' ? 'pending' : 'expired');
            tbody.innerHTML += `
                <tr>
                    <td>${task.title}</td>
                    <td>${task.deadline || '-'}</td>
                    <td><span style="color:${task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981')}">${task.priority}</span></td>
                    <td><span class="status ${statClass}">${task.status}</span></td>
                </tr>
            `;
        });
    }
}

async function loadDocuments() {
    const data = await fetchData('/employee/documents/');
    if (!data) return;
    const tbody = document.getElementById('documentsList');
    tbody.innerHTML = '';
    data.forEach(doc => {
        const docDateObj = parseDate(doc.uploaded_at);
        const docDateStr = docDateObj ? docDateObj.toLocaleDateString() : doc.uploaded_at;
        tbody.innerHTML += `
            <tr>
                <td>${doc.title}</td>
                <td>${docDateStr}</td>
                <td>
                    <a href="${doc.file}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration:none;">Download</a>
                </td>
            </tr>
        `;
    });
}

let allPayrollData = [];

async function loadPayroll() {
    const list = document.getElementById('teamPayrollList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/manager/payroll/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No payroll data found.</td></tr>';
        return;
    }

    allPayrollData = data;
    list.innerHTML = '';
    data.forEach(item => {
        const statClass = item.status === 'Paid' ? 'active' : 'pending';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.employee_name || item.username}</td>
            <td>${item.month_year}</td>
            <td>₹${item.amount}</td>
            <td><span class="status ${statClass}">${item.status}</span></td>
        `;
        list.appendChild(tr);
    });
}

function showDetailedPayrollModal() {
    const modal = document.getElementById('detailedPayrollModal');
    const list = document.getElementById('detailedPayrollList');
    if (!modal || !list) return;

    list.innerHTML = '';
    if (allPayrollData.length === 0) {
        list.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem;">No payroll data loaded.</td></tr>';
    } else {
        allPayrollData.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.employee_name || p.username}</td>
                <td>${p.bank_account || '-'}</td>
                <td>${p.ifsc_code || '-'}</td>
                <td>${p.pan_number || '-'}</td>
                <td style="text-transform: capitalize;">${p.shift || 'Day'}</td>
                <td>₹${p.base_salary || '10000.00'}</td>
                <td style="font-weight: 700; color: var(--primary);">₹${p.amount}</td>
                <td style="text-transform: capitalize;">${p.employment_type || 'Employee'}</td>
            `;
            list.appendChild(tr);
        });
    }
    modal.style.display = 'block';
}

function closeDetailedPayrollModal() {
    const modal = document.getElementById('detailedPayrollModal');
    if (modal) modal.style.display = 'none';
}

async function showAddPayrollModal() {
    const modal = document.getElementById('addPayrollModal');
    const select = document.getElementById('payrollEmployee');
    if (!modal || !select) return;

    modal.style.display = 'block';

    const dateInput = document.getElementById('payrollDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    select.innerHTML = '<option value="">Loading employees...</option>';

    try {
        const employees = await fetchData('/manager/employees/');
        if (employees && employees.length > 0) {
            window.allTeamEmployees = employees;
            select.innerHTML = '<option value="">Select Employee...</option>';
            employees.forEach(emp => {
                const name = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : (emp.username || `Employee #${emp.id}`);
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = name;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No employees found</option>';
        }
    } catch (err) {
        console.error("Error loading employees for payroll:", err);
        select.innerHTML = '<option value="">Error loading employees</option>';
    }
}

function updatePayrollEmpDetails() {
    const select = document.getElementById('payrollEmployee');
    const panel = document.getElementById('payrollEmpDetails');
    if (!select || !panel || !window.allTeamEmployees) return;

    const empId = select.value;
    if (!empId) {
        panel.style.display = 'none';
        return;
    }

    const emp = window.allTeamEmployees.find(e => String(e.id) === String(empId));
    if (emp) {
        document.getElementById('pay-det-id').innerText = emp.employee_id || '-';
        document.getElementById('pay-det-shift').innerText = emp.shift || 'day';
        document.getElementById('pay-det-bank').innerText = emp.bank_name || '-';
        document.getElementById('pay-det-ifsc').innerText = emp.ifsc_code || '-';
        document.getElementById('pay-det-acc').innerText = emp.account_number || '-';
        document.getElementById('pay-det-pan').innerText = emp.pan_number || '-';
        document.getElementById('pay-det-type').innerText = emp.employment_type || 'employee';
        const displaySalary = (parseFloat(emp.salary) > 0) ? `₹${emp.salary}` : '₹10000.00';
        document.getElementById('pay-det-salary').innerText = displaySalary;

        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function closeAddPayrollModal() {
    const modal = document.getElementById('addPayrollModal');
    if (modal) modal.style.display = 'none';
}

// Handle Add Payroll Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const addPayrollForm = document.getElementById('addPayrollForm');
    if (addPayrollForm) {
        addPayrollForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const employeeId = document.getElementById('payrollEmployee').value;
            const monthYear = document.getElementById('payrollMonthYear').value;
            const amountInput = document.getElementById('payrollAmount');
            const amount = amountInput ? amountInput.value : "";
            const paymentDate = document.getElementById('payrollDate').value;
            const status = document.getElementById('payrollStatus').value;

            const payload = {
                employee: employeeId,
                month_year: monthYear,
                payment_date: paymentDate,
                status: status
            };

            if (amount) {
                payload.amount = amount;
            }

            try {
                const result = await fetchData('/manager/payroll/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (result) {
                    alert('Payroll record created successfully!');
                    closeAddPayrollModal();
                    loadPayroll(); // Refresh the list
                    addPayrollForm.reset();
                } else {
                    alert('Failed to create payroll record. Check console for details.');
                }
            } catch (err) {
                console.error("Error submitting payroll:", err);
                alert('An error occurred while creating payroll.');
            }
        });
    }
});

async function loadPolicies() {
    const list = document.getElementById('policiesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/manager/policies/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="3" style="text-align:center;">No policies found.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(policy => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${policy.title}</td>
            <td style="color:var(--text-muted); font-size:0.9rem;">${policy.description || 'No description'}</td>
            <td>
                <a href="${policy.file || '#'}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration:none;">View</a>
            </td>
        `;
        list.appendChild(tr);
    });
}

// --- Action Bindings ---

async function loadAppreciations() {
    if (currentMode !== 'manager') return;

    const select = document.getElementById('appr-employee');
    const list = document.getElementById('appreciationHistoryList');
    if (!select || !list) return;

    list.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading...</td></tr>';
    select.innerHTML = '<option value="">Loading employees...</option>';

    try {
        // Load employees for the dropdown
        const emps = await fetchData('/manager/employees/');
        if (emps) {
            select.innerHTML = '<option value="">Select Employee...</option>';
            emps.forEach(emp => {
                const name = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username;
                select.innerHTML += `<option value="${emp.user}">${name} (${emp.email})</option>`;
            });
        }

        // Load appreciation history
        const history = await fetchData('/manager/appreciations/');
        if (!history || history.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted);">No appreciation history found.</td></tr>';
            return;
        }

        list.innerHTML = history.map(app => `
            <tr>
                <td>${app.recipient_username}</td>
                <td style="font-weight: 500;">${app.title}</td>
                <td style="color: #10b981; font-weight: 600;">₹${app.amount}</td>
                <td>${new Date(app.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Error loading appreciations:", err);
        list.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#f43f5e; padding: 2rem;">Failed to load data.</td></tr>';
    }
}

// Handle Appreciation Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const appreciationForm = document.getElementById('appreciationForm');
    if (appreciationForm) {
        appreciationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                recipient: document.getElementById('appr-employee').value,
                title: document.getElementById('appr-title').value,
                description: document.getElementById('appr-description').value,
                amount: document.getElementById('appr-amount').value || 0
            };

            try {
                const result = await fetchData('/manager/appreciations/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (result) {
                    alert('Appreciation sent successfully!');
                    appreciationForm.reset();
                    loadAppreciations(); // Refresh the history
                } else {
                    alert('Failed to send appreciation.');
                }
            } catch (err) {
                console.error("Error sending appreciation:", err);
                alert('An error occurred.');
            }
        });
    }
});

document.getElementById('clock-in-btn')?.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/employee/attendance/clock-in/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const res = await response.json().catch(() => ({}));
    if (response.ok) {
        alert('Clocked In successfully');
        loadAttendance();
    } else {
        alert(res.message || 'Clock-in failed');
    }
});

document.getElementById('clock-out-btn')?.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/employee/attendance/clock-out/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const res = await response.json().catch(() => ({}));
    if (response.ok) {
        alert('Clocked Out successfully');
        loadAttendance();
    } else {
        alert(res.message || 'Clock-out failed');
    }
});

document.getElementById('applyLeaveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('leaveStart').value,
        end_date: document.getElementById('leaveEnd').value,
        reason: document.getElementById('leaveReason').value
    };
    const res = await fetchData('/employee/leaves/apply/', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (res) {
        document.getElementById('manager-leave-form').style.display = 'none';
        document.getElementById('applyLeaveForm').reset();
        loadLeaves();
    }
});

document.getElementById('profileUpdateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        // Personal Details
        first_name: document.getElementById('prof-fname')?.value,
        last_name: document.getElementById('prof-lname')?.value,
        email: document.getElementById('prof-email')?.value,
        phone: document.getElementById('prof-phone')?.value,
        gender: document.getElementById('prof-gender')?.value,
        date_of_birth: document.getElementById('prof-dob')?.value || null,
        address: document.getElementById('prof-address')?.value,

        // Professional Details
        employee_id: document.getElementById('prof-empid')?.value,
        joining_date: document.getElementById('prof-joining')?.value || null,
        designation: document.getElementById('prof-designation')?.value,
        department: document.getElementById('prof-department')?.value,

        // Bank Details
        bank_name: document.getElementById('prof-bankname')?.value,
        account_number: document.getElementById('prof-account')?.value,
        ifsc_code: document.getElementById('prof-ifsc')?.value,
        branch: document.getElementById('prof-branch')?.value,

        // Added Fields
        aadhaar_number: document.getElementById('prof-aadhaar')?.value,
        pan_number: document.getElementById('prof-pan')?.value,
        marital_status: document.getElementById('prof-marital')?.value,
        nationality: document.getElementById('prof-nationality')?.value,
        blood_group: document.getElementById('prof-blood')?.value,
        permanent_address: document.getElementById('prof-perm-address')?.value,
        emergency_contact_name: document.getElementById('prof-emg-name')?.value,
        emergency_contact_phone: document.getElementById('prof-emg-phone')?.value,
        emergency_contact_relation: document.getElementById('prof-emg-relation')?.value
    };
    const res = await fetchData('/manager/profile/update/', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    if (res) {
        alert('Profile updated successfully!');
        loadProfile();
    }
});

// --- Org Chart Module ---
async function loadOrgChart() {
    const container = document.getElementById('orgChartTree');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-muted);">Loading hierarchy...</div>';

    const data = await fetchData('/org-chart/');
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);">No organization data found.</div>';
        return;
    }

    container.innerHTML = '';
    const treeRoot = document.createElement('ul');

    const topLevelNodes = data.filter(node => !node.manager);

    topLevelNodes.forEach(node => {
        treeRoot.appendChild(buildTreeNode(node, data));
    });

    container.appendChild(treeRoot);
}

function buildTreeNode(node, allData) {
    const li = document.createElement('li');

    // Node content
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';

    // Add mode badge
    if (node.work_mode) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'node-mode';
        modeBadge.innerText = node.work_mode;
        nodeDiv.appendChild(modeBadge);
    }

    // Profile picture (fallback to icon)
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

    // Delete button for managers
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.className = 'btn btn-ghost';
    deleteBtn.style = 'position:absolute; bottom:5px; right:5px; padding:0.25rem; font-size:0.7rem; color:#f43f5e; opacity:0.3;';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteOrgNode(node.id);
    };
    deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
    deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.3';

    nodeDiv.appendChild(name);
    nodeDiv.appendChild(role);
    nodeDiv.appendChild(dept);
    nodeDiv.appendChild(deleteBtn);

    li.appendChild(nodeDiv);

    // Recursive children
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

document.getElementById('addOrgNodeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const managerValue = document.getElementById('nodeManager').value.trim();
    const payload = {
        name: document.getElementById('nodeName').value,
        role: document.getElementById('nodeRole').value,
        department: document.getElementById('nodeDept').value,
        company_name: document.getElementById('nodeCompany').value,
        employee_months: parseInt(document.getElementById('nodeMonths').value) || 0,
        work_mode: document.getElementById('nodeWorkMode').value,
        manager: managerValue ? parseInt(managerValue) : null
    };

    try {
        const res = await fetchData('/org-chart/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res) {
            document.getElementById('addOrgNodeForm').reset();
            await loadOrgChart();
            alert('Node added successfully to the tree!');
        } else {
            alert('Failed to add node. Please check if the Manager ID is correct and all fields are valid.');
        }
    } catch (err) {
        console.error('Error adding node:', err);
        alert('An error occurred while adding the node.');
    }
});

async function deleteOrgNode(id) {
    if (!confirm('Delete this node from org chart?')) return;

    const res = await fetchData(`/org-chart/${id}/`, {
        method: 'DELETE'
    });

    loadOrgChart();
}

document.getElementById('docUploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('docTitle').value);
    formData.append('document_type', 'General'); // Defaulting
    formData.append('file', document.getElementById('docFile').files[0]);

    const res = await fetchData('/documents/upload/', {
        method: 'POST',
        body: formData
    });
    if (res) {
        document.getElementById('upload-doc-form').style.display = 'none';
        document.getElementById('docUploadForm').reset();
        loadDocuments();
    }
});

document.getElementById('assignTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const data = {
        title: document.getElementById('taskTitle').value,
        assigned_to: document.getElementById('taskEmail').value,
        deadline: document.getElementById('taskDeadline').value,
        priority: document.getElementById('taskPriority').value,
        description: document.getElementById('taskDescription').value
    };

    let res;
    if (taskId) {
        // Update existing task
        res = await fetchData(`/tasks/${taskId}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    } else {
        // Create new task
        res = await fetchData('/manager/tasks/create/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    if (res) {
        alert(taskId ? 'Task updated successfully!' : 'Task assigned successfully!');
        cancelTaskEdit();
        loadTasks();
    }
});

function editTask(id) {
    const task = (window.allTeamTasks || []).find(t => t.id === id);
    if (!task) return;

    document.getElementById('manager-task-form').style.display = 'block';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskEmail').value = task.assigned_to_email;
    document.getElementById('taskEmail').disabled = true;
    document.getElementById('taskDeadline').value = task.deadline;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskSubmitBtn').innerText = 'Update Task';

    document.getElementById('manager-task-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelTaskEdit() {
    document.getElementById('assignTaskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskEmail').disabled = false;
    document.getElementById('taskSubmitBtn').innerText = 'Assign Task';
}
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Hide self elements initially based on currentMode = 'manager'
    selfElements.forEach(el => el.style.display = 'none');

    // Set today as default for date inputs
    setTodayAsDefault();

    loadDataForTab('dashboard');
    updateQueryBadge();
    updateLeavesBadge();

    // Register Export button listener
    document.getElementById('exportProfilesBtn')?.addEventListener('click', exportProfilesToExcel);

    setInterval(() => {
        const activeNav = document.querySelector('.nav-item.active');
        const currentTarget = activeNav ? activeNav.getAttribute('data-target') : 'dashboard';

        if (currentTarget === 'attendance') {
            loadAttendance();
        } else if (currentTarget === 'dashboard') {
            loadDashboardStats();
        }
        updateQueryBadge();
        updateLeavesBadge();
    }, 5000);
});


// Notifications Module
async function loadNotifications() {
    const receivedList = document.getElementById('receivedNotificationsList');
    const sentList = document.getElementById('sentNotificationsList');
    if (!receivedList) return;

    try {
        const data = await fetchData('/notifications/');
        if (!data) return;

        // Render Received (from Admin)
        receivedList.innerHTML = '';
        if (data.received.length === 0) {
            receivedList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No announcements from admin.</td></tr>';
        } else {
            data.received.forEach(notif => {
                const date = new Date(notif.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                receivedList.innerHTML += `
                    <tr>
                        <td>${date}</td>
                        <td style="font-weight:600; color:var(--primary);">${notif.title}</td>
                        <td>${notif.message}</td>
                        <td>Admin</td>
                    </tr>
                `;
            });
        }

        // Render Sent (to Employees)
        if (sentList) {
            sentList.innerHTML = '';
            if (data.sent.length === 0) {
                sentList.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">You haven\'t sent any announcements.</td></tr>';
            } else {
                data.sent.forEach(notif => {
                    const date = new Date(notif.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    sentList.innerHTML += `
                        <tr>
                            <td>${date}</td>
                            <td style="font-weight:600;">${notif.title}</td>
                            <td>${notif.message}</td>
                        </tr>
                    `;
                });
            }
        }
    } catch (err) {
        console.error('Error loading notifications:', err);
    }
}

document.getElementById('sendNotificationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notifTitle').value;
    const message = document.getElementById('notifMessage').value;

    const res = await fetchData('/notifications/', {
        method: 'POST',
        body: JSON.stringify({ title, message })
    });

    if (res) {
        alert('Announcement sent to all employees!');
        document.getElementById('sendNotificationForm').reset();
        loadNotifications();
    }
});

// --- Manage Profiles Module ---
let allEmployeeProfiles = [];

async function loadEmployeeProfiles() {
    if (currentMode !== 'manager') return;
    const tbody = document.getElementById('memberProfilesList');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Loading team profiles...</td></tr>';

    const data = await fetchData('/manager/all-employee-profiles/');
    if (!data) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Failed to load profiles.</td></tr>';
        return;
    }

    allEmployeeProfiles = data;
    renderEmployeeProfilesList(data);

    // Search functionality
    const searchInput = document.getElementById('memberSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allEmployeeProfiles.filter(p =>
                (p.first_name + ' ' + p.last_name).toLowerCase().includes(query) ||
                p.email.toLowerCase().includes(query)
            );
            renderEmployeeProfilesList(filtered);
        };
    }
}

function renderEmployeeProfilesList(list) {
    const tbody = document.getElementById('memberProfilesList');
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No matching profiles found.</td></tr>';
        return;
    }

    list.forEach(profile => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${profile.first_name} ${profile.last_name}</td>
            <td>${profile.designation || '-'}</td>
            <td>${profile.department || '-'}</td>
            <td>${profile.email}</td>
            <td>
                <button class="btn btn-ghost" onclick="viewMemberDetails(${profile.id})" style="padding: 0.25rem 0.75rem; font-size:0.75rem;">
                    <i class="fa-solid fa-eye"></i> View Details
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewMemberDetails(id) {
    const profile = allEmployeeProfiles.find(p => p.id === id);
    if (!profile) return;

    const modal = document.getElementById('memberProfileModal');
    const content = document.getElementById('modalProfileContent');

    const fields = [
        { label: 'Full Name', value: `${profile.first_name} ${profile.last_name}` },
        { label: 'Email', value: profile.email },
        { label: 'Phone', value: profile.phone_number },
        { label: 'Gender', value: profile.gender },
        { label: 'DOB', value: profile.date_of_birth },
        { label: 'Address', value: profile.address },
        { label: 'Permanent Address', value: profile.permanent_address },
        { label: 'Aadhaar', value: profile.aadhaar_number },
        { label: 'PAN', value: profile.pan_number },
        { label: 'Marital Status', value: profile.marital_status },
        { label: 'Nationality', value: profile.nationality },
        { label: 'Blood Group', value: profile.blood_group },
        { label: 'Designation', value: profile.designation },
        { label: 'Department', value: profile.department },
        { label: 'Employee ID', value: profile.employee_id },
        { label: 'Joining Date', value: profile.date_of_joining },
        { label: 'Emergency Contact', value: profile.emergency_contact_name },
        { label: 'Emergency Phone', value: profile.emergency_contact_phone },
        { label: 'Emergency Relation', value: profile.emergency_contact_relation }
    ];

    content.innerHTML = fields.map(f => `
        <div class="glass-panel" style="padding:1rem;">
            <p style="color:var(--text-muted); font-size:0.75rem; margin-bottom:0.25rem;">${f.label}</p>
            <p style="font-weight:500;">${f.value || 'N/A'}</p>
        </div>
    `).join('');

    modal.style.display = 'block';
}

function escapeXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function exportProfilesToExcel() {
    if (!allEmployeeProfiles || allEmployeeProfiles.length === 0) {
        alert("No profiles to export. Please load the section first.");
        return;
    }

    const headers = [
        "Employee ID", "Full Name", "Email", "Phone", "Gender", "Date of Birth",
        "Present Address", "Permanent Address", "Aadhaar Number", "PAN Number",
        "Marital Status", "Nationality", "Blood Group", "Designation", "Department",
        "Joining Date", "Emergency Contact Name", "Emergency Contact Phone", "Emergency Contact Relation"
    ];

    const rows = allEmployeeProfiles.map(p => [
        p.employee_id || '',
        `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        p.email || '',
        p.phone_number || '',
        p.gender || '',
        p.date_of_birth || '',
        p.address || '',
        p.permanent_address || '',
        p.aadhaar_number || '',
        p.pan_number || '',
        p.marital_status || '',
        p.nationality || '',
        p.blood_group || '',
        p.designation || '',
        p.department || '',
        p.date_of_joining || '',
        p.emergency_contact_name || '',
        p.emergency_contact_phone || '',
        p.emergency_contact_relation || ''
    ]);

    // Calculate dynamic column widths (auto-fit columns based on content length)
    const colWidths = headers.map((header, i) => {
        let maxLen = header.length;
        rows.forEach(row => {
            const valStr = String(row[i] || '');
            if (valStr.length > maxLen) maxLen = valStr.length;
        });
        // Average width of Calibri character is ~8 pixels, plus some padding (e.g., 20px)
        return Math.max(110, (maxLen * 8.5) + 20);
    });

    // Generate XML Spreadsheet 2003 content
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#1B365D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#2E5B9A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Team Profiles">
  <Table>`;

    // Add Column specifications with dynamic widths
    colWidths.forEach(width => {
        xml += `\n   <Column ss:Width="${width}"/>`;
    });

    // 1. Company and Heading Rows
    xml += `\n   <Row ss:Height="40">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="MainTitle">
     <Data ss:Type="String">SHNOOR - TEAM MEMBER PROFILES</Data>
    </Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="SubTitle">
     <Data ss:Type="String">Company: Shnoor   |   Exported on: ${new Date().toLocaleDateString()}</Data>
    </Cell>
   </Row>
   <Row ss:Height="15"/>`; // Spacer row

    // 2. Table Header Row
    xml += `\n   <Row ss:Height="25">`;
    headers.forEach(h => {
        xml += `\n    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`;
    });
    xml += `\n   </Row>`;

    // 3. Table Data Rows
    rows.forEach(row => {
        xml += `\n   <Row ss:Height="20">`;
        row.forEach(cellVal => {
            xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(cellVal)}</Data></Cell>`;
        });
        xml += `\n   </Row>`;
    });

    xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "shnoor_employee_profiles.xls");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// --- Queries Module ---
async function loadQueries() {
    const list = document.getElementById('receivedQueriesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/admin/queries/'); // Backend handles filtering based on role
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center;">No queries found.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(q => {
        const qDateObj = parseDate(q.created_at);
        const date = qDateObj ? qDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : q.created_at;
        const statusCls = q.status === 'resolved' ? 'active' : (q.status === 'in_progress' ? 'pending' : 'expired');

        list.innerHTML += `
            <tr>
                <td>${date}</td>
                <td><strong>${q.sender_username}</strong></td>
                <td>${q.subject}</td>
                <td style="font-size:0.85rem; color:var(--text-muted); max-width:300px;">${q.message}</td>
                <td><span class="status ${statusCls}">${q.status}</span></td>
                <td>
                    <select onchange="updateQueryStatus(${q.id}, this.value)" style="padding:0.25rem; border-radius:4px; background:var(--bg-navy); color:#fff; border:1px solid var(--glass-border);">
                        <option value="pending" ${q.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${q.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${q.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

async function updateQueryStatus(queryId, newStatus) {
    const res = await fetchData(`/admin/queries/${queryId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    });

    if (res) {
        alert('Query status updated successfully.');
        loadQueries();
    } else {
        alert('Failed to update status.');
    }
}
function setTodayAsDefault() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = today;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const triggerAttendanceFilter = () => {
        const selectEl = document.getElementById('team-attendance-employee-select');
        const dateInput = document.getElementById('team-attendance-date');
        const date = dateInput ? dateInput.value : '';
        
        if (date) {
            const parsed = parseDate(date);
            if (parsed) {
                managerCurrentCalendarDate = parsed;
            }
        }
        loadAttendance();
    };

    const filterBtn = document.getElementById('team-attendance-filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerAttendanceFilter();
        });
    }

    document.getElementById('team-attendance-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerAttendanceFilter();
        }
    });

    document.getElementById('team-attendance-date')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerAttendanceFilter();
        }
    });

    setTodayAsDefault();
    updateQueryBadge();
    updateLeavesBadge();

    loadDashboardStats();

    setInterval(() => {
        const activeNav = document.querySelector('.nav-item.active');
        const currentTarget = activeNav ? activeNav.getAttribute('data-target') : 'dashboard';

        if (currentTarget === 'dashboard') loadDashboardStats();

        updateQueryBadge();
        updateLeavesBadge();
    }, 10000);
});

async function updateLeavesBadge() {
    const badge = document.getElementById('leaves-badge');
    if (!badge) return;

    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && activeNav.getAttribute('data-target') === 'leaves') {
        badge.style.display = 'none';
        return;
    }

    try {
        const data = await fetchData('/manager/leaves/pending-count/');
        if (data && data.pending_count > 0) {
            badge.innerText = data.pending_count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error("Error updating leaves badge:", err);
    }
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

function editAttendance(id, date, checkIn, checkOut) {
    document.getElementById('editAttId').value = id || '';
    document.getElementById('editAttEmpId').value = '';
    document.getElementById('editAttDate').value = date || '';
    document.getElementById('editAttClockIn').value = checkIn !== '-' ? checkIn : '';
    document.getElementById('editAttClockOut').value = (checkOut !== '-' && checkOut !== 'Still In') ? checkOut : '';
    document.getElementById('editAttendanceModal').style.display = 'block';
}

function addAttendance(empId, date) {
    document.getElementById('editAttId').value = '';
    document.getElementById('editAttEmpId').value = empId || '';
    document.getElementById('editAttDate').value = date || '';
    document.getElementById('editAttClockIn').value = '';
    document.getElementById('editAttClockOut').value = '';
    document.getElementById('editAttendanceModal').style.display = 'block';
}

function closeEditAttendanceModal() {
    document.getElementById('editAttendanceModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const editAttendanceForm = document.getElementById('editAttendanceForm');
    if (editAttendanceForm) {
        editAttendanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('editAttId').value;
            const empId = document.getElementById('editAttEmpId').value;
            const date = document.getElementById('editAttDate').value;
            const checkIn = document.getElementById('editAttClockIn').value;
            const checkOut = document.getElementById('editAttClockOut').value;

            const payload = {
                check_in: checkIn,
                check_out: checkOut
            };

            if (id) {
                payload.attendance_id = id;
            } else {
                payload.employee_id = empId;
                payload.date = date;
            }

            try {
                const result = await fetchData('/manager/attendance/', {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });

                if (result) {
                    alert('Attendance updated successfully!');
                    closeEditAttendanceModal();
                    loadAttendance();
                } else {
                    alert('Failed to update attendance. Check console for details.');
                }
            } catch (err) {
                console.error("Error submitting attendance:", err);
                alert('An error occurred. Please try again.');
            }
        });
    }
});

async function exportAttendance() {
    const inputDate = document.getElementById('team-attendance-date')?.value;
    const date = inputDate || new Date().toLocaleDateString('en-CA'); // Default to today if empty

    let url = `/manager/attendance/?date=${date}&t=` + new Date().getTime();

    try {
        const data = await fetchData(url);
        if (!data || data.length === 0) {
            alert('No attendance records found for this date.');
            return;
        }

        let csv = 'Employee Name,Date,Clock In,Clock Out,Hours Worked,Status\n';

        data.forEach(rec => {
            csv += `"${rec.employee_name}","${rec.date}","${rec.check_in}","${rec.check_out}","${rec.hours_worked}","${rec.status}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url_blob = URL.createObjectURL(blob);
        link.setAttribute('href', url_blob);
        link.setAttribute('download', `Attendance_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Error exporting attendance:", err);
        alert('An error occurred while exporting attendance.');
    }
}

async function loadOffboardings() {
    const list = document.getElementById('offboardingList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    try {
        const data = await fetchData('/manager/offboardings/');
        if (!data) return;

        list.innerHTML = '';
        if (data.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No offboarding records found.</td></tr>';
            return;
        }

        data.forEach(rec => {
            const date = rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            }) : 'N/A';
            list.innerHTML += `
                <tr>
                    <td>${rec.employee_name || 'N/A'}</td>
                    <td><span class="status ${rec.action_type === 'termination' ? 'expired' : 'active'}">${rec.action_type.capitalize()}</span></td>
                    <td>${rec.reason}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading offboardings:", err);
        list.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Error loading data.</td></tr>';
    }
}

function openOffboardingModal() {
    document.getElementById('offboardingModal').style.display = 'block';
    loadEmployeesForOffboarding();
}

function closeOffboardingModal() {
    document.getElementById('offboardingModal').style.display = 'none';
}

async function loadEmployeesForOffboarding() {
    const select = document.getElementById('offboardEmployee');
    if (!select) return;

    try {
        const data = await fetchData('/manager/employees/');
        if (!data) return;

        select.innerHTML = '<option value="">Select Employee</option>';
        data.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.full_name || emp.username} (${emp.designation})</option>`;
        });
    } catch (err) {
        console.error("Error loading employees for offboarding:", err);
        select.innerHTML = '<option value="">Error loading employees</option>';
    }
}

// Handle Offboarding Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const offboardingForm = document.getElementById('offboardingForm');
    if (offboardingForm) {
        offboardingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const employeeId = document.getElementById('offboardEmployee').value;
            const type = document.getElementById('offboardType').value;
            const reason = document.getElementById('offboardReason').value;

            const payload = {
                employee: employeeId,
                action_type: type,
                reason: reason
            };

            try {
                const result = await fetchData('/manager/offboardings/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (result) {
                    alert('Offboarding record created successfully!');
                    closeOffboardingModal();
                    loadOffboardings(); // Refresh the list
                } else {
                    alert('Failed to create record. Check console for details.');
                }
            } catch (err) {
                console.error("Error submitting offboarding:", err);
                alert('An error occurred. Please try again.');
            }
        });
    }
});

async function loadManagerExpenses() {
    const tbody = document.getElementById('managerExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

    try {
        const data = await fetchData('/manager/expenses/');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No expenses found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(exp => {
            const status = (exp.status || '').toLowerCase();
            const statClass = status === 'claimed' ? 'active' : (status === 'rejected' ? 'expired' : 'pending');

            tbody.innerHTML += `
                <tr>
                    <td>${exp.employee_name || exp.employee_id}</td>
                    <td>${exp.category}</td>
                    <td>₹${exp.amount}</td>
                    <td>${exp.date}</td>
                    <td><span class="status ${statClass}">${exp.status}</span></td>
                    <td>
                        ${status === 'pending' ? `
                            <button class="btn btn-primary" onclick="updateExpenseStatus(${exp.id}, 'claimed')" style="padding: 0.25rem 0.75rem; font-size:0.75rem; margin-right: 5px;">Claimed</button>
                            <button class="btn btn-ghost" onclick="updateExpenseStatus(${exp.id}, 'rejected')" style="padding: 0.25rem 0.75rem; font-size:0.75rem; color:#f43f5e;">Reject</button>
                        ` : '-'}
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading manager expenses:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#f43f5e;">Failed to load expenses.</td></tr>';
    }
}

async function updateExpenseStatus(id, newStatus) {
    const res = await fetchData('/manager/expenses/', {
        method: 'POST',
        body: JSON.stringify({ expense_id: id, status: newStatus })
    });
    if (res) {
        alert(`Expense status updated to ${newStatus}!`);
        loadManagerExpenses();
    }
}

// Helper for capitalize
if (!String.prototype.capitalize) {
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
}
//attendance calendar view
let managerAttendanceViewMode = 'table';

function renderManagerAttendanceCalendar() {
    console.log("renderManagerAttendanceCalendar called!");
    const container = document.getElementById('manager-attendance-calendar-container');
    console.log("container:", container);
    
    if (!container) {
        console.log("Container not found!");
        return;
    }

    const monthYearEl = document.getElementById('manager-calendar-month-year');
    const daysGridEl = document.getElementById('manager-calendar-days-grid');
    console.log("monthYearEl:", monthYearEl);
    console.log("daysGridEl:", daysGridEl);
    
    if (!monthYearEl || !daysGridEl) {
        console.log("Elements not found!");
        return;
    }

    const year = managerCurrentCalendarDate.getFullYear();
    const month = managerCurrentCalendarDate.getMonth();

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.innerText = `${months[month]} ${year}`; //it gives month and year(may 2026)

    daysGridEl.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        daysGridEl.innerHTML += `<div style="padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.01);"></div>`;
    }

    const attendanceMap = {};
    if (managerAttendanceRawData) {
        managerAttendanceRawData.forEach(rec => {
            const recDate = parseDate(rec.date);
            if (recDate && recDate.getFullYear() === year && recDate.getMonth() === month) {
                const day = recDate.getDate();
                if (!attendanceMap[day]) attendanceMap[day] = [];
                attendanceMap[day].push(rec);
            }
        });
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
        const records = attendanceMap[day] || [];
        
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay(); 
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        
        let contentHtml = '';
        if (records.length > 0) {
            records.forEach(rec => {
                if (rec.status !== 'Present' || !rec.attendance_id) return;
                
                const editBtnHtml = isWeekend ? '' : `<button class="btn btn-ghost" style="padding: 0 2px; font-size: 0.6rem; color: #fff;" onclick="editAttendance('${rec.attendance_id}', '${rec.date}', '${rec.check_in}', '${rec.check_out}')"><i class="fa-solid fa-edit"></i></button>`;                
                contentHtml += `<div style="font-size: 0.75rem; margin-top: 4px; background: rgba(59, 130, 246, 0.2); padding: 2px 4px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; color: #fff;">
                    <span>${rec.employee_name.split(' ')[0]}: ${rec.check_in} - ${rec.check_out}</span>
                    ${editBtnHtml}
                </div>`;
            });
        }

        const isToday = new Date().toLocaleDateString('en-CA') === dateObj.toLocaleDateString('en-CA');
        const bg = isToday ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)';
        const border = isToday ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)';

        const plusBtnHtml = isWeekend ? '' : `<button class="btn btn-ghost" style="padding: 0.1rem 0.3rem; font-size: 0.6rem; color: #fff;" onclick="addAttendanceWrapperForCalendar('${dateStr}')"><i class="fa-solid fa-plus"></i></button>`;

        daysGridEl.innerHTML += `
            <div style="padding: 0.75rem; border-radius: 8px; background: ${bg}; border: ${border}; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; color: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem; color: #fff;">${day}</span>
                    ${plusBtnHtml}
                </div>
                <div style="max-height: 60px; overflow-y: auto;">
                    ${contentHtml}
                </div>
            </div>
        `;
    }
}

function addAttendanceWrapperForCalendar(dateStr) {
    const selectEl = document.getElementById('team-attendance-employee-select');
    const empId = selectEl?.value;
    if (!empId) {
        alert('Please select an employee from the dropdown first to add attendance.');
        return;
    }
    addAttendance(empId, dateStr);
}

//it is for the selfattendance calender of manager

function renderSelfAttendanceCalendar() {
    console.log("renderSelfAttendanceCalendar called!");
    const container = document.getElementById('self-attendance-calendar-container');
    console.log("container:", container);
    
    if (!container) {
        console.log("Container not found!");
        return;
    }

    const monthYearEl = document.getElementById('self-calendar-month-year');
    const daysGridEl = document.getElementById('self-calendar-days-grid');
    console.log("monthYearEl:", monthYearEl);
    console.log("daysGridEl:", daysGridEl);
    
    if (!monthYearEl || !daysGridEl) {
        console.log("Elements not found!");
        return;
    }

    const year = selfCurrentCalendarDate.getFullYear();
    const month = selfCurrentCalendarDate.getMonth();

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.innerText = `${months[month]} ${year}`;

    daysGridEl.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        daysGridEl.innerHTML += `<div style="padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.01);"></div>`;
    }

    const attendanceMap = {};
    if (selfAttendanceRawData) {
        selfAttendanceRawData.forEach(rec => {
            const recDate = parseDate(rec.date);
            if (recDate && recDate.getFullYear() === year && recDate.getMonth() === month) {
                const day = recDate.getDate();
                if (!attendanceMap[day]) attendanceMap[day] = [];
                attendanceMap[day].push(rec);
            }
        });
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const records = attendanceMap[day] || [];
        
        let contentHtml = '';
        if (records.length > 0) {
            records.forEach(rec => {
                if (rec.status !== 'Present' || !rec.check_in) return;
                
                contentHtml += `<div style="font-size: 0.75rem; margin-top: 4px; background: rgba(59, 130, 246, 0.2); padding: 2px 4px; border-radius: 4px; color: #fff; text-align: center;">
                    ${rec.check_in} - ${rec.check_out}
                </div>`;
            });
        }

        const dateObj = new Date(year, month, day);
        const isToday = new Date().toLocaleDateString('en-CA') === dateObj.toLocaleDateString('en-CA');
        const bg = isToday ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)';
        const border = isToday ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)';

        daysGridEl.innerHTML += `
            <div style="padding: 0.75rem; border-radius: 8px; background: ${bg}; border: ${border}; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; color: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem; color: #fff;">${day}</span>
                </div>
                <div style="max-height: 60px; overflow-y: auto;">
                    ${contentHtml}
                </div>
            </div>
        `;
    }
}

function openAttendanceAnalysisModal() {
    const modal = document.getElementById('attendanceAnalysisModal');
    if (modal) modal.style.display = 'block';
    
    const selectEl = document.getElementById('team-attendance-employee-select');
    const empId = selectEl?.value;
    const empName = selectEl && selectEl.selectedIndex >= 0 ? selectEl.options[selectEl.selectedIndex].text : 'Employee';
    
    if (!empId) {
        document.getElementById('analysisContent').innerHTML = '<p style="color: #ff4d4d;">Please select a specific employee from the dropdown first.</p>';
        return;
    }
    
    document.getElementById('analysisContent').innerHTML = `<p>Loading analysis for <strong>${empName}</strong>...</p>`;
    
    const data = managerAttendanceRawData.filter(rec => rec.employee_id == empId || rec.employee_name === empName);
    
    if (data.length === 0) {
        document.getElementById('analysisContent').innerHTML = `<p>No attendance records found for <strong>${empName}</strong> in this month.</p>`;
        return;
    }
    
    let onTime = 0;
    let late = 0;
    let warnings = 0;
    
    const threshold = "10:10 AM";
    const daysData = {};
    
    data.forEach(rec => {
        if (rec.status !== 'Present' || !rec.check_in || rec.check_in === '-') return;
        
        const date = rec.date;
        if (!daysData[date]) {
            daysData[date] = [];
        }
        daysData[date].push(rec.check_in);
    });
    
    for (const date in daysData) {
        const checkIns = daysData[date];
        let earliest = checkIns[0];
        for (let i = 1; i < checkIns.length; i++) {
            if (compareTimes(checkIns[i], earliest) < 0) {
                earliest = checkIns[i];
            }
        }
        
        const isLate = compareTimes(earliest, threshold) > 0;
        if (isLate) {
            late++;
        } else {
            onTime++;
        }
    }
    
    warnings = late;
    
    const monthName = managerCurrentCalendarDate.toLocaleString('default', { month: 'long' });
    const year = managerCurrentCalendarDate.getFullYear();
    
    document.getElementById('analysisContent').innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px;">
            <h4>Analysis for <strong>${empName}</strong></h4>
            <p style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 1rem;">Month: ${monthName} ${year}</p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
                <div style="background: rgba(16, 185, 129, 0.2); padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${onTime}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">On Time</div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.2); padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">${late}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Late</div>
                </div>
                <div style="background: rgba(239, 68, 68, 0.2); padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${warnings}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Warnings</div>
                </div>
            </div>
            
            <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 1rem;">* On Time: Earliest clock in at or before ${threshold}.<br>* Warning: Issued for every day with a late clock in.</p>
        </div>
    `;
}

function closeAttendanceAnalysisModal() {
    const modal = document.getElementById('attendanceAnalysisModal');
    if (modal) modal.style.display = 'none';
}

function compareTimes(time1, time2) {
    const t1 = parseTime(time1);
    const t2 = parseTime(time2);
    return t1 - t2;
}

function parseTime(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
        hours = '00';
    }
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    return new Date(`2000-01-01 ${hours}:${minutes}:00`).getTime();
}

document.addEventListener('DOMContentLoaded', () => {
    const analysisBtn = document.getElementById('team-attendance-analysis-btn');
    if (analysisBtn) {
        analysisBtn.addEventListener('click', openAttendanceAnalysisModal);
    }

    const prevBtn = document.getElementById('btn-manager-prev-month');
    const nextBtn = document.getElementById('btn-manager-next-month');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            managerCurrentCalendarDate.setMonth(managerCurrentCalendarDate.getMonth() - 1);
            loadAttendance();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            managerCurrentCalendarDate.setMonth(managerCurrentCalendarDate.getMonth() + 1);
            loadAttendance();
        });
    }

    const selfPrevBtn = document.getElementById('btn-self-prev-month');
    const selfNextBtn = document.getElementById('btn-self-next-month');

    if (selfPrevBtn) {
        selfPrevBtn.addEventListener('click', () => {
            selfCurrentCalendarDate.setMonth(selfCurrentCalendarDate.getMonth() - 1);
            loadAttendance();
        });
    }

    if (selfNextBtn) {
        selfNextBtn.addEventListener('click', () => {
            selfCurrentCalendarDate.setMonth(selfCurrentCalendarDate.getMonth() + 1);
            loadAttendance();
        });
    }

    const selectEl = document.getElementById('team-attendance-employee-select');
    if (selectEl) {
        selectEl.addEventListener('change', () => {
            loadAttendance();
        });
    }
});
