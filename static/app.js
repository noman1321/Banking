const API_BASE = '/api';

// State management
let currentSection = 'data-entry';
let selectedCurrency = 'USD'; // Default currency

// Currency configuration
const currencies = {
    'USD': { symbol: '$', code: 'USD', name: 'US Dollar', position: 'before' },
    'EUR': { symbol: '€', code: 'EUR', name: 'Euro', position: 'before' },
    'GBP': { symbol: '£', code: 'GBP', name: 'British Pound', position: 'before' },
    'JPY': { symbol: '¥', code: 'JPY', name: 'Japanese Yen', position: 'before' },
    'CNY': { symbol: '¥', code: 'CNY', name: 'Chinese Yuan', position: 'before' },
    'INR': { symbol: '₹', code: 'INR', name: 'Indian Rupee', position: 'before' },
    'AUD': { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', position: 'before' },
    'CAD': { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar', position: 'before' },
    'CHF': { symbol: 'Fr', code: 'CHF', name: 'Swiss Franc', position: 'before' },
    'SGD': { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar', position: 'before' },
    'AED': { symbol: 'د.إ', code: 'AED', name: 'UAE Dirham', position: 'before' },
    'SAR': { symbol: 'ر.س', code: 'SAR', name: 'Saudi Riyal', position: 'before' },
    'KWD': { symbol: 'د.ك', code: 'KWD', name: 'Kuwaiti Dinar', position: 'before' },
    'QAR': { symbol: 'ر.ق', code: 'QAR', name: 'Qatari Riyal', position: 'before' },
    'ZAR': { symbol: 'R', code: 'ZAR', name: 'South African Rand', position: 'before' },
    'BRL': { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', position: 'before' },
    'MXN': { symbol: '$', code: 'MXN', name: 'Mexican Peso', position: 'before' }
};

// Currency formatting function
function formatCurrency(amount, currencyCode = null) {
    const currency = currencyCode ? currencies[currencyCode] : currencies[selectedCurrency];
    if (!currency) return `$${amount.toFixed(2)}`; // Fallback to USD
    
    const formatted = amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
    
    if (currency.position === 'before') {
        return `${currency.symbol}${formatted}`;
    } else {
        return `${formatted} ${currency.symbol}`;
    }
}

// Change currency
function changeCurrency() {
    const currencySelect = document.getElementById('currencySelector');
    selectedCurrency = currencySelect.value;
    localStorage.setItem('selectedCurrency', selectedCurrency);
    
    // Reload current section to update currency display
    if (currentSection) {
        showSection(currentSection);
    }
}

// Load currency from localStorage
function loadCurrency() {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && currencies[savedCurrency]) {
        selectedCurrency = savedCurrency;
        const currencySelect = document.getElementById('currencySelector');
        if (currencySelect) {
            currencySelect.value = selectedCurrency;
        }
    }
}

// Theme management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    console.log('Theme loaded:', savedTheme);
}

function toggleTheme(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const html = document.documentElement;
    let currentTheme = html.getAttribute('data-theme');
    
    // If no theme is set, check localStorage or default to dark
    if (!currentTheme) {
        currentTheme = localStorage.getItem('theme') || 'dark';
        html.setAttribute('data-theme', currentTheme);
    }
    
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update theme
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon and text
    updateThemeIcon(newTheme);
    
    console.log('Theme toggled from', currentTheme, 'to', newTheme);
    
    return false;
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-moon';
        } else {
            themeIcon.className = 'fas fa-sun';
        }
    }
    
    if (themeText) {
        themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTheme(); // Load saved theme preference first
    initializeNavigation();
    loadCurrency(); // Load saved currency preference
    showSection('home');
    initLandingPageAnimations();
    setupFileUpload();
    loadTransactions();
    
    // Set today's date as default for all transaction forms
    const dateInputs = document.querySelectorAll('.transaction-date');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.valueAsDate = new Date();
        }
    });
    
    // Setup theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme(e);
            return false;
        };
    }
    
    // Ensure theme icon is updated on load
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark';
    if (!document.documentElement.getAttribute('data-theme')) {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }
    updateThemeIcon(currentTheme);
});

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.getElementById('navToggle');
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            
            // Handle anchor links within landing page
            if (['workspace', 'about'].includes(section)) {
                const homeSection = document.getElementById('home');
                if (homeSection && homeSection.classList.contains('hidden')) {
                    // Show landing page first
                    showSection('home');
                    setTimeout(() => {
                        const targetSection = document.getElementById(section);
                        if (targetSection) {
                            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                } else {
                    // Landing page is already visible, just scroll
                    const targetSection = document.getElementById(section);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                return;
            }
            
            showSection(section);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            if (navMenuWrapper) {
                navMenuWrapper.classList.remove('active');
            }
        });
    });
    
    // Handle CTA button clicks
    const ctaButtons = document.querySelectorAll('.nav-cta, .cta-btn, .hero-btn');
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.substring(1);
                showSection(sectionId);
            }
        });
    });
    
    if (navToggle && navMenuWrapper) {
        navToggle.addEventListener('click', () => {
            navMenuWrapper.classList.toggle('active');
        });
    }
    
    // Initialize navigation state based on current section
    const currentSectionId = currentSection || 'home';
    updateNavigation(currentSectionId);
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        currentSection = sectionId;
        
        // Update navigation based on section
        updateNavigation(sectionId);
        
        // Handle smooth scroll for landing page sections
        if (sectionId === 'home') {
            // Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (['workspace', 'about'].includes(sectionId)) {
            // These are anchor links within landing page
            if (document.getElementById('home') && !document.getElementById('home').classList.contains('hidden')) {
                // Landing page is visible, scroll to section
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return; // Don't load section data for these
            } else {
                // Landing page is hidden, show it first then scroll
                showSection('home');
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                return;
            }
        } else {
            // Scroll to top for workspace sections
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Load section data
        switch(sectionId) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'trial-balance':
                loadTrialBalance();
                break;
            case 'balance-sheet':
                loadBalanceSheet();
                break;
            case 'income-statement':
                loadIncomeStatement();
                break;
            case 'ratios':
                loadRatios();
                break;
            case 'insights':
                loadChatHistory();
                break;
            case 'chat':
                loadChatHistory();
                break;
            case 'home':
                // Landing page - no additional loading needed
                break;
        }
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu if open
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');
    if (navMenuWrapper) {
        navMenuWrapper.classList.remove('active');
    }
}

