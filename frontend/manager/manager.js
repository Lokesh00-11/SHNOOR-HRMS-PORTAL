const BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE = BASE_URL;
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
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
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
    if(activeItem) activeItem.classList.add('active');

    const targetView = document.getElementById(targetId);
    if(targetView) targetView.classList.add('active');

    loadDataForTab(targetId);
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
    if (tabId === 'dashboard') {
        loadDashboardStats();
    } else if (tabId === 'employees') {
        loadEmployees();
    } else if (tabId === 'attendance') {
        loadAttendance();
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
        loadAllExpenses();
    } else if (tabId === 'policies-section') {
        loadPolicies();
    } else if (tabId === 'offboarding-section') {
        loadOffboarding();
    } else if (tabId === 'letterheads-section') {
        loadLetterHeads();
    } else if (tabId === 'orgchart') {
        loadOrgChart();
    } else if (tabId === 'notifications') {
        loadNotifications();
    } else if (tabId === 'manage-profiles-section') {
        loadEmployeeProfiles();
    }
}

// --- Data Loaders ---

async function loadDashboardStats() {
    if (currentMode === 'manager') {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

        const emps = await fetchData('/manager/employees/');
        if (emps) {
            document.getElementById('dash-team-total').innerText = emps.length;
        }

        const att = await fetchData('/manager/attendance/');
        if (att) {
            // Only count records from TODAY with status 'Present'
            const present = att.filter(a => a.date === today && a.status === 'Present').length;
            document.getElementById('dash-team-present').innerText = present;
        }

        const leaves = await fetchData('/manager/leaves/');
        if (leaves) {
            // Only count APPROVED leaves where TODAY is within the range
            const onLeave = leaves.filter(l => {
                const status = (l.status || '').toLowerCase();
                return status === 'approved' && today >= l.start_date && today <= l.end_date;
            }).length;
            document.getElementById('dash-team-leave').innerText = onLeave;
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

async function loadAttendance() {
    if (currentMode === 'manager') {
        const data = await fetchData('/manager/attendance/');
        if (!data) return;
        const tbody = document.getElementById('teamAttendanceList');
        tbody.innerHTML = '';
        data.forEach(log => {
            const statClass = log.status === 'Present' ? 'active' : 'expired';
            tbody.innerHTML += `
                <tr>
                    <td>${log.employee_name}</td>
                    <td>Today</td>
                    <td>${log.check_in || '-'}</td>
                    <td>${log.check_out || '-'}</td>
                    <td><span class="status ${statClass}">${log.status}</span></td>
                </tr>
            `;
        });
    } else {
        const data = await fetchData('/employee/attendance/');
        if (!data) return;
        const tbody = document.getElementById('selfAttendanceList');
        tbody.innerHTML = '';
        data.forEach(log => {
            const statClass = log.status === 'Present' ? 'active' : 'expired';
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(log.date).toLocaleDateString()}</td>
                    <td>${log.check_in || '-'}</td>
                    <td>${log.check_out || '-'}</td>
                    <td><span class="status ${statClass}">${log.status}</span></td>
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
        renderTeamTasksList();
    } else {
        const data = await fetchData('/employee/tasks/');
        if (!data) return;
        window.allSelfTasks = data;
        renderSelfTasksList();
    }
}

function renderTeamTasksList() {
    const tbody = document.getElementById('teamTasksList');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const statusFilter = document.getElementById('mgrTeamTaskStatusFilter')?.value || 'all';
    const priorityFilter = document.getElementById('mgrTeamTaskPriorityFilter')?.value || 'all';
    
    const tasks = window.allTeamTasks || [];
    const filteredTasks = tasks.filter(task => {
        const matchStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchStatus && matchPriority;
    });
    
    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No tasks match the filter criteria.</td></tr>';
        return;
    }
    
    filteredTasks.forEach(task => {
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
}

function renderSelfTasksList() {
    const tbody = document.getElementById('selfTasksList');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const statusFilter = document.getElementById('mgrSelfTaskStatusFilter')?.value || 'all';
    const priorityFilter = document.getElementById('mgrSelfTaskPriorityFilter')?.value || 'all';
    
    const tasks = window.allSelfTasks || [];
    const filteredTasks = tasks.filter(task => {
        const matchStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchStatus && matchPriority;
    });
    
    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No tasks match the filter criteria.</td></tr>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const statClass = task.status === 'Completed' ? 'active' : (task.status === 'In Progress' ? 'pending' : 'expired');
        tbody.innerHTML += `
            <tr>
                <td>${task.title}</td>
                <td>${task.deadline || '-'}</td>
                <td><span style="color:${task.priority==='High'?'#f43f5e':(task.priority==='Medium'?'#f59e0b':'#10b981')}">${task.priority}</span></td>
                <td><span class="status ${statClass}">${task.status}</span></td>
                <td>-</td>
            </tr>
        `;
    });
}

async function loadDocuments() {
    const data = await fetchData('/employee/documents/');
    if (!data) return;
    const tbody = document.getElementById('documentsList');
    tbody.innerHTML = '';
    data.forEach(doc => {
        tbody.innerHTML += `
            <tr>
                <td>${doc.title}</td>
                <td>${new Date(doc.uploaded_at).toLocaleDateString()}</td>
                <td>
                    <a href="${doc.file}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration:none;">Download</a>
                </td>
            </tr>
        `;
    });
}

async function loadPayroll() {
    const list = document.getElementById('teamPayrollList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/manager/payroll/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No payroll data found.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(item => {
        const statClass = item.status === 'Paid' ? 'active' : 'pending';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.employee_name || item.username}</td>
            <td>${item.month_year}</td>
            <td>$${item.amount}</td>
            <td><span class="status ${statClass}">${item.status}</span></td>
        `;
        list.appendChild(tr);
    });
}

// --- Company Policies Module ---
let localPoliciesData = [];

async function loadPolicies() {
    const list = document.getElementById('policiesTableBody');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading policies...</td></tr>';

    try {
        const data = await fetchData('/policies/');
        if (!data) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">Failed to retrieve policies.</td></tr>';
            return;
        }

        localPoliciesData = data;
        renderPoliciesList(data);
        setupPoliciesFormListeners();
    } catch (err) {
        console.error("Error loading policies:", err);
        list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">An error occurred.</td></tr>';
    }
}

function renderPoliciesList(data) {
    const list = document.getElementById('policiesTableBody');
    if (!list) return;

    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">No policies published yet.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(policy => {
        let desc = policy.description || '';
        let category = 'General';
        let location = 'All Offices';

        // Parse parsed metadata if formatted as "[Category:X][Location:Y] desc"
        if (desc.startsWith('[Category:')) {
            const catMatch = desc.match(/\[Category:([^\]]+)\]/);
            const locMatch = desc.match(/\[Location:([^\]]+)\]/);
            if (catMatch) category = catMatch[1];
            if (locMatch) location = locMatch[1];
            desc = desc.replace(/\[Category:[^\]]+\]/, '').replace(/\[Location:[^\]]+\]/, '').trim();
        }

        const date = policy.created_at ? new Date(policy.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }) : '-';

        const fileUrl = policy.file || '#';
        const title = policy.title || 'Corporate_Policy';
        const downloadUrl = (fileUrl && fileUrl.startsWith('http')) 
            ? `${BASE_URL}/download-file/?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(title)}` 
            : fileUrl;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: #fff;">${policy.title}</td>
            <td style="color:var(--text-muted); font-size:0.9rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${desc}">${desc || 'No description'}</td>
            <td><span class="status-badge" style="background: rgba(37,99,235,0.1); color: var(--primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${category}</span></td>
            <td><span class="status-badge" style="background: rgba(16,185,129,0.1); color: #10b981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${location}</span></td>
            <td>${date}</td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <a href="${downloadUrl}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration:none; display: inline-flex; align-items: center; gap: 0.25rem;">
                        <i class="fa-solid fa-eye"></i> View
                    </a>
                    ${currentMode === 'manager' ? `
                    <button class="btn btn-ghost" onclick="deletePolicy(${policy.id})" style="padding: 0.25rem 0.75rem; font-size:0.75rem; color:#f43f5e; border-color: rgba(244,63,94,0.15);">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
}

function filterPolicies() {
    const query = document.getElementById('policySearch')?.value.toLowerCase() || '';
    const category = document.getElementById('filterCategory')?.value || 'ALL';
    const location = document.getElementById('filterLocation')?.value || 'ALL';

    const filtered = localPoliciesData.filter(p => {
        let desc = p.description || '';
        let pCategory = 'General';
        let pLocation = 'All Offices';

        if (desc.startsWith('[Category:')) {
            const catMatch = desc.match(/\[Category:([^\]]+)\]/);
            const locMatch = desc.match(/\[Location:([^\]]+)\]/);
            if (catMatch) pCategory = catMatch[1];
            if (locMatch) pLocation = locMatch[1];
            desc = desc.replace(/\[Category:[^\]]+\]/, '').replace(/\[Location:[^\]]+\]/, '').trim();
        }

        const matchQuery = p.title.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        const matchCat = category === 'ALL' || pCategory === category;
        const matchLoc = location === 'ALL' || pLocation === location;

        return matchQuery && matchCat && matchLoc;
    });

    renderPoliciesList(filtered);
}

