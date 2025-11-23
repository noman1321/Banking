// ============================================
// CONFIGURATION
// ============================================
const API_BASE = '/api';
let currentSection = 'home';
let selectedCurrency = 'USD';

// Currency configuration
const currencies = {
    'USD': { symbol: '$', code: 'USD', name: 'US Dollar', position: 'before' },
    'EUR': { symbol: '€', code: 'EUR', name: 'Euro', position: 'before' },
    'GBP': { symbol: '£', code: 'GBP', name: 'British Pound', position: 'before' },
    'JPY': { symbol: '¥', code: 'JPY', name: 'Japanese Yen', position: 'before' },
    'INR': { symbol: '₹', code: 'INR', name: 'Indian Rupee', position: 'before' }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatCurrency(amount, currencyCode = null) {
    const currency = currencyCode ? currencies[currencyCode] : currencies[selectedCurrency];
    if (!currency) return `$${amount.toFixed(2)}`;
    
    const formatted = amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
    
    return currency.position === 'before' 
        ? `${currency.symbol}${formatted}` 
        : `${formatted} ${currency.symbol}`;
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    alert.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// ============================================
// API CALLS
// ============================================
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.detail || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Unable to connect to server. Please ensure the backend server is running on http://localhost:8000');
        }
        throw error;
    }
}

// ============================================
// NAVIGATION
// ============================================
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