function updateNavigation(sectionId) {
    const landingMenu = document.getElementById('navMenuLanding');
    const workspaceMenu = document.getElementById('navMenuWorkspace');
    
    // Check if it's a workspace section
    const workspaceSections = ['data-entry', 'dashboard', 'trial-balance', 'balance-sheet', 'income-statement', 'ratios', 'insights', 'chat'];
    const isWorkspace = workspaceSections.includes(sectionId);
    
    if (isWorkspace) {
        // Show workspace menu, hide landing menu
        if (landingMenu) landingMenu.classList.add('hidden');
        if (workspaceMenu) workspaceMenu.classList.remove('hidden');
    } else {
        // Show landing menu, hide workspace menu
        if (landingMenu) landingMenu.classList.remove('hidden');
        if (workspaceMenu) workspaceMenu.classList.add('hidden');
    }
}

// Utility functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// Toast Notification System
function showToast(message, type = 'info', duration = 5000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; padding: 0.25rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('slide-out');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// Keep showAlert for backward compatibility
function showAlert(message, type = 'info') {
    showToast(message, type);
}

// API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.detail || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Transaction management
// Account Row Management Functions
function createAccountRow(type = 'debit') {
    const placeholder = type === 'debit' 
        ? 'Account Name (e.g., Cash, Inventory)' 
        : 'Account Name (e.g., Sales Revenue, Accounts Payable)';
    
    return `
        <div class="account-row">
            <div class="account-input-group">
                <input type="text" class="account-name-input" placeholder="${placeholder}" required>
                <input type="number" class="account-amount-input" min="0" step="0.01" placeholder="Amount" required>
                <div class="account-actions">
                    <button type="button" class="btn-icon btn-add-row" onclick="${type === 'debit' ? 'addDebitRowBefore' : 'addCreditRowBefore'}(this)" title="Add Before">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <button type="button" class="btn-icon btn-add-row" onclick="${type === 'debit' ? 'addDebitRowAfter' : 'addCreditRowAfter'}(this)" title="Add After">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <button type="button" class="btn-icon btn-remove-row" onclick="removeAccountRow(this)" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addDebitRow(button) {
    const form = button.closest('.transaction-form');
    const container = form ? form.querySelector('.debit-accounts') : document.querySelector('.debit-accounts');
    if (container) {
        container.insertAdjacentHTML('beforeend', createAccountRow('debit'));
    }
}

function addCreditRow(button) {
    const form = button.closest('.transaction-form');
    const container = form ? form.querySelector('.credit-accounts') : document.querySelector('.credit-accounts');
    if (container) {
        container.insertAdjacentHTML('beforeend', createAccountRow('credit'));
    }
}

function addDebitRowBefore(button) {
    const row = button.closest('.account-row');
    row.insertAdjacentHTML('beforebegin', createAccountRow('debit'));
}

function addDebitRowAfter(button) {
    const row = button.closest('.account-row');
    row.insertAdjacentHTML('afterend', createAccountRow('debit'));
}

function addCreditRowBefore(button) {
    const row = button.closest('.account-row');
    row.insertAdjacentHTML('beforebegin', createAccountRow('credit'));
}

function addCreditRowAfter(button) {
    const row = button.closest('.account-row');
    row.insertAdjacentHTML('afterend', createAccountRow('credit'));
}

function removeAccountRow(button) {
    const container = button.closest('.debit-accounts') || button.closest('.credit-accounts');
    const rows = container.querySelectorAll('.account-row');
    
    if (rows.length <= 1) {
        showAlert('You must have at least one account row', 'error');
        return;
    }
    
    const row = button.closest('.account-row');
    row.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        row.remove();
    }, 300);
}

// Create a new transaction form
function createTransactionForm(index) {
    return `
        <form class="transaction-form" onsubmit="addTransaction(event, this)">
            <div class="transaction-form-header">
                <h3><i class="fas fa-file-invoice"></i> Transaction Entry #${index}</h3>
                <button type="button" class="btn-icon btn-remove-form" onclick="removeTransactionForm(this)" title="Remove Transaction">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="form-group">
                <label>Date</label>
                <input type="date" class="transaction-date" required>
            </div>
            
            <!-- Debit Accounts Section -->
            <div class="accounts-section">
                <div class="accounts-header">
                    <label><i class="fas fa-arrow-down"></i> Debit Accounts</label>
                    <button type="button" class="btn-icon btn-add" onclick="addDebitRow(this)" title="Add Debit Account">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="debit-accounts">
                    ${createAccountRow('debit')}
                </div>
            </div>

            <!-- Credit Accounts Section -->
            <div class="accounts-section">
                <div class="accounts-header">
                    <label><i class="fas fa-arrow-up"></i> Credit Accounts</label>
                    <button type="button" class="btn-icon btn-add" onclick="addCreditRow(this)" title="Add Credit Account">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="credit-accounts">
                    ${createAccountRow('credit')}
                </div>
            </div>

            <div class="form-group">
                <label>Description</label>
                <textarea class="transaction-description" rows="3" placeholder="Transaction details"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Transaction
                </button>
                <button type="button" class="btn btn-secondary" onclick="addAnotherTransaction()">
                    <i class="fas fa-plus-circle"></i> Add Another Transaction
                </button>
            </div>
        </form>
    `;
}

function addAnotherTransaction() {
    const container = document.getElementById('transactionFormsContainer');
    const forms = container.querySelectorAll('.transaction-form');
    const nextIndex = forms.length + 1;
    container.insertAdjacentHTML('beforeend', createTransactionForm(nextIndex));
    
    // Show remove buttons for all forms (except first one can optionally be hidden)
    forms.forEach(form => {
        const removeBtn = form.querySelector('.btn-remove-form');
        if (removeBtn) removeBtn.style.display = 'block';
    });
    
    // Scroll to new form
    const newForm = container.querySelector('.transaction-form:last-child');
    if (newForm) {
        newForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Focus on date input
        const dateInput = newForm.querySelector('.transaction-date');
        if (dateInput) {
            setTimeout(() => dateInput.focus(), 300);
        }
    }
}

function removeTransactionForm(button) {
    const container = document.getElementById('transactionFormsContainer');
    const forms = container.querySelectorAll('.transaction-form');
    
    if (forms.length <= 1) {
        showAlert('You must have at least one transaction form', 'error');
        return;
    }
    
    const form = button.closest('.transaction-form');
    form.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        form.remove();
        // Update form numbers
        updateFormNumbers();
    }, 300);
}

function updateFormNumbers() {
    const forms = document.querySelectorAll('.transaction-form');
    forms.forEach((form, index) => {
        const header = form.querySelector('.transaction-form-header h3');
        if (header) {
            header.innerHTML = `<i class="fas fa-file-invoice"></i> Transaction Entry #${index + 1}`;
        }
    });
}