let policiesFormBound = false;
function setupPoliciesFormListeners() {
    if (policiesFormBound) return;
    const form = document.getElementById('uploadPolicyForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('policyTitle').value;
        const category = document.getElementById('policyCategory').value;
        const location = document.getElementById('policyLocation').value;
        const summary = document.getElementById('policyDesc').value;
        const fileInput = document.getElementById('policyFile');

        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a valid PDF file.');
            return;
        }

        const fileObj = fileInput.files[0];
        const formattedDesc = `[Category:${category}][Location:${location}] ${summary}`;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', formattedDesc);
        formData.append('file', fileObj);

        // Fetch auth token
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/policies/create/`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (res.ok) {
                alert('Policy published successfully to Google Drive!');
                form.reset();
                loadPolicies();
            } else {
                const errData = await res.json();
                alert(`Upload failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred during publishing.');
        }
    });

    policiesFormBound = true;
}

async function deletePolicy(policyId) {
    if (!confirm('Are you sure you want to permanently delete this corporate policy?')) return;

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
        const res = await fetch(`${API_BASE}/policies/delete/${policyId}/`, {
            method: 'DELETE',
            headers
        });

        if (res.ok) {
            alert('Policy deleted successfully!');
            loadPolicies();
        } else {
            alert('Failed to delete policy.');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting policy.');
    }
}


