
(function () {

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();


document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;

    // restoring current active theme
    const getActiveTheme = () => root.getAttribute('data-theme') || 'dark';

    //  trigger icon
    const updateIconState = (btn, theme) => {
        if (!btn) return;
        if (theme === 'dark') {
            btn.innerHTML = '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>';
            btn.title = 'Switch to Light Theme';
        } else {
            btn.innerHTML = '<i class="fa-solid fa-moon" style="color: #6366f1;"></i>';
            btn.title = 'Switch to Dark Theme';
        }
    };

    // Global theme 
    const changeTheme = (newTheme) => {
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Update all toggle buttons
        document.querySelectorAll('#theme-toggle-trigger').forEach(trigger => {
            updateIconState(trigger, newTheme);
        });
    };

    // Core dynamic factory for creating custom toggle instances
    const createThemeToggleNode = () => {
        const btn = document.createElement('button');
        btn.className = 'theme-toggle-btn';
        btn.id = 'theme-toggle-trigger';
        updateIconState(btn, getActiveTheme());

        btn.addEventListener('click', () => {
            const current = getActiveTheme();
            const target = current === 'dark' ? 'light' : 'dark';
            changeTheme(target);
        });

        return btn;
    };

    // --- DOM Injection sec -er ---
    const path = window.location.pathname;

    // Layout : Admin / Employee / Manager / Team Leader Sidebars
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const themeRow = document.createElement('div');
        themeRow.className = 'sidebar-theme-item';

        const label = document.createElement('span');
        label.innerHTML = '<i class="fa-solid fa-circle-half-stroke" style="color: var(--primary);"></i> Theme Mode';

        const toggleButton = createThemeToggleNode();

        themeRow.appendChild(label);
        themeRow.appendChild(toggleButton);

        //  logout button in navbarjkj
        const logoutAnchor = Array.from(sidebar.querySelectorAll('.nav-item, a')).find(el => {
            const text = el.textContent.toLowerCase();
            const href = el.getAttribute('href') || '';
            return text.includes('logout') || href.includes('login.html');
        });

        if (logoutAnchor) {
            sidebar.insertBefore(themeRow, logoutAnchor);
        } else {
            sidebar.appendChild(themeRow);
        }
    }
    // Layout : Landing Pages with Navigation bars
    else if (document.querySelector('.navbar')) {
        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            const toggleButton = createThemeToggleNode();
            toggleButton.style.marginRight = '1rem';
            // Prepend as the first element in the controls section
            navActions.insertBefore(toggleButton, navActions.firstChild);
        }
    }
    // Layout forlogin and other pagesss
    else if (document.querySelector('.login-wrapper') || path.includes('login.html')) {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('style', 'position: fixed; top: 1.5rem; right: 1.5rem; z-index: 1000;');

        const toggleButton = createThemeToggleNode();
        wrapper.appendChild(toggleButton);
        document.body.appendChild(wrapper);
    }
});