function showSection(sectionId) {
    // Hide all sections immediately
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show selected section with fade in
    const section = document.getElementById(sectionId);
    if (section) {
        currentSection = sectionId;
        section.style.display = 'block';
        section.classList.add('active');
        section.style.animation = 'fadeIn 0.5s ease-out';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Load section data
        loadSectionData(sectionId);
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

function loadSectionData(sectionId) {
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
        case 'data-entry':
            loadTransactions();
            break;
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ============================================
// TRANSACTION MANAGEMENT
// ============================================
function createAccountRow(type = 'debit') {
    const placeholder = type === 'debit' 
        ? 'Account Name (e.g., Cash, Inventory)' 
        : 'Account Name (e.g., Sales Revenue, Accounts Payable)';
    
    return `
        <div class="account-row">
            <input type="text" class="input account-name" placeholder="${placeholder}" required>
            <input type="number" class="input account-amount" min="0" step="0.01" placeholder="Amount" required>
            <button type="button" class="btn-icon btn-remove" onclick="removeAccountRow(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function addDebitRow(button) {
    const form = button.closest('.transaction-form');
    const container = form ? form.querySelector('.debit-accounts') : document.querySelector('.debit-accounts');
    if (container) {
        container.insertAdjacentHTML('beforeend', createAccountRow('debit'));
        animateElement(container.lastElementChild);
    }
}

function addCreditRow(button) {
    const form = button.closest('.transaction-form');
    const container = form ? form.querySelector('.credit-accounts') : document.querySelector('.credit-accounts');
    if (container) {
        container.insertAdjacentHTML('beforeend', createAccountRow('credit'));
        animateElement(container.lastElementChild);
    }
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
    setTimeout(() => row.remove(), 300);
}

function animateElement(element) {
    if (element) {
        element.style.animation = 'fadeInUp 0.3s ease-out';
    }
}

async function addTransaction(event, formElement) {
    event.preventDefault();
    
    const form = formElement || event.target.closest('.transaction-form');
    if (!form) return;
    
    const date = form.querySelector('.transaction-date').value;
    const description = form.querySelector('.transaction-description').value || '';
    
    // Collect debit accounts
    const debitRows = form.querySelectorAll('.debit-accounts .account-row');
    const debitAccounts = [];
    debitRows.forEach(row => {
        const name = row.querySelector('.account-name').value.trim();
        const amount = parseFloat(row.querySelector('.account-amount').value) || 0;
        if (name && amount > 0) {
            debitAccounts.push({ account: name, amount });
        }
    });
    
    // Collect credit accounts
    const creditRows = form.querySelectorAll('.credit-accounts .account-row');
    const creditAccounts = [];
    creditRows.forEach(row => {
        const name = row.querySelector('.account-name').value.trim();
        const amount = parseFloat(row.querySelector('.account-amount').value) || 0;
        if (name && amount > 0) {
            creditAccounts.push({ account: name, amount });
        }
    });
    
    // Validation
    if (debitAccounts.length === 0 && creditAccounts.length === 0) {
        showAlert('Please add at least one debit or credit account', 'error');
        return;
    }
    
    const totalDebit = debitAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalCredit = creditAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        showAlert(`Debits and credits must balance! Total Debit: ${formatCurrency(totalDebit)}, Total Credit: ${formatCurrency(totalCredit)}`, 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Create transactions
        for (const debitAcc of debitAccounts) {
            await apiCall('/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    date, account: debitAcc.account, debit: debitAcc.amount, credit: 0, description
                })
            });
        }
        
        for (const creditAcc of creditAccounts) {
            await apiCall('/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    date, account: creditAcc.account, debit: 0, credit: creditAcc.amount, description
                })
            });
        }
        
        showAlert('Transactions added successfully!', 'success');
        form.reset();
        const dateInput = form.querySelector('.transaction-date');
        if (dateInput) dateInput.valueAsDate = new Date();
        
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

function addAnotherTransaction() {
    const container = document.getElementById('transactionFormsContainer');
    const forms = container.querySelectorAll('.transaction-form');
    const newForm = document.createElement('form');
    newForm.className = 'transaction-form';
    newForm.onsubmit = (e) => addTransaction(e, newForm);
    newForm.innerHTML = container.querySelector('.transaction-form').innerHTML;
    container.appendChild(newForm);
    animateElement(newForm);
}

async function loadTransactions() {
    try {
        const data = await apiCall('/transactions');
        const tableContainer = document.getElementById('transactionsTable');
        
        if (!tableContainer) return;
        
        if (data.transactions && data.transactions.length > 0) {
            displayTransactions(data.transactions);
        } else {
            tableContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions yet. Add your first transaction above!</p>';
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        // Don't show error on initial load if backend is not ready
        const tableContainer = document.getElementById('transactionsTable');
        if (tableContainer && currentSection === 'data-entry') {
            tableContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Unable to load transactions. Please ensure the server is running.</p>';
        }
    }
}

function displayTransactions(transactions) {
    const tableContainer = document.getElementById('transactionsTable');
    if (!tableContainer) return;
    
    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Account</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    transactions.forEach((transaction, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${transaction.date}</td>
                <td>${transaction.account}</td>
                <td>${formatCurrency(parseFloat(transaction.debit))}</td>
                <td>${formatCurrency(parseFloat(transaction.credit))}</td>
                <td>${transaction.description || '-'}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    tableContainer.innerHTML = html;
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

function changeCurrency() {
    const currencySelect = document.getElementById('currencySelector');
    selectedCurrency = currencySelect.value;
    localStorage.setItem('selectedCurrency', selectedCurrency);
    if (currentSection) {
        showSection(currentSection);
    }
}

// ============================================
// FILE UPLOAD
// ============================================
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--accent)';
        uploadArea.style.transform = 'scale(1.02)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.transform = 'scale(1)';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.transform = 'scale(1)';
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

// ============================================
// DASHBOARD
// ============================================
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
            color: nets.map(n => n >= 0 ? '#10b981' : '#ef4444'),
            line: { color: 'rgba(0,0,0,0)' }
        }
    };
    
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'var(--text-primary)' },
        xaxis: { gridcolor: 'var(--border)' },
        yaxis: { gridcolor: 'var(--border)' },
        margin: { t: 40, b: 40, l: 60, r: 40 }
    };
    
    Plotly.newPlot('accountBalancesChart', [trace], layout, { responsive: true });
}

function createDebitsCreditsChart(accountSummary) {
    const accounts = accountSummary.map(a => a.account);
    const debits = accountSummary.map(a => a.debit);
    const credits = accountSummary.map(a => a.credit);
    
    const trace1 = { x: accounts, y: debits, name: 'Debits', type: 'bar', marker: { color: '#3b82f6' } };
    const trace2 = { x: accounts, y: credits, name: 'Credits', type: 'bar', marker: { color: '#10b981' } };
    
    const layout = {
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'var(--text-primary)' },
        xaxis: { gridcolor: 'var(--border)' },
        yaxis: { gridcolor: 'var(--border)' },
        margin: { t: 40, b: 40, l: 60, r: 40 }
    };
    
    Plotly.newPlot('debitsCreditsChart', [trace1, trace2], layout, { responsive: true });
}

async function createTimelineChart() {
    try {
        const data = await apiCall('/transactions');
        const transactions = data.transactions || [];
        
        if (transactions.length === 0) return;
        
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
        
        const trace1 = { x: dates, y: debits, name: 'Debits', mode: 'lines+markers', line: { color: '#3b82f6', width: 3 }, marker: { size: 8 } };
        const trace2 = { x: dates, y: credits, name: 'Credits', mode: 'lines+markers', line: { color: '#10b981', width: 3 }, marker: { size: 8 } };
        
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'var(--text-primary)' },
            xaxis: { gridcolor: 'var(--border)' },
            yaxis: { gridcolor: 'var(--border)' },
            margin: { t: 40, b: 40, l: 60, r: 40 }
        };
        
        Plotly.newPlot('timelineChart', [trace1, trace2], layout, { responsive: true });
    } catch (error) {
        console.error('Error creating timeline chart:', error);
    }
}

// ============================================
// TRIAL BALANCE
// ============================================
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
        
        html += `</tbody></table></div></div>`;
        document.getElementById('trialBalanceContent').innerHTML = html;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// BALANCE SHEET
// ============================================
async function loadBalanceSheet() {
    try {
        showLoading();
        const data = await apiCall('/balance-sheet');
        
        if (!data.success) {
            document.getElementById('balanceSheetContent').innerHTML = 
                `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">${data.message || 'No transactions available.'}</p>`;
            return;
        }
        
        const bs = data.balance_sheet;
        
        let html = `
            <div class="grid">
                <div class="card">
                    <h3>Assets</h3>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Account</th><th>Balance</th></tr></thead>
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
                    <h4 style="margin: 1rem 0 0.5rem 0;">Liabilities:</h4>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Account</th><th>Balance</th></tr></thead>
                            <tbody>
        `;
        
        bs.liabilities.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.balance))}</td></tr>`;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                    <h4 style="margin: 1rem 0 0.5rem 0;">Equity:</h4>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Account</th><th>Balance</th></tr></thead>
                            <tbody>
        `;
        
        bs.equity.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.balance))}</td></tr>`;
        });
        
        html += `
                            </tbody>
                        </table>
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
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// INCOME STATEMENT
// ============================================
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
            <div class="grid">
                <div class="card">
                    <h3>Revenue</h3>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Account</th><th>Amount</th></tr></thead>
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
                    <h3>Expenses</h3>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Account</th><th>Amount</th></tr></thead>
                            <tbody>
        `;
        
        is.expenses.forEach(item => {
            html += `<tr><td>${item.account}</td><td>${formatCurrency(parseFloat(item.debit || 0))}</td></tr>`;
        });
        
        html += `</tbody></table></div></div></div>`;
        document.getElementById('incomeStatementContent').innerHTML = html;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// FINANCIAL RATIOS
// ============================================
async function loadRatios() {
    try {
        showLoading();
        const data = await apiCall('/financial-ratios');
        
        if (!data.success || !data.ratios) {
            document.getElementById('ratiosContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Unable to calculate ratios.</p>';
            return;
        }
        
        const category = document.getElementById('ratioCategory').value;
        const categoryRatios = data.ratios[category];
        
        if (!categoryRatios) {
            document.getElementById('ratiosContent').innerHTML = 
                '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No ratios available for this category.</p>';
            return;
        }
        
        let html = `<div class="metrics-grid">`;
        
        Object.entries(categoryRatios).forEach(([name, info]) => {
            const value = info.value;
            let formattedValue = value.toFixed(2);
            
            if (name.includes('Margin') || name.includes('Return') || name.includes('Debt to Assets') || name.includes('Equity Ratio')) {
                formattedValue = `${value.toFixed(2)}%`;
            } else if (name.includes('Days')) {
                formattedValue = `${Math.round(value)} days`;
            }
            
            html += `
                <div class="metric-card">
                    <h3>${name}</h3>
                    <div class="value">${formattedValue}</div>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">${info.description}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        document.getElementById('ratiosContent').innerHTML = html;
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// AI INSIGHTS
// ============================================
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