// --- Offboarding Module ---
let localOffboardingData = [];
let currentOffboardSubtab = 'warnings';

async function loadOffboarding() {
    const tableBody = document.getElementById('offboardTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading offboarding directory...</td></tr>';

    try {
        // Populate manager employee list in dropdown if in manager mode
        if (currentMode === 'manager') {
            const emps = await fetchData('/manager/employees/');
            const selectEl = document.getElementById('offboardEmployee');
            if (selectEl && emps) {
                selectEl.innerHTML = '<option value="">-- Choose Employee --</option>';
                emps.forEach(emp => {
                    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username;
                    selectEl.innerHTML += `<option value="${emp.id}">${fullName} (${emp.designation || 'Staff'})</option>`;
                });
            }
        }

        const data = await fetchData('/manager/offboardings/');
        if (!data) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">Failed to load offboarding items.</td></tr>';
            return;
        }

        localOffboardingData = data;
        setupOffboardTabs();
        setupOffboardForm();
        renderOffboardingSubtab();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">Error fetching offboarding list.</td></tr>';
    }
}

function renderOffboardingSubtab() {
    if (currentOffboardSubtab === 'warnings') renderWarnings();
    else if (currentOffboardSubtab === 'resignations') renderResignations();
    else if (currentOffboardSubtab === 'terminations') renderTerminations();
    else if (currentOffboardSubtab === 'complaints') renderComplaints();
}

