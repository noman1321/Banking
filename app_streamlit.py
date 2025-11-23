import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import os
from dotenv import load_dotenv

# Import utility functions from utils.py
from utils import (
    parse_document_with_ai,
    create_trial_balance,
    create_balance_sheet,
    create_income_statement,
    calculate_financial_ratios,
    generate_balance_sheet_csv,
    generate_income_statement_csv,
    get_ai_insights,
    chat_with_ai,
    get_sample_transactions
)

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(page_title="AI Accounting Dashboard", layout="wide", page_icon="📊")

# Enhanced professional CSS with modern fintech design
st.markdown("""
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    /* Color Palette - Professional Fintech */
    :root {
        --primary: #0F172A;
        --secondary: #1E293B;
        --accent: #3B82F6;
        --accent-light: #60A5FA;
        --success: #10B981;
        --warning: #F59E0B;
        --danger: #EF4444;
        --text-primary: #F1F5F9;
        --text-secondary: #CBD5E1;
        --border: #334155;
        --bg-card: #1E293B;
    }
    
    /* Main Container */
    .main {
        background: linear-gradient(135deg, #0F172A 0%, #1A1F35 100%);
        color: var(--text-primary);
    }
    
    /* Header Styling */
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
        margin-bottom: 2.5rem;
        letter-spacing: -0.5px;
    }
    
    /* Metric Cards */
    .metric-card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border: 1px solid #334155;
        padding: 1.5rem;
        border-radius: 12px;
        color: var(--text-primary);
        text-align: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .metric-card:hover {
        border-color: #3B82F6;
        box-shadow: 0 20px 25px rgba(59, 130, 246, 0.1);
        transform: translateY(-2px);
    }
    
    .metric-card h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #CBD5E1;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.75rem;
    }
    
    .metric-card .value {
        font-size: 2rem;
        font-weight: 700;
        color: #60A5FA;
        margin-bottom: 0.5rem;
    }
    
    /* Tab Styling */
    .stTab {
        font-size: 1rem;
        font-weight: 600;
        color: #CBD5E1;
        transition: all 0.3s ease;
    }
    
    .stTab:hover {
        color: #60A5FA;
    }
    
    /* Card Styling */
    .card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }
    
    .card:hover {
        border-color: #3B82F6;
        box-shadow: 0 20px 25px rgba(59, 130, 246, 0.1);
    }
    
    .card h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    .card h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.75rem;
    }
    
    /* Status Badges */
    .badge-success {
        background: rgba(16, 185, 129, 0.1);
        color: #10B981;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        display: inline-block;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .badge-warning {
        background: rgba(245, 158, 11, 0.1);
        color: #F59E0B;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        display: inline-block;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .badge-danger {
        background: rgba(239, 68, 68, 0.1);
        color: #EF4444;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        display: inline-block;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .badge-info {
        background: rgba(59, 130, 246, 0.1);
        color: #60A5FA;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        display: inline-block;
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    /* Button Styling */
    .stButton > button {
        background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        box-shadow: 0 10px 15px rgba(59, 130, 246, 0.4);
        transform: translateY(-2px);
    }
    
    /* Input Styling */
    .stTextInput > div > div > input,
    .stNumberInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stSelectbox > div > div > select {
        background: #1E293B !important;
        color: #F1F5F9 !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
        padding: 0.75rem !important;
        font-size: 0.95rem !important;
    }
    
    .stTextInput > div > div > input:focus,
    .stNumberInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus,
    .stSelectbox > div > div > select:focus {
        border-color: #3B82F6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }
    
    /* Dataframe Styling */
    .stDataFrame {
        background: #1E293B !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
    }
    
    /* Divider */
    hr {
        border: none;
        border-top: 1px solid #334155;
        margin: 2rem 0;
    }
    
    /* Alert Messages */
    .stAlert {
        border-radius: 8px;
        border: 1px solid #334155;
        padding: 1rem;
    }
    
    .stSuccess {
        background: rgba(16, 185, 129, 0.1) !important;
        border-color: #10B981 !important;
        color: #10B981 !important;
    }
    
    .stWarning {
        background: rgba(245, 158, 11, 0.1) !important;
        border-color: #F59E0B !important;
        color: #F59E0B !important;
    }
    
    .stError {
        background: rgba(239, 68, 68, 0.1) !important;
        border-color: #EF4444 !important;
        color: #EF4444 !important;
    }
    
    .stInfo {
        background: rgba(59, 130, 246, 0.1) !important;
        border-color: #3B82F6 !important;
        color: #60A5FA !important;
    }
    
    /* Ratio Card */
    .ratio-card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border: 1px solid #334155;
        padding: 1.25rem;
        border-radius: 10px;
        color: var(--text-primary);
        margin: 0.75rem 0;
        transition: all 0.3s ease;
    }
    
    .ratio-card:hover {
        border-color: #3B82F6;
        box-shadow: 0 10px 15px rgba(59, 130, 246, 0.1);
    }
    
    .ratio-card .label {
        font-size: 0.875rem;
        color: #CBD5E1;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.5rem;
    }
    
    .ratio-card .value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #60A5FA;
    }
    
    /* Footer */
    .footer {
        text-align: center;
        color: #CBD5E1;
        font-size: 0.875rem;
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #334155;
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: #1E293B;
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #3B82F6;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'transactions' not in st.session_state:
    st.session_state.transactions = []
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Main App Header
st.markdown('<h1 class="main-header">📊 AI Accounting Dashboard</h1>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### ⚙️ Dashboard Options")
    
    if st.button("🗑️ Clear All Data", use_container_width=True):
        st.session_state.transactions = []
        st.session_state.chat_history = []
        st.rerun()
    
    st.markdown("---")
    st.markdown("### 📋 Quick Actions")
    if st.button("📥 Load Sample Data", use_container_width=True):
        st.session_state.transactions = get_sample_transactions()
        st.success("Sample data loaded!")
        st.rerun()

# Main Tabs
tabs = st.tabs(["📝 Data Entry", "📊 Dashboard", "⚖️ Trial Balance", "💼 Balance Sheet", "📈 Income Statement", "📉 Financial Ratios", "🤖 AI Insights", "💬 Chat"])

# Tab 1: Data Entry
with tabs[0]:
    st.markdown('<div class="card"><h2>📝 Transaction Management</h2></div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown('<div class="card"><h3>Manual Entry</h3></div>', unsafe_allow_html=True)
        
        with st.form("transaction_form"):
            date = st.date_input("Date", datetime.now())
            account = st.text_input("Account Name", placeholder="e.g., Cash, Inventory, Sales Revenue")
            col_a, col_b = st.columns(2)
            with col_a:
                debit = st.number_input("Debit", min_value=0.0, step=0.01)
            with col_b:
                credit = st.number_input("Credit", min_value=0.0, step=0.01)
            description = st.text_area("Description", placeholder="Transaction details")
            
            submitted = st.form_submit_button("✅ Add Transaction", use_container_width=True)
            
            if submitted:
                if account and (debit > 0 or credit > 0):
                    transaction = {
                        "date": date.strftime("%Y-%m-%d"),
                        "account": account,
                        "debit": debit,
                        "credit": credit,
                        "description": description
                    }
                    st.session_state.transactions.append(transaction)
                    st.success("✅ Transaction added successfully!")
                    st.rerun()
                else:
                    st.error("❌ Please fill in all required fields")
    
    with col2:
        st.markdown('<div class="card"><h3>Document Upload</h3></div>', unsafe_allow_html=True)
        
        uploaded_file = st.file_uploader(
            "Upload accounting document",
            type=['pdf', 'xlsx', 'csv', 'txt']
        )
        
        if uploaded_file:
            file_type = uploaded_file.type
            
            try:
                if 'csv' in file_type:
                    df = pd.read_csv(uploaded_file)
                    st.dataframe(df.head(), use_container_width=True)
                    
                    if st.button("📥 Import CSV Data", use_container_width=True):
                        for _, row in df.iterrows():
                            st.session_state.transactions.append(row.to_dict())
                        st.success(f"✅ Imported {len(df)} transactions!")
                        st.rerun()
                
                elif 'excel' in file_type or 'spreadsheet' in file_type:
                    df = pd.read_excel(uploaded_file)
                    st.dataframe(df.head(), use_container_width=True)
                    
                    if st.button("📥 Import Excel Data", use_container_width=True):
                        for _, row in df.iterrows():
                            st.session_state.transactions.append(row.to_dict())
                        st.success(f"✅ Imported {len(df)} transactions!")
                        st.rerun()
                
                else:
                    content = uploaded_file.read().decode('utf-8', errors='ignore')
                    st.text_area("Document Preview", content[:500], height=200, disabled=True)
                    
                    if st.button("🤖 Extract with AI", use_container_width=True):
                        with st.spinner("Analyzing document..."):
                            transactions = parse_document_with_ai(content, file_type)
                            if transactions:
                                st.session_state.transactions.extend(transactions)
                                st.success(f"✅ Extracted {len(transactions)} transactions!")
                                st.rerun()
            
            except Exception as e:
                st.error(f"❌ Error processing file: {str(e)}")
    
    # Display current transactions
    if st.session_state.transactions:
        st.markdown("---")
        st.markdown('<div class="card"><h3>Current Transactions</h3></div>', unsafe_allow_html=True)
        df_trans = pd.DataFrame(st.session_state.transactions)
        
        df_trans_display = df_trans.copy()
        df_trans_display.insert(0, 'ID', range(1, len(df_trans_display) + 1))
        
        st.dataframe(df_trans_display, use_container_width=True)
        
        col1, col2 = st.columns([2, 1])
        with col1:
            transaction_to_delete = st.number_input(
                "Enter Transaction ID to delete",
                min_value=1,
                max_value=len(st.session_state.transactions),
                step=1,
                key="delete_id"
            )
        with col2:
            st.write("")
            st.write("")
            if st.button("🗑️ Delete", use_container_width=True):
                if 1 <= transaction_to_delete <= len(st.session_state.transactions):
                    st.session_state.transactions.pop(transaction_to_delete - 1)
                    st.success("✅ Transaction deleted!")
                    st.rerun()
        
        csv = df_trans.to_csv(index=False)
        st.download_button(
            "📥 Download Transactions",
            csv,
            "transactions.csv",
            "text/csv",
            use_container_width=True
        )

# Tab 2: Dashboard
with tabs[1]:
    st.markdown('<div class="card"><h2>📊 Financial Dashboard</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        df = pd.DataFrame(st.session_state.transactions)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_debits = df['debit'].sum()
            st.metric("Total Debits", f"${total_debits:,.2f}")
        
        with col2:
            total_credits = df['credit'].sum()
            st.metric("Total Credits", f"${total_credits:,.2f}")
        
        with col3:
            difference = abs(total_debits - total_credits)
            st.metric("Difference", f"${difference:,.2f}")
        
        with col4:
            st.metric("Transactions", len(df))
        
        col1, col2 = st.columns(2)
        
        with col1:
            account_summary = df.groupby('account').agg({
                'debit': 'sum',
                'credit': 'sum'
            }).reset_index()
            account_summary['net'] = account_summary['debit'] - account_summary['credit']
            
            fig1 = px.bar(
                account_summary,
                x='account',
                y='net',
                title='Account Balances',
                color='net',
                color_continuous_scale='RdYlGn'
            )
            fig1.update_layout(template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
            st.plotly_chart(fig1, use_container_width=True)
        
        with col2:
            fig2 = go.Figure(data=[
                go.Bar(name='Debits', x=df['account'], y=df['debit'], marker_color='#3B82F6'),
                go.Bar(name='Credits', x=df['account'], y=df['credit'], marker_color='#10B981')
            ])
            fig2.update_layout(
                title='Debits vs Credits by Account',
                barmode='group',
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)"
            )
            st.plotly_chart(fig2, use_container_width=True)
        
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            daily_summary = df.groupby('date').agg({
                'debit': 'sum',
                'credit': 'sum'
            }).reset_index()
            
            fig3 = go.Figure()
            fig3.add_trace(go.Scatter(
                x=daily_summary['date'],
                y=daily_summary['debit'],
                name='Debits',
                mode='lines+markers',
                line=dict(color='#3B82F6', width=3)
            ))
            fig3.add_trace(go.Scatter(
                x=daily_summary['date'],
                y=daily_summary['credit'],
                name='Credits',
                mode='lines+markers',
                line=dict(color='#10B981', width=3)
            ))
            fig3.update_layout(
                title='Transaction Timeline',
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)"
            )
            st.plotly_chart(fig3, use_container_width=True)
    else:
        st.info("📊 No transactions available. Add data in the Data Entry tab.")

# Tab 3: Trial Balance
with tabs[2]:
    st.markdown('<div class="card"><h2>⚖️ Trial Balance</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        trial_balance = create_trial_balance(st.session_state.transactions)
        
        if not trial_balance.empty:
            st.dataframe(
                trial_balance.style.format({
                    'debit': '${:,.2f}',
                    'credit': '${:,.2f}',
                    'balance': '${:,.2f}'
                }),
                use_container_width=True
            )
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Debits", f"${trial_balance['debit'].sum():,.2f}")
            with col2:
                st.metric("Total Credits", f"${trial_balance['credit'].sum():,.2f}")
            with col3:
                difference = abs(trial_balance['debit'].sum() - trial_balance['credit'].sum())
                status = "✅ Balanced" if difference < 0.01 else "⚠️ Unbalanced"
                st.metric("Status", status)
            
            fig = px.pie(
                trial_balance,
                values='balance',
                names='account',
                title='Account Distribution'
            )
            fig.update_layout(template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
            st.plotly_chart(fig, use_container_width=True)
            
            csv = trial_balance.to_csv(index=False)
            st.download_button(
                "📥 Download Trial Balance",
                csv,
                "trial_balance.csv",
                "text/csv",
                use_container_width=True
            )
    else:
        st.info("⚖️ No transactions available.")

# Tab 4: Balance Sheet
with tabs[3]:
    st.markdown('<div class="card"><h2>💼 Balance Sheet</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        trial_balance = create_trial_balance(st.session_state.transactions)
        balance_sheet, balance_check = create_balance_sheet(trial_balance)
        
        if balance_sheet:
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown('<div class="card"><h3>Assets</h3></div>', unsafe_allow_html=True)
                if not balance_sheet['Assets'].empty:
                    st.dataframe(
                        balance_sheet['Assets'][['account', 'balance']].style.format({
                            'balance': '${:,.2f}'
                        }),
                        use_container_width=True
                    )
                st.metric("Total Assets", f"${balance_sheet['Total Assets']:,.2f}")
            
            with col2:
                st.markdown('<div class="card"><h3>Liabilities & Equity</h3></div>', unsafe_allow_html=True)
                
                if not balance_sheet['Liabilities'].empty:
                    st.write("**Liabilities:**")
                    st.dataframe(
                        balance_sheet['Liabilities'][['account', 'balance']].style.format({
                            'balance': '${:,.2f}'
                        }),
                        use_container_width=True
                    )
                
                if not balance_sheet['Equity'].empty:
                    st.write("**Equity:**")
                    st.dataframe(
                        balance_sheet['Equity'][['account', 'balance']].style.format({
                            'balance': '${:,.2f}'
                        }),
                        use_container_width=True
                    )
                
                st.metric("Total Liabilities", f"${balance_sheet['Total Liabilities']:,.2f}")
                st.metric("Total Equity", f"${balance_sheet['Total Equity']:,.2f}")
            
            st.markdown("---")
            if abs(balance_check) < 0.01:
                st.success("✅ Balance Sheet is perfectly balanced!")
            else:
                st.error(f"⚠️ Balance Sheet is off by ${balance_check:,.2f}")
            
            balance_sheet_csv = generate_balance_sheet_csv(balance_sheet)
            st.download_button(
                "📥 Download Balance Sheet",
                balance_sheet_csv,
                f"balance_sheet_{datetime.now().strftime('%Y%m%d')}.csv",
                "text/csv",
                use_container_width=True,
                type="primary"
            )
            
            fig = go.Figure(data=[
                go.Bar(
                    name='Assets',
                    x=['Total'],
                    y=[balance_sheet['Total Assets']],
                    marker_color='#3B82F6'
                ),
                go.Bar(
                    name='Liabilities',
                    x=['Total'],
                    y=[balance_sheet['Total Liabilities']],
                    marker_color='#EF4444'
                ),
                go.Bar(
                    name='Equity',
                    x=['Total'],
                    y=[balance_sheet['Total Equity']],
                    marker_color='#10B981'
                )
            ])
            fig.update_layout(
                title='Balance Sheet Overview',
                barmode='group',
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)"
            )
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("💼 No transactions available.")

# Tab 5: Income Statement (continuing in next response due to length)
with tabs[4]:
    st.markdown('<div class="card"><h2>📈 Income Statement</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        trial_balance = create_trial_balance(st.session_state.transactions)
        income_statement = create_income_statement(trial_balance)
        
        if income_statement:
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Total Revenue", f"${income_statement['Total Revenue']:,.2f}")
            
            with col2:
                st.metric("Total Expenses", f"${income_statement['Total Expenses']:,.2f}")
            
            with col3:
                net_income = income_statement['Net Income']
                st.metric("Net Income", f"${net_income:,.2f}")
            
            st.markdown("---")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown('<div class="card"><h3>💰 Revenue</h3></div>', unsafe_allow_html=True)
                if not income_statement['Revenues'].empty:
                    revenue_df = income_statement['Revenues'][['account', 'credit']].copy()
                    revenue_df.columns = ['Account', 'Amount']
                    st.dataframe(
                        revenue_df.style.format({
                            'Amount': '${:,.2f}'
                        }),
                        use_container_width=True
                    )
                st.metric("Total Revenue", f"${income_statement['Total Revenue']:,.2f}")
            
            with col2:
                st.markdown('<div class="card"><h3>💸 Expenses</h3></div>', unsafe_allow_html=True)
                if not income_statement['Expenses'].empty:
                    expense_df = income_statement['Expenses'][['account', 'debit']].copy()
                    expense_df.columns = ['Account', 'Amount']
                    st.dataframe(
                        expense_df.style.format({
                            'Amount': '${:,.2f}'
                        }),
                        use_container_width=True
                    )
                st.metric("Total Expenses", f"${income_statement['Total Expenses']:,.2f}")
            
            st.markdown("---")
            col1, col2, col3 = st.columns([1, 2, 1])
            with col2:
                st.markdown(f"""
                <div style='background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); 
                            padding: 2rem; border-radius: 12px; text-align: center; color: white; border: 1px solid #1E40AF;'>
                    <h3 style='margin: 0; font-size: 1.5rem;'>Net Income</h3>
                    <p style='margin: 0.5rem 0 0 0; font-size: 2.5rem; font-weight: 700;'>${income_statement['Net Income']:,.2f}</p>
                    <p style='margin: 0.5rem 0 0 0; font-size: 1rem; opacity: 0.9;'>Profit Margin: {income_statement['Gross Profit Margin']:.2f}%</p>
                </div>
                """, unsafe_allow_html=True)
            
            st.markdown("---")
            st.markdown('<div class="card"><h3>📊 Visualizations</h3></div>', unsafe_allow_html=True)
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig1 = go.Figure(data=[
                    go.Bar(name='Revenue', x=['Total'], y=[income_statement['Total Revenue']], marker_color='#10B981'),
                    go.Bar(name='Expenses', x=['Total'], y=[income_statement['Total Expenses']], marker_color='#EF4444'),
                    go.Bar(name='Net Income', x=['Total'], y=[income_statement['Net Income']], marker_color='#3B82F6')
                ])
                fig1.update_layout(
                    title='Revenue vs Expenses vs Net Income',
                    barmode='group',
                    template="plotly_dark",
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)"
                )
                st.plotly_chart(fig1, use_container_width=True)
            
            with col2:
                if not income_statement['Expenses'].empty:
                    fig2 = px.pie(
                        income_statement['Expenses'],
                        values='debit',
                        names='account',
                        title='Expense Distribution'
                    )
                    fig2.update_layout(template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
                    st.plotly_chart(fig2, use_container_width=True)
            
            income_statement_csv = generate_income_statement_csv(income_statement)
            st.download_button(
                "📥 Download Income Statement",
                income_statement_csv,
                f"income_statement_{datetime.now().strftime('%Y%m%d')}.csv",
                "text/csv",
                use_container_width=True,
                type="primary"
            )
        else:
            st.info("📈 No revenue or expense accounts found.")
    else:
        st.info("📈 No transactions available.")

# Tab 6: Financial Ratios
# Tab 6: Financial Ratios (Enhanced Version)
with tabs[5]:
    st.markdown('<div class="card"><h2>📉 Financial Ratios Dashboard</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        trial_balance = create_trial_balance(st.session_state.transactions)
        balance_sheet, _ = create_balance_sheet(trial_balance)
        income_statement = create_income_statement(trial_balance)
        
        if balance_sheet and income_statement:
            ratios = calculate_financial_ratios(balance_sheet, income_statement)
            
            if ratios:
                st.markdown("""
                <div style='background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); 
                            padding: 1.5rem; border-radius: 12px; color: white; text-align: center; margin-bottom: 2rem; border: 1px solid #1E40AF;'>
                    <h3 style='margin: 0;'>📊 Comprehensive Financial Ratios Analysis</h3>
                    <p style='margin: 0.5rem 0 0 0; opacity: 0.9;'>Select a category to view detailed metrics and insights</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Dropdown to select ratio category
                ratio_categories = list(ratios.keys())
                selected_category = st.selectbox(
                    "📊 Select Ratio Category",
                    ratio_categories,
                    index=0,
                    help="Choose a category to view detailed financial ratios"
                )
                
                # Display selected category
                st.markdown(f"### {selected_category}")
                
                # Get category data
                category_data = ratios[selected_category]
                
                # Category descriptions
                category_descriptions = {
                    'Liquidity Ratios': '*Measures the company\'s ability to pay short-term obligations and meet immediate cash needs*',
                    'Profitability Ratios': '*Measures the company\'s ability to generate profit relative to revenue, assets, and equity*',
                    'Efficiency Ratios': '*Measures how effectively the company uses its assets and manages operations*',
                    'Solvency Ratios': '*Measures the company\'s long-term financial stability and ability to meet debt obligations*'
                }
                
                st.markdown(category_descriptions.get(selected_category, ''))
                st.markdown("---")
                
                # Function to determine status badge
                def get_status_badge(ratio_name, value, category):
                    if category == 'Liquidity Ratios':
                        if ratio_name == 'Current Ratio':
                            if value >= 2: return 'success', '✅ Excellent'
                            elif value >= 1: return 'warning', '⚠️ Adequate'
                            else: return 'danger', '❌ Poor'
                        elif ratio_name == 'Quick Ratio':
                            if value >= 1: return 'success', '✅ Strong'
                            elif value >= 0.5: return 'warning', '⚠️ Watch'
                            else: return 'danger', '❌ Weak'
                        elif ratio_name == 'Cash Ratio':
                            if value >= 0.5: return 'success', '✅ Good'
                            elif value >= 0.2: return 'info', 'ℹ️ Monitor'
                            else: return 'warning', '⚠️ Low'
                    
                    elif category == 'Profitability Ratios':
                        if 'Margin' in ratio_name:
                            if value >= 20: return 'success', '✅ Excellent'
                            elif value >= 10: return 'success', '✅ Good'
                            elif value > 0: return 'warning', '⚠️ Low'
                            else: return 'danger', '❌ Loss'
                        elif 'ROA' in ratio_name or 'ROE' in ratio_name:
                            if value >= 15: return 'success', '✅ Excellent'
                            elif value >= 5: return 'success', '✅ Good'
                            elif value > 0: return 'warning', '⚠️ Low'
                            else: return 'danger', '❌ Negative'
                    
                    elif category == 'Efficiency Ratios':
                        if 'Turnover' in ratio_name and 'Asset' in ratio_name:
                            if value >= 2: return 'success', '✅ Excellent'
                            elif value >= 1: return 'success', '✅ Good'
                            else: return 'warning', '⚠️ Low'
                        elif 'Days' in ratio_name:
                            if value <= 45: return 'success', '✅ Fast'
                            elif value <= 90: return 'warning', '⚠️ Moderate'
                            else: return 'danger', '❌ Slow'
                        else:
                            if value >= 5: return 'success', '✅ Good'
                            elif value >= 2: return 'info', 'ℹ️ Fair'
                            else: return 'warning', '⚠️ Low'
                    
                    elif category == 'Solvency Ratios':
                        if 'Debt to Assets' in ratio_name:
                            if value <= 40: return 'success', '✅ Low Risk'
                            elif value <= 60: return 'warning', '⚠️ Moderate'
                            else: return 'danger', '❌ High Risk'
                        elif 'Debt to Equity' in ratio_name:
                            if value <= 1: return 'success', '✅ Conservative'
                            elif value <= 2: return 'warning', '⚠️ Moderate'
                            else: return 'danger', '❌ High'
                        elif 'Equity Ratio' in ratio_name:
                            if value >= 60: return 'success', '✅ Strong'
                            elif value >= 40: return 'success', '✅ Adequate'
                            else: return 'warning', '⚠️ Low'
                        elif 'Coverage' in ratio_name:
                            if value >= 3: return 'success', '✅ Strong'
                            elif value >= 1.5: return 'success', '✅ Adequate'
                            else: return 'danger', '❌ Weak'
                    
                    return 'info', 'ℹ️ Review'
                
                # Display ratios in a clean grid
                num_ratios = len(category_data)
                cols_per_row = 3
                
                ratio_items = list(category_data.items())
                for i in range(0, num_ratios, cols_per_row):
                    cols = st.columns(cols_per_row)
                    for j in range(cols_per_row):
                        idx = i + j
                        if idx < num_ratios:
                            ratio_name, ratio_info = ratio_items[idx]
                            with cols[j]:
                                value = ratio_info['value']
                                
                                # Format value based on ratio type
                                if 'Margin' in ratio_name or 'Return' in ratio_name or '%' in ratio_info['benchmark'] or 'Debt to Assets' in ratio_name or 'Equity Ratio' in ratio_name:
                                    formatted_value = f"{value:.2f}%"
                                elif 'Days' in ratio_name:
                                    formatted_value = f"{value:.0f} days"
                                else:
                                    formatted_value = f"{value:.2f}"
                                
                                st.metric(ratio_name, formatted_value)
                                
                                status_type, status_text = get_status_badge(ratio_name, value, selected_category)
                                st.markdown(f'<span class="badge-{status_type}">{status_text}</span>', unsafe_allow_html=True)
                                
                                with st.expander("ℹ️ Details"):
                                    st.write(f"**Description:** {ratio_info['description']}")
                                    st.write(f"**Benchmark:** {ratio_info['benchmark']}")
                
                st.markdown("---")
                
                # Visualization for selected category
                st.markdown(f"### 📊 {selected_category} Visualization")
                
                # Prepare data for visualization
                viz_data = []
                for ratio_name, ratio_info in category_data.items():
                    value = ratio_info['value']
                    # Convert percentages to actual percentage values for better visualization
                    if 'Margin' in ratio_name or 'Return' in ratio_name or 'Debt to Assets' in ratio_name or 'Equity Ratio' in ratio_name:
                        display_value = value
                    else:
                        display_value = value
                    viz_data.append({'Ratio': ratio_name, 'Value': display_value})
                
                viz_df = pd.DataFrame(viz_data)
                
                # Create appropriate visualization based on category
                if selected_category == 'Liquidity Ratios':
                    fig = go.Figure(data=[
                        go.Bar(
                            x=viz_df['Ratio'],
                            y=viz_df['Value'],
                            marker_color=['#3B82F6', '#10B981', '#F59E0B'],
                            text=viz_df['Value'].apply(lambda x: f'{x:.2f}'),
                            textposition='outside'
                        )
                    ])
                    fig.add_hline(y=1, line_dash="dash", line_color="#EF4444", 
                                 annotation_text="Baseline (1.0)", annotation_position="right")
                    fig.update_layout(
                        title=f'{selected_category} Overview',
                        yaxis_title='Ratio Value',
                        showlegend=False,
                        template="plotly_dark",
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        height=400
                    )
                
                elif selected_category == 'Profitability Ratios':
                    fig = go.Figure(data=[
                        go.Bar(
                            x=viz_df['Ratio'],
                            y=viz_df['Value'],
                            marker_color=['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'],
                            text=viz_df['Value'].apply(lambda x: f'{x:.1f}%' if x < 100 else f'{x:.0f}%'),
                            textposition='outside'
                        )
                    ])
                    fig.update_layout(
                        title=f'{selected_category} Overview',
                        yaxis_title='Percentage (%)',
                        showlegend=False,
                        template="plotly_dark",
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        height=400
                    )
                
                elif selected_category == 'Efficiency Ratios':
                    fig = go.Figure(data=[
                        go.Bar(
                            x=viz_df['Ratio'],
                            y=viz_df['Value'],
                            marker_color=['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                            text=viz_df['Value'].apply(lambda x: f'{x:.1f}'),
                            textposition='outside'
                        )
                    ])
                    fig.update_layout(
                        title=f'{selected_category} Overview',
                        yaxis_title='Value',
                        showlegend=False,
                        template="plotly_dark",
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        height=400
                    )
                
                elif selected_category == 'Solvency Ratios':
                    # For solvency, show a mixed chart
                    fig = go.Figure(data=[
                        go.Bar(
                            x=viz_df['Ratio'],
                            y=viz_df['Value'],
                            marker_color=['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
                            text=viz_df['Value'].apply(lambda x: f'{x:.2f}'),
                            textposition='outside'
                        )
                    ])
                    fig.update_layout(
                        title=f'{selected_category} Overview',
                        yaxis_title='Value',
                        showlegend=False,
                        template="plotly_dark",
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        height=400
                    )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Overall Financial Health Score
                st.markdown("---")
                st.markdown("### 🎯 Overall Financial Health Score")
                
                score = 0
                max_score = 100
                
                # Liquidity (25 points)
                current_ratio = ratios['Liquidity Ratios']['Current Ratio']['value']
                quick_ratio = ratios['Liquidity Ratios']['Quick Ratio']['value']
                if current_ratio >= 2: score += 12
                elif current_ratio >= 1: score += 8
                if quick_ratio >= 1: score += 13
                elif quick_ratio >= 0.5: score += 8
                
                # Profitability (30 points)
                npm = ratios['Profitability Ratios']['Net Profit Margin']['value']
                roa = ratios['Profitability Ratios']['Return on Assets (ROA)']['value']
                roe = ratios['Profitability Ratios']['Return on Equity (ROE)']['value']
                if npm >= 20: score += 10
                elif npm >= 10: score += 7
                elif npm > 0: score += 4
                if roa >= 5: score += 10
                elif roa >= 2: score += 6
                if roe >= 15: score += 10
                elif roe >= 10: score += 6
                
                # Efficiency (20 points)
                asset_turnover = ratios['Efficiency Ratios']['Asset Turnover']['value']
                dso = ratios['Efficiency Ratios']['Days Sales Outstanding']['value']
                if asset_turnover >= 2: score += 10
                elif asset_turnover >= 1: score += 6
                if dso <= 45: score += 10
                elif dso <= 90: score += 5
                
                # Solvency (25 points)
                debt_to_assets = ratios['Solvency Ratios']['Debt to Assets']['value']
                debt_to_equity = ratios['Solvency Ratios']['Debt to Equity']['value']
                equity_ratio = ratios['Solvency Ratios']['Equity Ratio']['value']
                if debt_to_assets <= 40: score += 10
                elif debt_to_assets <= 60: score += 6
                if debt_to_equity <= 1: score += 8
                elif debt_to_equity <= 2: score += 4
                if equity_ratio >= 60: score += 7
                elif equity_ratio >= 40: score += 4
                
                # Display gauge
                fig_gauge = go.Figure(go.Indicator(
                    mode="gauge+number+delta",
                    value=score,
                    domain={'x': [0, 1], 'y': [0, 1]},
                    title={'text': "Financial Health Score", 'font': {'size': 24}},
                    delta={'reference': 70, 'increasing': {'color': "#10B981"}},
                    gauge={
                        'axis': {'range': [None, 100], 'tickwidth': 1, 'tickcolor': "#CBD5E1"},
                        'bar': {'color': "#3B82F6"},
                        'bgcolor': "rgba(30, 41, 59, 0.5)",
                        'borderwidth': 2,
                        'bordercolor': "#334155",
                        'steps': [
                            {'range': [0, 40], 'color': "rgba(239, 68, 68, 0.2)"},
                            {'range': [40, 70], 'color': "rgba(245, 158, 11, 0.2)"},
                            {'range': [70, 100], 'color': "rgba(16, 185, 129, 0.2)"}
                        ],
                        'threshold': {
                            'line': {'color': "#10B981", 'width': 4},
                            'thickness': 0.75,
                            'value': 70
                        }
                    }
                ))
                fig_gauge.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    height=350,
                    font={'color': "#F1F5F9", 'family': "Arial"}
                )
                st.plotly_chart(fig_gauge, use_container_width=True)
                
                # Score interpretation
                col1, col2, col3 = st.columns([1, 2, 1])
                with col2:
                    if score >= 80:
                        st.success(f"🌟 Excellent financial health! (Score: {score}/100)")
                        st.markdown("Your business shows strong performance across all financial metrics.")
                    elif score >= 60:
                        st.info(f"👍 Good financial health (Score: {score}/100)")
                        st.markdown("Your business is performing well with room for improvement in some areas.")
                    elif score >= 40:
                        st.warning(f"⚠️ Fair financial health (Score: {score}/100)")
                        st.markdown("Consider improving liquidity, profitability, efficiency, or reducing debt levels.")
                    else:
                        st.error(f"🚨 Poor financial health (Score: {score}/100)")
                        st.markdown("Immediate attention needed to improve financial position across multiple areas.")
                
                # Download comprehensive report
                st.markdown("---")
                ratios_report = f"""COMPREHENSIVE FINANCIAL RATIOS REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

{'='*60}
LIQUIDITY RATIOS
{'='*60}
"""
                for ratio_name, ratio_info in ratios['Liquidity Ratios'].items():
                    ratios_report += f"\n{ratio_name}: {ratio_info['value']:.2f}\n"
                    ratios_report += f"  Description: {ratio_info['description']}\n"
                    ratios_report += f"  Benchmark: {ratio_info['benchmark']}\n"
                
                ratios_report += f"\n{'='*60}\nPROFITABILITY RATIOS\n{'='*60}\n"
                for ratio_name, ratio_info in ratios['Profitability Ratios'].items():
                    ratios_report += f"\n{ratio_name}: {ratio_info['value']:.2f}%\n"
                    ratios_report += f"  Description: {ratio_info['description']}\n"
                    ratios_report += f"  Benchmark: {ratio_info['benchmark']}\n"
                
                ratios_report += f"\n{'='*60}\nEFFICIENCY RATIOS\n{'='*60}\n"
                for ratio_name, ratio_info in ratios['Efficiency Ratios'].items():
                    if 'Days' in ratio_name:
                        ratios_report += f"\n{ratio_name}: {ratio_info['value']:.0f} days\n"
                    else:
                        ratios_report += f"\n{ratio_name}: {ratio_info['value']:.2f}\n"
                    ratios_report += f"  Description: {ratio_info['description']}\n"
                    ratios_report += f"  Benchmark: {ratio_info['benchmark']}\n"
                
                ratios_report += f"\n{'='*60}\nSOLVENCY RATIOS\n{'='*60}\n"
                for ratio_name, ratio_info in ratios['Solvency Ratios'].items():
                    if '%' in ratio_info['benchmark'] or 'Debt to Assets' in ratio_name or 'Equity Ratio' in ratio_name:
                        ratios_report += f"\n{ratio_name}: {ratio_info['value']:.2f}%\n"
                    else:
                        ratios_report += f"\n{ratio_name}: {ratio_info['value']:.2f}\n"
                    ratios_report += f"  Description: {ratio_info['description']}\n"
                    ratios_report += f"  Benchmark: {ratio_info['benchmark']}\n"
                
                ratios_report += f"\n{'='*60}\nOVERALL HEALTH SCORE: {score}/100\n{'='*60}\n"
                
                st.download_button(
                    "📥 Download Complete Ratios Report",
                    ratios_report,
                    f"financial_ratios_report_{datetime.now().strftime('%Y%m%d')}.txt",
                    "text/plain",
                    use_container_width=True,
                    type="primary"
                )
        else:
            st.info("Unable to calculate ratios. Please ensure you have complete balance sheet and income statement data.")
    else:
        st.info("📉 No transactions available. Add some data to see financial ratios.")
# Tab 7: AI Insights
with tabs[6]:
    st.markdown('<div class="card"><h2>🤖 AI-Generated Insights</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        trial_balance = create_trial_balance(st.session_state.transactions)
        balance_sheet, _ = create_balance_sheet(trial_balance)
        
        if balance_sheet and st.button("🔍 Generate AI Insights", use_container_width=True, type="primary"):
            with st.spinner("Analyzing financial statements..."):
                insights = get_ai_insights(trial_balance, balance_sheet)
                st.markdown(insights)
                
                st.session_state['financial_context'] = {
                    'trial_balance': trial_balance.to_dict(),
                    'balance_sheet': balance_sheet
                }
    else:
        st.info("🤖 No transactions available.")

# Tab 8: Chat
with tabs[7]:
    st.markdown('<div class="card"><h2>💬 Financial Assistant Chat</h2></div>', unsafe_allow_html=True)
    
    if st.session_state.transactions:
        df = pd.DataFrame(st.session_state.transactions)
        context = f"""
        Transactions Summary:
        - Total Debits: ${df['debit'].sum():,.2f}
        - Total Credits: ${df['credit'].sum():,.2f}
        - Number of transactions: {len(df)}
        - Accounts: {', '.join(df['account'].unique())}
        """
        
        for message in st.session_state.chat_history:
            with st.chat_message(message["role"]):
                st.write(message["content"])
        
        user_input = st.chat_input("Ask about your financial data...")
        
        if user_input:
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            
            with st.chat_message("user"):
                st.write(user_input)
            
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = chat_with_ai(user_input, context)
                    st.write(response)
                    st.session_state.chat_history.append({"role": "assistant", "content": response})
    else:
        st.info("💬 No transactions available. Add some data first!")

# Footer
st.markdown("---")
st.markdown(
    '<div class="footer">🚀 AI-Powered Accounting Dashboard | Advanced Financial Analytics</div>',
    unsafe_allow_html=True
)