async function addTransaction(event, formElement) {
    event.preventDefault();
    
    const form = formElement || event.target.closest('.transaction-form');
    if (!form) return;
    
    const date = form.querySelector('.transaction-date').value;
    const description = form.querySelector('.transaction-description').value || '';
    
    // Collect debit accounts from this form
    const debitRows = form.querySelectorAll('.debit-accounts .account-row');
    const debitAccounts = [];
    
    debitRows.forEach(row => {
        const nameInput = row.querySelector('.account-name-input');
        const amountInput = row.querySelector('.account-amount-input');
        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        
        if (name && amount > 0) {
            debitAccounts.push({ account: name, amount });
        }
    });
    
    // Collect credit accounts from this form
    const creditRows = form.querySelectorAll('.credit-accounts .account-row');
    const creditAccounts = [];
    
    creditRows.forEach(row => {
        const nameInput = row.querySelector('.account-name-input');
        const amountInput = row.querySelector('.account-amount-input');
        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        
        if (name && amount > 0) {
            creditAccounts.push({ account: name, amount });
        }
    });
    
    // Validation
    if (debitAccounts.length === 0 && creditAccounts.length === 0) {
        showAlert('Please add at least one debit or credit account', 'error');
        return;
    }
    
    // Calculate totals
    const totalDebit = debitAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalCredit = creditAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        showAlert(`Debits and credits must balance! Total Debit: ${formatCurrency(totalDebit)}, Total Credit: ${formatCurrency(totalCredit)}`, 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Create transactions for each debit account
        for (const debitAcc of debitAccounts) {
            const data = {
                date,
                account: debitAcc.account,
                debit: debitAcc.amount,
                credit: 0,
                description
            };
            await apiCall('/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        // Create transactions for each credit account
        for (const creditAcc of creditAccounts) {
            const data = {
                date,
                account: creditAcc.account,
                debit: 0,
                credit: creditAcc.amount,
                description
            };
            await apiCall('/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        showAlert('Transactions added successfully!', 'success');
        
        // Reset this form
        form.reset();
        const dateInput = form.querySelector('.transaction-date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        
        // Reset account rows to one each in this form
        resetFormRows(form);
        
        await loadTransactions();
        
        // Refresh current section if needed
        if (currentSection !== 'data-entry') {
            showSection(currentSection);
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function addAllTransactions() {
    const forms = document.querySelectorAll('.transaction-form');
    if (forms.length === 0) {
        showAlert('No transactions to add', 'error');
        return;
    }
    
    try {
        showLoading();
        let totalAdded = 0;
        
        for (const form of forms) {
            const date = form.querySelector('.transaction-date').value;
            const description = form.querySelector('.transaction-description').value || '';
            
            // Collect debit accounts
            const debitRows = form.querySelectorAll('.debit-accounts .account-row');
            const debitAccounts = [];
            
            debitRows.forEach(row => {
                const nameInput = row.querySelector('.account-name-input');
                const amountInput = row.querySelector('.account-amount-input');
                const name = nameInput.value.trim();
                const amount = parseFloat(amountInput.value) || 0;
                
                if (name && amount > 0) {
                    debitAccounts.push({ account: name, amount });
                }
            });
            
            // Collect credit accounts
            const creditRows = form.querySelectorAll('.credit-accounts .account-row');
            const creditAccounts = [];
            
            creditRows.forEach(row => {
                const nameInput = row.querySelector('.account-name-input');
                const amountInput = row.querySelector('.account-amount-input');
                const name = nameInput.value.trim();
                const amount = parseFloat(amountInput.value) || 0;
                
                if (name && amount > 0) {
                    creditAccounts.push({ account: name, amount });
                }
            });
            
            // Skip if no accounts
            if (debitAccounts.length === 0 && creditAccounts.length === 0) {
                continue;
            }
            
            // Validate balance
            const totalDebit = debitAccounts.reduce((sum, acc) => sum + acc.amount, 0);
            const totalCredit = creditAccounts.reduce((sum, acc) => sum + acc.amount, 0);
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                showAlert(`Transaction ${totalAdded + 1} doesn't balance! Skipping...`, 'warning');
                continue;
            }
            
            // Add debit transactions
            for (const debitAcc of debitAccounts) {
                const data = {
                    date,
                    account: debitAcc.account,
                    debit: debitAcc.amount,
                    credit: 0,
                    description
                };
                await apiCall('/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                totalAdded++;
            }
            
            // Add credit transactions
            for (const creditAcc of creditAccounts) {
                const data = {
                    date,
                    account: creditAcc.account,
                    debit: 0,
                    credit: creditAcc.amount,
                    description
                };
                await apiCall('/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                totalAdded++;
            }
        }
        
        if (totalAdded > 0) {
            showAlert(`${totalAdded} transactions added successfully!`, 'success');
            
            // Reset all forms
            forms.forEach(form => {
                form.reset();
                const dateInput = form.querySelector('.transaction-date');
                if (dateInput) {
                    dateInput.valueAsDate = new Date();
                }
                resetFormRows(form);
            });
            
            // Reset to one form
            const container = document.getElementById('transactionFormsContainer');
            if (container) {
                container.innerHTML = createTransactionForm(1);
                const firstDateInput = container.querySelector('.transaction-date');
                if (firstDateInput) {
                    firstDateInput.valueAsDate = new Date();
                }
            }
            
            await loadTransactions();
            
            if (currentSection !== 'data-entry') {
                showSection(currentSection);
            }
        } else {
            showAlert('No valid transactions to add', 'error');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function resetFormRows(form) {
    // Reset debit accounts to one row
    const debitContainer = form.querySelector('.debit-accounts');
    if (debitContainer) {
        debitContainer.innerHTML = createAccountRow('debit');
    }
    
    // Reset credit accounts to one row
    const creditContainer = form.querySelector('.credit-accounts');
    if (creditContainer) {
        creditContainer.innerHTML = createAccountRow('credit');
    }
}

async function loadTransactions() {
    try {
        const data = await apiCall('/transactions');
        
        if (data.transactions && data.transactions.length > 0) {
            allTransactions = data.transactions;
            const searchInput = document.getElementById('transactionSearch');
            const searchTerm = searchInput ? searchInput.value : '';
            displayTransactions(data.transactions, searchTerm);
        } else {
            allTransactions = [];
            document.getElementById('transactionsTable').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions yet. Add your first transaction above!</p>';
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Table sorting state
let sortState = {
    column: null,
    direction: 'asc'
};

function sortTable(columnIndex, transactions) {
    const columnMap = ['id', 'date', 'account', 'debit', 'credit', 'description'];
    const column = columnMap[columnIndex];
    
    const sorted = [...transactions].sort((a, b) => {
        let aVal, bVal;
        
        if (column === 'date') {
            aVal = new Date(a.date);
            bVal = new Date(b.date);
        } else if (column === 'debit' || column === 'credit') {
            aVal = parseFloat(a[column]) || 0;
            bVal = parseFloat(b[column]) || 0;
        } else {
            aVal = String(a[column] || '').toLowerCase();
            bVal = String(b[column] || '').toLowerCase();
        }
        
        if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

function displayTransactions(transactions, searchTerm = '') {
    const tableContainer = document.getElementById('transactionsTable');
    
    // Filter transactions if search term exists
    let filteredTransactions = transactions;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredTransactions = transactions.filter(t => 
            t.account.toLowerCase().includes(term) ||
            t.date.includes(term) ||
            (t.description || '').toLowerCase().includes(term) ||
            t.debit.toString().includes(term) ||
            t.credit.toString().includes(term)
        );
    }
    
    // Apply sorting if active
    if (sortState.column) {
        const columnMap = ['id', 'date', 'account', 'debit', 'credit', 'description'];
        const columnIndex = columnMap.indexOf(sortState.column);
        if (columnIndex !== -1) {
            filteredTransactions = sortTable(columnIndex, filteredTransactions);
        }
    }
    
    // Pagination
    const itemsPerPage = 20;
    let currentPage = parseInt(sessionStorage.getItem('transactionsPage')) || 1;
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    let html = `
        <div class="table-controls">
            <input type="text" 
                   class="table-search" 
                   placeholder="Search transactions..." 
                   id="transactionSearch"
                   value="${searchTerm}"
                   oninput="filterTransactions(this.value)">
            <div style="color: var(--text-secondary); font-size: 0.875rem;">
                Showing ${startIndex + 1}-${Math.min(endIndex, filteredTransactions.length)} of ${filteredTransactions.length}
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th class="sortable ${sortState.column === 'id' ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}" 
                            onclick="sortTransactions(0)">ID</th>
                        <th class="sortable ${sortState.column === 'date' ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}" 
                            onclick="sortTransactions(1)">Date</th>
                        <th class="sortable ${sortState.column === 'account' ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}" 
                            onclick="sortTransactions(2)">Account</th>
                        <th class="sortable ${sortState.column === 'debit' ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}" 
                            onclick="sortTransactions(3)">Debit</th>
                        <th class="sortable ${sortState.column === 'credit' ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}" 
                            onclick="sortTransactions(4)">Credit</th>
                        <th class="sortable ${sortState.column === 'description' ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}" 
                            onclick="sortTransactions(5)">Description</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    paginatedTransactions.forEach((transaction, index) => {
        const actualIndex = startIndex + index;
        html += `
            <tr>
                <td>${actualIndex + 1}</td>
                <td>${transaction.date}</td>
                <td>${transaction.account}</td>
                <td>${formatCurrency(parseFloat(transaction.debit))}</td>
                <td>${formatCurrency(parseFloat(transaction.credit))}</td>
                <td>${transaction.description || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Add pagination if needed
    if (totalPages > 1) {
        html += `
            <div class="table-pagination">
                <button class="pagination-btn" 
                        onclick="changeTransactionsPage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span style="padding: 0 1rem; color: var(--text-secondary);">
                    Page ${currentPage} of ${totalPages}
                </span>
                <button class="pagination-btn" 
                        onclick="changeTransactionsPage(${currentPage + 1})" 
                        ${currentPage === totalPages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }
    
    tableContainer.innerHTML = html;
}

// Store transactions globally for sorting/filtering
let allTransactions = [];

function sortTransactions(columnIndex) {
    if (allTransactions.length === 0) return;
    const columnMap = ['id', 'date', 'account', 'debit', 'credit', 'description'];
    const column = columnMap[columnIndex];
    
    if (sortState.column === column) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }
    
    const searchInput = document.getElementById('transactionSearch');
    const searchTerm = searchInput ? searchInput.value : '';
    displayTransactions(allTransactions, searchTerm);
}

function filterTransactions(searchTerm) {
    displayTransactions(allTransactions, searchTerm);
    sessionStorage.setItem('transactionsPage', '1');
}

function changeTransactionsPage(page) {
    const searchInput = document.getElementById('transactionSearch');
    const searchTerm = searchInput ? searchInput.value : '';
    sessionStorage.setItem('transactionsPage', page.toString());
    displayTransactions(allTransactions, searchTerm);
}

async function deleteTransaction() {
    const id = parseInt(document.getElementById('deleteId').value);
    
    if (!id || id < 1) {
        showAlert('Please enter a valid transaction ID', 'error');
        return;
    }
    
    try {
        showLoading();
        await apiCall(`/transactions/${id - 1}`, { method: 'DELETE' });
        showAlert('Transaction deleted successfully!', 'success');
        document.getElementById('deleteId').value = '';
        await loadTransactions();
        
        if (currentSection !== 'data-entry') {
            showSection(currentSection);
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        await apiCall('/transactions', { method: 'DELETE' });
        showAlert('All data cleared successfully!', 'success');
        await loadTransactions();
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadSampleData() {
    try {
        showLoading();
        await apiCall('/transactions/load-sample', { method: 'POST' });
        showAlert('Sample data loaded successfully!', 'success');
        await loadTransactions();
        
        if (currentSection !== 'data-entry') {
            showSection(currentSection);
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function exportTransactions() {
    try {
        const data = await apiCall('/export/transactions');
        
        const blob = new Blob([data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Transactions exported successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// File upload
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--accent)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border)';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border)';
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload({ target: { files: [file] } });
        }
    });
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = file.name.split('.').pop().toLowerCase();
    const preview = document.getElementById('filePreview');
    
    try {
        showLoading();
        
        let endpoint;
        if (fileType === 'csv') {
            endpoint = '/transactions/upload-csv';
        } else if (fileType === 'xlsx' || fileType === 'xls') {
            endpoint = '/transactions/upload-excel';
        } else {
            endpoint = '/transactions/parse-document';
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert(data.message || 'File uploaded successfully!', 'success');
            await loadTransactions();
            
            if (currentSection !== 'data-entry') {
                showSection(currentSection);
            }
        } else {
            throw new Error(data.message || data.detail || 'Upload failed');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
        event.target.value = '';
    }
}

// Dashboard
async function loadDashboard() {
    try {
        showLoading();
        const data = await apiCall('/dashboard');
        
        if (!data.metrics) {
            document.getElementById('dashboardMetrics').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions available. Add data in the Data Entry tab.</p>';
            return;
        }
        
        const metrics = data.metrics;
        
        // Display metrics
        document.getElementById('dashboardMetrics').innerHTML = `
            <div class="metric-card">
                <h3>Total Debits</h3>
                <div class="value">${formatCurrency(metrics.total_debits)}</div>
            </div>
            <div class="metric-card">
                <h3>Total Credits</h3>
                <div class="value">${formatCurrency(metrics.total_credits)}</div>
            </div>
            <div class="metric-card">
                <h3>Difference</h3>
                <div class="value">${formatCurrency(metrics.difference)}</div>
            </div>
            <div class="metric-card">
                <h3>Transactions</h3>
                <div class="value">${metrics.transaction_count}</div>
            </div>
        `;
        
        // Create charts
        createAccountBalancesChart(metrics.account_summary);
        createDebitsCreditsChart(metrics.account_summary);
        createTimelineChart();
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function createAccountBalancesChart(accountSummary) {
    const accounts = accountSummary.map(a => a.account);
    const nets = accountSummary.map(a => a.net);
    
    const trace = {
        x: accounts,
        y: nets,
        type: 'bar',
        marker: {
            color: nets.map(n => n >= 0 ? '#10B981' : '#EF4444'),
            line: { color: 'rgba(0,0,0,0)', width: 0 },
            opacity: 0.9
        },
        text: nets.map(n => formatCurrency(n)),
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Balance: %{text}<extra></extra>'
    };
    
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#F1F5F9', family: 'inherit' },
        xaxis: { 
            gridcolor: '#334155',
            tickangle: -45,
            showgrid: false
        },
        yaxis: { 
            gridcolor: '#334155',
            showgrid: true
        },
        margin: { t: 60, b: 100, l: 60, r: 40 },
        hovermode: 'closest',
        showlegend: false
    };
    
    const config = { 
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
    };
    
    Plotly.newPlot('accountBalancesChart', [trace], layout, config);
}

function createDebitsCreditsChart(accountSummary) {
    const accounts = accountSummary.map(a => a.account);
    const debits = accountSummary.map(a => a.debit);
    const credits = accountSummary.map(a => a.credit);
    
    const trace1 = {
        x: accounts,
        y: debits,
        name: 'Debits',
        type: 'bar',
        marker: { 
            color: '#3B82F6',
            line: { color: '#2563EB', width: 1 },
            opacity: 0.9
        },
        hovertemplate: '<b>%{x}</b><br>Debit: %{text}<extra></extra>',
        text: debits.map(d => formatCurrency(d)),
        textposition: 'outside'
    };
    
    const trace2 = {
        x: accounts,
        y: credits,
        name: 'Credits',
        type: 'bar',
        marker: { 
            color: '#10B981',
            line: { color: '#059669', width: 1 },
            opacity: 0.9
        },
        hovertemplate: '<b>%{x}</b><br>Credit: %{text}<extra></extra>',
        text: credits.map(c => formatCurrency(c)),
        textposition: 'outside'
    };
    
    const layout = {
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#F1F5F9', family: 'inherit' },
        xaxis: { 
            gridcolor: '#334155',
            tickangle: -45,
            showgrid: false
        },
        yaxis: { 
            gridcolor: '#334155',
            showgrid: true
        },
        margin: { t: 60, b: 100, l: 60, r: 40 },
        hovermode: 'closest',
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'right',
            x: 1
        }
    };
    
    const config = { 
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
    };
    
    Plotly.newPlot('debitsCreditsChart', [trace1, trace2], layout, config);
}

async function createTimelineChart() {
    try {
        const data = await apiCall('/transactions');
        const transactions = data.transactions || [];
        
        if (transactions.length === 0) return;
        
        // Group by date
        const byDate = {};
        transactions.forEach(t => {
            if (!byDate[t.date]) {
                byDate[t.date] = { debit: 0, credit: 0 };
            }
            byDate[t.date].debit += parseFloat(t.debit);
            byDate[t.date].credit += parseFloat(t.credit);
        });
        
        const dates = Object.keys(byDate).sort();
        const debits = dates.map(d => byDate[d].debit);
        const credits = dates.map(d => byDate[d].credit);
        
        const trace1 = {
            x: dates,
            y: debits,
            name: 'Debits',
            mode: 'lines+markers',
            line: { color: '#3B82F6', width: 3 },
            marker: { size: 8 }
        };
        
        const trace2 = {
            x: dates,
            y: credits,
            name: 'Credits',
            mode: 'lines+markers',
            line: { color: '#10B981', width: 3 },
            marker: { size: 8 }
        };
        
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#F1F5F9' },
            xaxis: { gridcolor: '#334155' },
            yaxis: { gridcolor: '#334155' },
            margin: { t: 40, b: 40, l: 60, r: 40 }
        };
        
        Plotly.newPlot('timelineChart', [trace1, trace2], layout, { responsive: true });
    } catch (error) {
        console.error('Error creating timeline chart:', error);
    }
}

// Trial Balance
async function loadTrialBalance() {
    try {
        showLoading();
        const data = await apiCall('/trial-balance');
        
        if (!data.success) {
            document.getElementById('trialBalanceContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions available.</p>';
            return;
        }
        
        const trialBalance = data.trial_balance;
        const totals = data.totals;
        
        let html = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Debits</h3>
                    <div class="value">${formatCurrency(totals.total_debits)}</div>
                </div>
                <div class="metric-card">
                    <h3>Total Credits</h3>
                    <div class="value">${formatCurrency(totals.total_credits)}</div>
                </div>
                <div class="metric-card">
                    <h3>Status</h3>
                    <div class="value">${totals.is_balanced ? '✅ Balanced' : '⚠️ Unbalanced'}</div>
                </div>
            </div>
            
            <div class="card">
                <h3>Trial Balance</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        trialBalance.forEach(item => {
            html += `
                <tr>
                    <td>${item.account}</td>
                    <td>${formatCurrency(parseFloat(item.debit))}</td>
                    <td>${formatCurrency(parseFloat(item.credit))}</td>
                    <td>${formatCurrency(parseFloat(item.balance))}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('trialBalanceContent').innerHTML = html;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Balance Sheet
async function loadBalanceSheet() {
    try {
        showLoading();
        const data = await apiCall('/balance-sheet');
        
        if (!data.success) {
            const errorMsg = data.message || 'No transactions available.';
            document.getElementById('balanceSheetContent').innerHTML = 
                `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">${errorMsg}</p>`;
            showAlert(errorMsg, 'warning');
            return;
        }
        
        const bs = data.balance_sheet;
        
        if (!bs) {
            document.getElementById('balanceSheetContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Unable to generate balance sheet.</p>';
            return;
        }
        
        let html = `
            <div class="grid-2">
                <div class="card">
                    <h3>Assets</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>Account</th><th>Balance</th></tr>
                            </thead>
                            <tbody>
        `;
        
        bs.assets.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.balance))}</td></tr>`;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="metric-card" style="margin-top: 1rem;">
                        <h3>Total Assets</h3>
                        <div class="value">${formatCurrency(bs.total_assets)}</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Liabilities & Equity</h3>
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">Liabilities:</h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr><th>Account</th><th>Balance</th></tr>
                                </thead>
                                <tbody>
        `;
        
        bs.liabilities.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.balance))}</td></tr>`;
        });
        
        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">Equity:</h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr><th>Account</th><th>Balance</th></tr>
                                </thead>
                                <tbody>
        `;
        
        bs.equity.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.balance))}</td></tr>`;
        });
        
        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="metric-card" style="margin-top: 1rem;">
                        <h3>Total Liabilities</h3>
                        <div class="value">${formatCurrency(bs.total_liabilities)}</div>
                    </div>
                    <div class="metric-card" style="margin-top: 1rem;">
                        <h3>Total Equity</h3>
                        <div class="value">${formatCurrency(bs.total_equity)}</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Balance Check</h3>
                <p style="color: ${bs.is_balanced ? 'var(--success)' : 'var(--danger)'};">
                    ${bs.is_balanced ? '✅ Balance Sheet is perfectly balanced!' : `⚠️ Balance Sheet is off by ${formatCurrency(Math.abs(bs.balance_check))}`}
                </p>
            </div>
        `;
        
        document.getElementById('balanceSheetContent').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading balance sheet:', error);
        const errorMsg = error.message || 'An error occurred while loading the balance sheet.';
        document.getElementById('balanceSheetContent').innerHTML = 
            `<div class="card">
                <div style="color: var(--danger); padding: 2rem; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <h3>Error Loading Balance Sheet</h3>
                    <p>${errorMsg}</p>
                </div>
            </div>`;
        showAlert(errorMsg, 'error');
    } finally {
        hideLoading();
    }
}

// Income Statement
async function loadIncomeStatement() {
    try {
        showLoading();
        const data = await apiCall('/income-statement');
        
        if (!data.success) {
            document.getElementById('incomeStatementContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions available.</p>';
            return;
        }
        
        const is = data.income_statement;
        
        let html = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Revenue</h3>
                    <div class="value">${formatCurrency(is.total_revenue)}</div>
                </div>
                <div class="metric-card">
                    <h3>Total Expenses</h3>
                    <div class="value">${formatCurrency(is.total_expenses)}</div>
                </div>
                <div class="metric-card">
                    <h3>Net Income</h3>
                    <div class="value" style="color: ${is.net_income >= 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${formatCurrency(is.net_income)}
                    </div>
                </div>
            </div>
            
            <div class="grid-2">
                <div class="card">
                    <h3>💰 Revenue</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>Account</th><th>Amount</th></tr>
                            </thead>
                            <tbody>
        `;
        
        is.revenues.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.credit || 0))}</td></tr>`;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="card">
                    <h3>💸 Expenses</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>Account</th><th>Amount</th></tr>
                            </thead>
                            <tbody>
        `;
        
        is.expenses.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.debit || 0))}</td></tr>`;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('incomeStatementContent').innerHTML = html;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Financial Ratios
async function loadRatios() {
    try {
        showLoading();
        const data = await apiCall('/financial-ratios');
        
        if (!data.success || !data.ratios) {
            document.getElementById('ratiosContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Unable to calculate ratios. Please ensure you have complete balance sheet and income statement data.</p>';
            return;
        }
        
        const category = document.getElementById('ratioCategory').value;
        const categoryRatios = data.ratios[category];
        
        if (!categoryRatios) {
            document.getElementById('ratiosContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No ratios available for this category.</p>';
            return;
        }
        
        let html = `
            <div class="ratios-grid">
        `;
        
        Object.entries(categoryRatios).forEach(([name, info]) => {
            const value = info.value;
            let formattedValue = value.toFixed(2);
            
            if (name.includes('Margin') || name.includes('Return') || name.includes('Debt to Assets') || name.includes('Equity Ratio')) {
                formattedValue = `${value.toFixed(2)}%`;
            } else if (name.includes('Days')) {
                formattedValue = `${Math.round(value)} days`;
            }
            
            // Determine status badge
            let statusClass = 'badge-info';
            let statusText = 'Review';
            
            // Simple status determination (can be enhanced)
            if (category === 'Liquidity Ratios') {
                if (name === 'Current Ratio') {
                    statusClass = value >= 2 ? 'badge-success' : value >= 1 ? 'badge-warning' : 'badge-danger';
                    statusText = value >= 2 ? '✅ Excellent' : value >= 1 ? '⚠️ Adequate' : '❌ Poor';
                } else if (name === 'Quick Ratio') {
                    statusClass = value >= 1 ? 'badge-success' : value >= 0.5 ? 'badge-warning' : 'badge-danger';
                    statusText = value >= 1 ? '✅ Strong' : value >= 0.5 ? '⚠️ Watch' : '❌ Weak';
                }
            } else if (category === 'Profitability Ratios') {
                if (name.includes('Margin') || name.includes('Return')) {
                    statusClass = value >= 10 ? 'badge-success' : value > 0 ? 'badge-warning' : 'badge-danger';
                    statusText = value >= 10 ? '✅ Good' : value > 0 ? '⚠️ Low' : '❌ Loss';
                }
            }
            
            html += `
                <div class="ratio-card">
                    <div class="ratio-label">${name}</div>
                    <div class="ratio-value">${formattedValue}</div>
                    <div class="badge ${statusClass}" style="margin-bottom: 0.5rem;">${statusText}</div>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${info.description}</p>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">Benchmark: ${info.benchmark}</p>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
        
        // Add health score if available
        try {
            const healthData = await apiCall('/financial-health-score');
            if (healthData.success) {
                html += `
                    <div class="card">
                        <h3>Overall Financial Health Score</h3>
                        <div class="metric-card" style="margin-top: 1rem;">
                            <div class="value">${healthData.score}/${healthData.max_score}</div>
                            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                                ${healthData.score >= 80 ? '🌟 Excellent financial health!' : 
                                  healthData.score >= 60 ? '👍 Good financial health' : 
                                  healthData.score >= 40 ? '⚠️ Fair financial health' : 
                                  '🚨 Poor financial health'}
                            </p>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Error loading health score:', e);
        }
        
        document.getElementById('ratiosContent').innerHTML = html;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// AI Insights
async function generateInsights() {
    try {
        showLoading();
        const data = await apiCall('/ai-insights', { method: 'POST' });
        
        if (!data.success) {
            showAlert(data.message, 'error');
            return;
        }
        
        document.getElementById('insightsContent').innerHTML = `
            <div class="card">
                <div style="white-space: pre-wrap; line-height: 1.8;">${data.insights}</div>
            </div>
        `;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Chat
async function loadChatHistory() {
    try {
        const data = await apiCall('/chat/history');
        const history = data.history || [];
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        history.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${msg.role}`;
            messageDiv.textContent = msg.content;
            chatMessages.appendChild(messageDiv);
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to UI
    const chatMessages = document.getElementById('chatMessages');
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    input.value = '';
    input.disabled = true;
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message assistant typing';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        const data = await apiCall('/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
        
        // Remove typing indicator
        typingIndicator.remove();
        
        if (data.success) {
            // Add assistant response
            const assistantMsg = document.createElement('div');
            assistantMsg.className = 'chat-message assistant';
            assistantMsg.textContent = data.response;
            chatMessages.appendChild(assistantMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        typingIndicator.remove();
        showToast(error.message, 'error');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

async function clearChatHistory() {
    try {
        await apiCall('/chat/history', { method: 'DELETE' });
        document.getElementById('chatMessages').innerHTML = '';
        showAlert('Chat history cleared', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Allow Enter key in chat input
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});

// Landing Page Animations with GSAP
function initLandingPageAnimations() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded, animations disabled');
        return;
    }

    // Register ScrollTrigger plugin
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Hero Section Animations
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Hero content animations
    heroTimeline
        .from('.hero-badge', {
            opacity: 0,
            y: 20,
            duration: 0.8
        })
        .from('.title-line-1', {
            opacity: 0,
            x: -50,
            duration: 0.8
        }, '-=0.5')
        .from('.title-line-2', {
            opacity: 0,
            x: -50,
            duration: 0.8
        }, '-=0.6')
        .from('.hero-description', {
            opacity: 0,
            y: 30,
            duration: 1
        }, '-=0.4')
        .from('.hero-btn', {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.2
        }, '-=0.6')
        .from('.stat-item', {
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.15
        }, '-=0.4');

    // Floating cards animation
    gsap.from('.floating-card', {
        opacity: 0,
        scale: 0.5,
        duration: 1,
        stagger: 0.2,
        ease: 'back.out(1.7)',
        delay: 0.5
    });

    // Continuous floating animation for cards
    gsap.to('.card-1', {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });

    gsap.to('.card-2', {
        y: 15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 0.5
    });

    gsap.to('.card-3', {
        y: -15,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 1
    });

    gsap.to('.card-4', {
        y: 20,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 0.3
    });

    // Rotate floating cards slightly
    gsap.to('.floating-card', {
        rotation: 5,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        stagger: 0.3
    });

    // Scroll-triggered animations for features section
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.feature-card', {
            scrollTrigger: {
                trigger: '.features-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
        });

        // CTA section animation
        gsap.from('.cta-content', {
            scrollTrigger: {
                trigger: '.cta-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            scale: 0.9,
            duration: 1,
            ease: 'power3.out'
        });
    }

    // Animate stats counter
    animateCounters();
}

// Animate number counters
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        // Start animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(counter);
    });
}

// Handle navigation links (already handled in initializeNavigation, but override for home link)
document.addEventListener('DOMContentLoaded', () => {
    // Update existing nav link handlers for home
    const homeLink = document.querySelector('a[href="#home"]');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('home');
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