// ============================================
// CHAT
// ============================================
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
    
    const chatMessages = document.getElementById('chatMessages');
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    input.value = '';
    
    try {
        showLoading();
        const data = await apiCall('/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
        
        if (data.success) {
            const assistantMsg = document.createElement('div');
            assistantMsg.className = 'chat-message assistant';
            assistantMsg.textContent = data.response;
            chatMessages.appendChild(assistantMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
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

// ============================================
// INITIALIZATION
// ============================================
// Hide loading overlay immediately (before DOM ready)
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.style.display = 'none';
                overlay.classList.add('hidden');
            }
        });
    } else {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.add('hidden');
        }
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Force hide loading overlay
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.add('hidden');
    }
    hideLoading();
    
    // Load theme
    loadTheme();
    
    // Initialize navigation
    initializeNavigation();
    
    // Setup theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Load currency
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && currencies[savedCurrency]) {
        selectedCurrency = savedCurrency;
        const currencySelect = document.getElementById('currencySelector');
        if (currencySelect) {
            currencySelect.value = selectedCurrency;
        }
    }
    
    // Setup file upload
    setupFileUpload();
    
    // Set default date
    const dateInputs = document.querySelectorAll('.transaction-date');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.valueAsDate = new Date();
        }
    });
    
    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Setup hero button navigation
    document.querySelectorAll('.hero-actions a, .btn').forEach(btn => {
        if (btn.getAttribute('href') && btn.getAttribute('href').startsWith('#')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = btn.getAttribute('href').substring(1);
                showSection(sectionId);
            });
        }
    });
    
    // Show home section
    showSection('home');
    
    // Load transactions (don't show loading for initial load)
    loadTransactions();
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