function renderWarnings() {
    const header = document.getElementById('offboardTableHeader');
    const body = document.getElementById('offboardTableBody');
    if (!header || !body) return;

    header.innerHTML = `
        <th>Employee</th>
        <th>Infraction Date</th>
        <th>Reason / Infraction details</th>
        <th>Letter/Doc</th>
        ${currentMode === 'manager' ? '<th style="text-align: right;">Action</th>' : ''}
    `;

    const warnings = localOffboardingData.filter(o => o.action_type === 'warning');
    if (warnings.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">No warning letters issued yet.</td></tr>';
        return;
    }

    body.innerHTML = '';
    warnings.forEach(w => {
        const date = w.created_at ? new Date(w.created_at).toLocaleDateString() : '-';
        const title = "Warning_Letter_" + (w.employee_name || "Employee").replace(/\s+/g, "_") + "_" + date.replace(/\//g, "-");
        const downloadUrl = w.file ? `${BASE_URL}/download-file/?url=${encodeURIComponent(w.file)}&name=${encodeURIComponent(title)}` : '#';
        const docLink = w.file ? `<a href="${downloadUrl}" target="_blank" style="color:var(--primary); text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View Letter</a>` : '<span style="color:var(--text-muted);">No Document</span>';
        
        body.innerHTML += `
            <tr>
                <td style="font-weight: 600; color:#fff;">${w.employee_name || 'Staff Member'}</td>
                <td>${date}</td>
                <td style="max-width: 300px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${w.reason}">${w.reason}</td>
                <td>${docLink}</td>
                ${currentMode === 'manager' ? `
                <td style="text-align: right;">
                    <button onclick="deleteOffboardRecord(${w.id})" class="btn btn-ghost" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #f43f5e; border-color: rgba(244,63,94,0.1);"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>` : ''}
            </tr>
        `;
    });
}

function renderResignations() {
    const header = document.getElementById('offboardTableHeader');
    const body = document.getElementById('offboardTableBody');
    if (!header || !body) return;

    header.innerHTML = `
        <th>Employee</th>
        <th>Submission Date</th>
        <th>Resignation Reason</th>
        <th>Document</th>
        ${currentMode === 'manager' ? '<th style="text-align: right;">Action</th>' : ''}
    `;

    const resignations = localOffboardingData.filter(o => o.action_type === 'resignation');
    if (resignations.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">No resignation requests processed.</td></tr>';
        return;
    }

    body.innerHTML = '';
    resignations.forEach(r => {
        const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '-';
        const title = "Resignation_Letter_" + (r.employee_name || "Employee").replace(/\s+/g, "_") + "_" + date.replace(/\//g, "-");
        const downloadUrl = r.file ? `${BASE_URL}/download-file/?url=${encodeURIComponent(r.file)}&name=${encodeURIComponent(title)}` : '#';
        const docLink = r.file ? `<a href="${downloadUrl}" target="_blank" style="color:var(--primary); text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View letter</a>` : '<span style="color:var(--text-muted);">No Document</span>';

        body.innerHTML += `
            <tr>
                <td style="font-weight: 600; color:#fff;">${r.employee_name || 'Staff Member'}</td>
                <td>${date}</td>
                <td style="max-width: 300px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${r.reason}">${r.reason}</td>
                <td>${docLink}</td>
                ${currentMode === 'manager' ? `
                <td style="text-align: right;">
                    <button onclick="deleteOffboardRecord(${r.id})" class="btn btn-ghost" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #f43f5e; border-color: rgba(244,63,94,0.1);"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>` : ''}
            </tr>
        `;
    });
}

function renderTerminations() {
    const header = document.getElementById('offboardTableHeader');
    const body = document.getElementById('offboardTableBody');
    if (!header || !body) return;

    header.innerHTML = `
        <th>Employee</th>
        <th>Termination Date</th>
        <th>Termination Clause / Reason</th>
        <th>Separation Doc</th>
        ${currentMode === 'manager' ? '<th style="text-align: right;">Action</th>' : ''}
    `;

    const terminations = localOffboardingData.filter(o => o.action_type === 'termination');
    if (terminations.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">No terminations logged.</td></tr>';
        return;
    }

    body.innerHTML = '';
    terminations.forEach(t => {
        const date = t.created_at ? new Date(t.created_at).toLocaleDateString() : '-';
        const title = "Separation_Agreement_" + (t.employee_name || "Employee").replace(/\s+/g, "_") + "_" + date.replace(/\//g, "-");
        const downloadUrl = t.file ? `${BASE_URL}/download-file/?url=${encodeURIComponent(t.file)}&name=${encodeURIComponent(title)}` : '#';
        const docLink = t.file ? `<a href="${downloadUrl}" target="_blank" style="color:var(--primary); text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View Separation</a>` : '<span style="color:var(--text-muted);">No Document</span>';

        body.innerHTML += `
            <tr>
                <td style="font-weight: 600; color:#fff;">${t.employee_name || 'Staff Member'}</td>
                <td>${date}</td>
                <td style="max-width: 300px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${t.reason}">${t.reason}</td>
                <td>${docLink}</td>
                ${currentMode === 'manager' ? `
                <td style="text-align: right;">
                    <button onclick="deleteOffboardRecord(${t.id})" class="btn btn-ghost" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #f43f5e; border-color: rgba(244,63,94,0.1);"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>` : ''}
            </tr>
        `;
    });
}

function renderComplaints() {
    const header = document.getElementById('offboardTableHeader');
    const body = document.getElementById('offboardTableBody');
    if (!header || !body) return;

    header.innerHTML = `
        <th>Employee Related</th>
        <th>Grievance Date</th>
        <th>Complaint Summary</th>
        <th>Investigation Doc</th>
        ${currentMode === 'manager' ? '<th style="text-align: right;">Action</th>' : ''}
    `;

    const complaints = localOffboardingData.filter(o => o.action_type === 'complaint');
    if (complaints.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">No official complaints filed.</td></tr>';
        return;
    }

    body.innerHTML = '';
    complaints.forEach(c => {
        const date = c.created_at ? new Date(c.created_at).toLocaleDateString() : '-';
        const title = "Grievance_Attachment_" + (c.employee_name || "Employee").replace(/\s+/g, "_") + "_" + date.replace(/\//g, "-");
        const downloadUrl = c.file ? `${BASE_URL}/download-file/?url=${encodeURIComponent(c.file)}&name=${encodeURIComponent(title)}` : '#';
        const docLink = c.file ? `<a href="${downloadUrl}" target="_blank" style="color:var(--primary); text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View File</a>` : '<span style="color:var(--text-muted);">No Document</span>';

        body.innerHTML += `
            <tr>
                <td style="font-weight: 600; color:#fff;">${c.employee_name || 'Staff Member'}</td>
                <td>${date}</td>
                <td style="max-width: 300px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${c.reason}">${c.reason}</td>
                <td>${docLink}</td>
                ${currentMode === 'manager' ? `
                <td style="text-align: right;">
                    <button onclick="deleteOffboardRecord(${c.id})" class="btn btn-ghost" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #f43f5e; border-color: rgba(244,63,94,0.1);"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>` : ''}
            </tr>
        `;
    });
}

let offboardTabsBound = false;
function setupOffboardTabs() {
    if (offboardTabsBound) return;
    const buttons = document.querySelectorAll('.offboard-subtab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-ghost');
            });
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-ghost');

            currentOffboardSubtab = btn.getAttribute('data-tab');
            renderOffboardingSubtab();
        });
    });
    offboardTabsBound = true;
}

let offboardFormBound = false;
function setupOffboardForm() {
    if (offboardFormBound) return;
    const form = document.getElementById('createOffboardingForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const employee = document.getElementById('offboardEmployee').value;
        const action_type = document.getElementById('offboardActionType').value;
        const reason = document.getElementById('offboardReason').value;
        const fileInput = document.getElementById('offboardFile');

        if (!employee) {
            alert('Please select an employee.');
            return;
        }

        const formData = new FormData();
        formData.append('employee', employee);
        formData.append('action_type', action_type);
        formData.append('reason', reason);

        if (fileInput.files && fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/manager/offboardings/`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (res.ok) {
                alert('Offboarding record submitted and uploaded successfully!');
                form.reset();
                loadOffboarding();
            } else {
                const errData = await res.json();
                alert(`Submission failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error creating offboarding record.');
        }
    });
    offboardFormBound = true;
}

async function deleteOffboardRecord(id) {
    if (!confirm('Are you sure you want to delete this offboarding/action record permanently?')) return;

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
        const res = await fetch(`${API_BASE}/manager/offboardings/${id}/`, {
            method: 'DELETE',
            headers
        });

        if (res.ok) {
            alert('Record deleted successfully.');
            loadOffboarding();
        } else {
            alert('Failed to delete record.');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting record.');
    }
}


// --- Letter Heads Module ---
let localLetterheadsData = [];

async function loadLetterHeads() {
    const tableBody = document.getElementById('letterHeadsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading compiled letters directory...</td></tr>';

    try {
        // Populate candidates / employees select dropdown
        const emps = await fetchData('/manager/employees/');
        const selectEl = document.getElementById('letterEmployee');
        if (selectEl && emps) {
            selectEl.innerHTML = '<option value="">-- Choose Employee / Candidate --</option>';
            emps.forEach(emp => {
                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username;
                selectEl.innerHTML += `<option value="${emp.id}" data-fullname="${fullName}">${fullName} (${emp.designation || 'Staff'})</option>`;
            });
        }

        const data = await fetchData('/manager/letterheads/');
        if (!data) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color:var(--text-muted);">Failed to load generated archives.</td></tr>';
            return;
        }

        localLetterheadsData = data;
        renderLetterheadsList(data);
        setupLetterheadTemplates();
        setupLetterheadForm();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color:var(--text-muted);">Error fetching letterheads list.</td></tr>';
    }
}

function renderLetterheadsList(data) {
    const tableBody = document.getElementById('letterHeadsTableBody');
    if (!tableBody) return;

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color:var(--text-muted);">No documents compiled yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    data.forEach(item => {
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-';

        let categoryBadge = '';
        if (item.document_type === 'offer_letter') categoryBadge = '<span class="status-badge" style="background: rgba(37,99,235,0.1); color: var(--primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Offer Letter</span>';
        else if (item.document_type === 'nda') categoryBadge = '<span class="status-badge" style="background: rgba(16,185,129,0.1); color: #10b981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Confidential NDA</span>';
        else if (item.document_type === 'payslip') categoryBadge = '<span class="status-badge" style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Salary Payslip</span>';
        else if (item.document_type === 'recommendation') categoryBadge = '<span class="status-badge" style="background: rgba(225,29,72,0.1); color: #e11d48; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Recommendation</span>';
        else categoryBadge = `<span class="status-badge" style="background: rgba(255,255,255,0.05); color: #9ca3af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${item.document_type}</span>`;

        const fileUrl = item.file || '#';
        const title = item.title || 'Compiled_Document';
        const downloadUrl = (fileUrl && fileUrl.startsWith('http')) 
            ? `${BASE_URL}/download-file/?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(title)}` 
            : fileUrl;

        tableBody.innerHTML += `
            <tr>
                <td style="font-weight: 600; color: #fff;">${item.title}</td>
                <td>${categoryBadge}</td>
                <td>${date}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <a href="${downloadUrl}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration:none;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open in Drive</a>
                        <button onclick="deleteLetterHead(${item.id})" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; color:#f43f5e; border-color: rgba(244,63,94,0.15);"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

let letterTemplatesBound = false;
function setupLetterheadTemplates() {
    if (letterTemplatesBound) return;

    const cards = [
        { id: 'offerLetterTemplate', type: 'offer_letter' },
        { id: 'ndaTemplate', type: 'nda' },
        { id: 'payslipTemplate', type: 'payslip' },
        { id: 'recommendTemplate', type: 'recommendation' }
    ];

    cards.forEach(card => {
        const el = document.getElementById(card.id);
        if (el) {
            el.addEventListener('click', () => {
                // Remove active styling from all template cards
                cards.forEach(c => {
                    const cel = document.getElementById(c.id);
                    if (cel) {
                        cel.style.background = 'transparent';
                        cel.style.borderColor = 'var(--glass-border)';
                        cel.classList.remove('active');
                    }
                });

                // Add active style to selected card
                el.style.background = 'rgba(37,99,235,0.05)';
                el.style.borderColor = 'var(--primary)';
                el.classList.add('active');

                // Update hidden input type
                document.getElementById('letterDocType').value = card.type;
                updateLetterDynamicFields(card.type);
            });
        }
    });

    // Run first-time dynamic fields update
    updateLetterDynamicFields('offer_letter');
    letterTemplatesBound = true;
}

function updateLetterDynamicFields(type) {
    const fieldsContainer = document.getElementById('letterDynamicFields');
    if (!fieldsContainer) return;

    fieldsContainer.innerHTML = '';
    const labelStyle = `display:block; margin-bottom:0.5rem; font-size:0.85rem;`;
    const inputStyle = `width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--glass-border); background:var(--bg-navy); color:#fff;`;

    if (type === 'offer_letter') {
        fieldsContainer.innerHTML = `
            <div class="form-group" style="margin-bottom:0;">
                <label style="${labelStyle}">Offer Designation</label>
                <input type="text" id="letterDesignation" class="form-control" placeholder="e.g. Associate Tech Lead" required style="${inputStyle}">
            </div>
            <div class="form-group" style="margin-bottom:0;">
                <label style="${labelStyle}">Annual Gross Salary (CTC)</label>
                <input type="text" id="letterSalary" class="form-control" placeholder="e.g. ₹1,200,000 per annum" required style="${inputStyle}">
            </div>
        `;
    } else if (type === 'nda') {
        // NDA needs no extra fields, content is enough
        fieldsContainer.innerHTML = `
            <div style="grid-column: span 2; color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">
                <i class="fa-solid fa-circle-info"></i> The NDA utilizes standard corporate confidentiality clauses mapped to the chosen employee.
            </div>
        `;
    } else if (type === 'payslip') {
        fieldsContainer.innerHTML = `
            <div class="form-group" style="margin-bottom:0;">
                <label style="${labelStyle}">Salary Month</label>
                <input type="text" id="letterMonth" class="form-control" placeholder="e.g. May 2026" required style="${inputStyle}">
            </div>
            <div class="form-group" style="margin-bottom:0;">
                <label style="${labelStyle}">Net Paid Amount</label>
                <input type="text" id="letterSalary" class="form-control" placeholder="e.g. ₹85,000" required style="${inputStyle}">
            </div>
        `;
    } else if (type === 'recommendation') {
        fieldsContainer.innerHTML = `
            <div class="form-group" style="grid-column: span 2; margin-bottom:0;">
                <label style="${labelStyle}">Serving Designation</label>
                <input type="text" id="letterDesignation" class="form-control" placeholder="e.g. Technical Product Manager" required style="${inputStyle}">
            </div>
        `;
    }
}

let letterFormBound = false;
function setupLetterheadForm() {
    if (letterFormBound) return;
    const form = document.getElementById('compileLetterForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('letterTitle').value;
        const document_type = document.getElementById('letterDocType').value;
        const employeeId = document.getElementById('letterEmployee').value;
        const content = document.getElementById('letterContent').value;

        if (!employeeId) {
            alert('Please select a recipient employee.');
            return;
        }

        // Get selected employee's full name
        const selectEl = document.getElementById('letterEmployee');
        const employeeName = selectEl.options[selectEl.selectedIndex].getAttribute('data-fullname') || 'Valued Employee';

        const payload = {
            title,
            document_type,
            employee: employeeId,
            employee_name: employeeName,
            content
        };

        // Gather template specific fields
        const designationEl = document.getElementById('letterDesignation');
        const salaryEl = document.getElementById('letterSalary');
        const monthEl = document.getElementById('letterMonth');

        if (designationEl) payload.designation = designationEl.value;
        if (salaryEl) payload.salary = salaryEl.value;
        if (monthEl) payload.month = monthEl.value;

        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/manager/letterheads/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Letter compiled and compiled directly to Google Drive successfully!');
                form.reset();
                loadLetterHeads();
            } else {
                const errData = await res.json();
                alert(`Compilation failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred during reportlab PDF compiling.');
        }
    });

    letterFormBound = true;
}

async function deleteLetterHead(id) {
    if (!confirm('Are you sure you want to delete this generated letterhead archive?')) return;

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;

    try {
        const res = await fetch(`${API_BASE}/manager/letterheads/${id}/`, {
            method: 'DELETE',
            headers
        });

        if (res.ok) {
            alert('Letterhead archived document deleted successfully!');
            loadLetterHeads();
        } else {
            alert('Failed to delete letterhead.');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting letterhead.');
    }
}

// --- Action Bindings ---

document.getElementById('clock-in-btn')?.addEventListener('click', async () => {
    const res = await fetchData('/employee/attendance/clock-in/', { method: 'POST' });
    if (res) loadAttendance();
});

document.getElementById('clock-out-btn')?.addEventListener('click', async () => {
    const res = await fetchData('/employee/attendance/clock-out/', { method: 'POST' });
    if (res) loadAttendance();
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
    
    // Find top-level nodes (those whose manager is null)
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
    loadDataForTab('dashboard');

    // Register Export button listener
    document.getElementById('exportProfilesBtn')?.addEventListener('click', exportProfilesToExcel);
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


// --- Manager Expenses Module ---
let localAllExpenses = [];

async function loadAllExpenses() {
    const tbody = document.getElementById('mgrExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading organization expenses...</td></tr>';

    const res = await fetchData('/manager/expenses/');
    if (!res) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">Failed to load expense records.</td></tr>';
        return;
    }

    localAllExpenses = res;
    renderAllExpenses(res);
    loadAllExpenseStats(res);
}

function renderAllExpenses(data) {
    const tbody = document.getElementById('mgrExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding: 2rem;">No expense claims found matching filters.</td></tr>';
        return;
    }

    data.forEach(exp => {
        let statusBadge = '';
        const statusVal = exp.status.toUpperCase();
        if (statusVal === 'APPROVED') statusBadge = '<span class="status-badge status-present" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Approved</span>';
        else if (statusVal === 'REJECTED') statusBadge = '<span class="status-badge status-absent" style="background: rgba(244,63,94,0.15); color: #f43f5e; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Rejected</span>';
        else statusBadge = '<span class="status-badge status-pending" style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Pending</span>';

        let payBadge = '';
        const payVal = exp.payment_status.toUpperCase();
        if (payVal === 'PAID') payBadge = '<span style="color: #10b981; font-weight: 600; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Paid</span>';
        else payBadge = '<span style="color: #9ca3af; font-weight: 600; font-size: 0.75rem;"><i class="fa-solid fa-circle-dot"></i> Unpaid</span>';

        let receiptLink = '<span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-ban"></i> None</span>';
        if (exp.receipt) {
            const fileUrl = exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`;
            receiptLink = `<a href="${fileUrl}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500; font-size: 0.85rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i> View</a>`;
        }

        let actionBtn = '-';
        if (statusVal === 'PENDING') {
            actionBtn = `<button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openMgrReviewModal(${exp.id}, '${escapeJS(exp.employee_name)}', ${exp.amount}, '${escapeJS(exp.category)}', '${escapeJS(exp.submitted_at_str)}')"><i class="fa-solid fa-gavel"></i> Review</button>`;
        } else if (statusVal === 'APPROVED' && payVal === 'UNPAID') {
            actionBtn = `<button class="btn btn-ghost" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; color: #10b981; border-color: #10b981;" onclick="openMgrPayModal(${exp.id}, '${escapeJS(exp.employee_name)}', ${exp.amount}, '${escapeJS(exp.category)}', '${escapeJS(exp.submitted_at_str)}')"><i class="fa-solid fa-wallet"></i> Pay</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 600; color:#fff;">${escapeHTML(exp.employee_name)}</td>
                <td>${exp.submitted_at_str || '-'}</td>
                <td style="font-weight: 500;">${escapeHTML(exp.title)}</td>
                <td>${escapeHTML(exp.category)}</td>
                <td style="font-weight: 600; color: #fff;">₹${parseFloat(exp.amount).toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${payBadge}</td>
                <td>${receiptLink}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

function loadAllExpenseStats(data) {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let rejected = 0;

    data.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        const stat = exp.status.toUpperCase();
        const pStat = exp.payment_status.toUpperCase();

        total += amt;
        if (stat === 'PENDING') pending += amt;
        else if (stat === 'REJECTED') rejected += amt;
        
        if (pStat === 'PAID') paid += amt;
    });

    document.getElementById('mgr-exp-total').innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('mgr-exp-paid').innerText = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('mgr-exp-pending').innerText = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('mgr-exp-rejected').innerText = `₹${rejected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function filterAllExpenses() {
    const searchVal = document.getElementById('mgrExpenseSearch').value.toLowerCase();
    const statusVal = document.getElementById('mgrFilterStatus').value;
    const paymentVal = document.getElementById('mgrFilterPayment').value;

    let query = `?search=${encodeURIComponent(searchVal)}`;
    if (statusVal !== 'ALL') query += `&status=${statusVal}`;
    if (paymentVal !== 'ALL') query += `&payment_status=${paymentVal}`;

    const res = await fetchData(`/manager/expenses/${query}`);
    if (res) {
        renderAllExpenses(res);
    }
}

function clearMgrExpenseFilters() {
    document.getElementById('mgrExpenseSearch').value = '';
    document.getElementById('mgrFilterStatus').value = 'ALL';
    document.getElementById('mgrFilterPayment').value = 'ALL';
    loadAllExpenses();
}

function openMgrReviewModal(id, employeeName, amount, category, date) {
    const modal = document.getElementById('mgrReviewModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('mgrReviewExpenseId').value = id;
        document.getElementById('mgrReviewRemark').value = '';
        
        document.getElementById('mgr-review-info').innerHTML = `
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Employee:</strong> <span style="font-weight: 600; color: #fff;">${escapeHTML(employeeName)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Amount:</strong> <span style="font-weight: 600; color: var(--primary);">₹${parseFloat(amount).toFixed(2)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Category:</strong> <span>${escapeHTML(category)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Submitted Date:</strong> <span>${escapeHTML(date)}</span></div>
        `;
    }
}

function closeMgrReviewModal() {
    const modal = document.getElementById('mgrReviewModal');
    if (modal) modal.style.display = 'none';
}

async function submitManagerDecision(event, decision) {
    if (event) event.preventDefault();

    const id = document.getElementById('mgrReviewExpenseId').value;
    const remark = document.getElementById('mgrReviewRemark').value;

    if (!remark) {
        alert('Please provide a review remark.');
        return;
    }

    const res = await fetchData('/manager/expenses/approve/', {
        method: 'POST',
        body: JSON.stringify({
            expense_id: id,
            status: decision,
            remark: remark
        })
    });

    if (res) {
        alert(`Expense claim successfully ${decision.toLowerCase()}!`);
        closeMgrReviewModal();
        loadAllExpenses();
    } else {
        alert('Failed to save manager review decision.');
    }
}

function openMgrPayModal(id, employeeName, amount, category, date) {
    const modal = document.getElementById('mgrPayModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('mgrPayExpenseId').value = id;
        document.getElementById('mgrPayRemark').value = '';
        
        document.getElementById('mgr-pay-info').innerHTML = `
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Employee:</strong> <span style="font-weight: 600; color: #fff;">${escapeHTML(employeeName)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Amount:</strong> <span style="font-weight: 600; color: var(--primary);">₹${parseFloat(amount).toFixed(2)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Category:</strong> <span>${escapeHTML(category)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Approved Date:</strong> <span>${escapeHTML(date)}</span></div>
        `;
    }
}

function closeMgrPayModal() {
    const modal = document.getElementById('mgrPayModal');
    if (modal) modal.style.display = 'none';
}

async function submitManagerPayment(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('mgrPayExpenseId').value;
    const remark = document.getElementById('mgrPayRemark').value;

    const res = await fetchData('/manager/expenses/pay/', {
        method: 'POST',
        body: JSON.stringify({
            expense_id: id,
            payment_status: 'PAID',
            remark: remark
        })
    });

    if (res) {
        alert('Disbursement successfully marked as Paid!');
        closeMgrPayModal();
        loadAllExpenses();
    } else {
        alert('Failed to update payout settlement.');
    }
}

function exportExpensesToExcel() {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let xml = `<?xml version="1.0"?>
<?mso-application ss:Name="Excel"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#1F4E78"/>
   <Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubHeaderStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Italic="1" ss:Color="#595959"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4F81BD"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F81BD"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F81BD" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10"/>
  </Style>
  <Style ss:ID="AmountCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Expenses Log">
  <Table ss:ExpandedColumnCount="7" x:FullColumns="1" x:FullRows="1">
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="180"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   
   <Row ss:Height="35">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderStyle"><Data ss:Type="String">SHNOOR HRMS - FINANCIAL EXPENSES LOG</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="6" ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Export Date: ${today} | Generated via Corporate Manager Module</Data></Cell>
   </Row>
   <Row ss:Height="10"/>
   
   <Row ss:Height="25">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Employee Name</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Submitted Date</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Title / Merchant</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Amount</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Payment Status</Data></Cell>
   </Row>`;

    localAllExpenses.forEach(exp => {
        xml += `\n   <Row ss:Height="20">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(exp.employee_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(exp.submitted_at_str)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(exp.title)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(exp.category)}</Data></Cell>
    <Cell ss:StyleID="AmountCell"><Data ss:Type="String">₹${parseFloat(exp.amount).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(exp.status)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(exp.payment_status)}</Data></Cell>
   </Row>`;
    });

    xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `shnoor_corporate_expenses_${new Date().toLocaleDateString('en-CA')}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Escaping helpers
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJS(str) {
    if (!str) return '';
    return str.toString()
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}
