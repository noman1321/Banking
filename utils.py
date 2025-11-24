import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from openai import OpenAI
import json
from datetime import datetime
import io
import os

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_document_with_ai(file_content, file_type):
    """Extract accounting data from documents using OpenAI"""
    try:
        prompt = f"""
        You are an expert accountant. Extract accounting transactions from this {file_type} document.
        Return the data in JSON format with the following structure:
        {{
            "transactions": [
                {{
                    "date": "YYYY-MM-DD",
                    "account": "Account Name",
                    "debit": amount or 0,
                    "credit": amount or 0,
                    "description": "Transaction description"
                }}
            ]
        }}
        
        Document content:
        {file_content[:4000]}
        
        Only return valid JSON, no additional text.
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get('transactions', [])
    except Exception as e:
        return []

def create_trial_balance(transactions):
    """Generate trial balance from transactions"""
    df = pd.DataFrame(transactions)
    if df.empty:
        return pd.DataFrame()
    
    trial_balance = df.groupby('account').agg({
        'debit': 'sum',
        'credit': 'sum'
    }).reset_index()
    
    trial_balance['balance'] = trial_balance['debit'] - trial_balance['credit']
    trial_balance['type'] = trial_balance['balance'].apply(lambda x: 'Debit' if x > 0 else 'Credit')
    trial_balance['balance'] = trial_balance['balance'].abs()
    
    return trial_balance

def create_balance_sheet(trial_balance):
    """Generate balance sheet from trial balance"""
    if trial_balance.empty:
        return None, None
    
    assets = ['Cash', 'Accounts Receivable', 'Inventory', 'Equipment', 'Building', 'Land', 'Prepaid Expenses']
    liabilities = ['Accounts Payable', 'Notes Payable', 'Loan', 'Mortgage', 'Salaries Payable']
    equity = ['Capital', 'Retained Earnings', 'Common Stock']
    
    asset_accounts = trial_balance[trial_balance['account'].isin(assets)]
    liability_accounts = trial_balance[trial_balance['account'].isin(liabilities)]
    equity_accounts = trial_balance[trial_balance['account'].isin(equity)]
    
    total_assets = asset_accounts['balance'].sum()
    total_liabilities = liability_accounts['balance'].sum()
    total_equity = equity_accounts['balance'].sum()
    
    balance_sheet = {
        'Assets': asset_accounts,
        'Liabilities': liability_accounts,
        'Equity': equity_accounts,
        'Total Assets': total_assets,
        'Total Liabilities': total_liabilities,
        'Total Equity': total_equity
    }
    
    return balance_sheet, total_assets - (total_liabilities + total_equity)

def create_income_statement(trial_balance):
    """Generate income statement from trial balance"""
    if trial_balance.empty:
        return None
    
    revenue_accounts = ['Sales Revenue', 'Service Revenue', 'Interest Income', 'Other Income', 'Retained Earnings']
    expense_accounts = ['Cost of Goods Sold', 'Salaries Expense', 'Rent Expense', 'Utilities Expense', 
                       'Depreciation Expense', 'Interest Expense', 'Insurance Expense', 'Advertising Expense',
                       'Supplies Expense', 'Repairs Expense', 'Other Expenses']
    
    revenues = trial_balance[trial_balance['account'].isin(revenue_accounts)]
    expenses = trial_balance[trial_balance['account'].isin(expense_accounts)]
    
    total_revenue = revenues['credit'].sum()
    total_expenses = expenses['debit'].sum()
    net_income = total_revenue - total_expenses
    
    income_statement = {
        'Revenues': revenues,
        'Expenses': expenses,
        'Total Revenue': total_revenue,
        'Total Expenses': total_expenses,
        'Net Income': net_income,
        'Gross Profit Margin': (net_income / total_revenue * 100) if total_revenue > 0 else 0
    }
    
    return income_statement

def calculate_financial_ratios(balance_sheet, income_statement):
    """Calculate comprehensive financial ratios across all categories"""
    if not balance_sheet or not income_statement:
        return None
    
    total_assets = balance_sheet['Total Assets']
    total_liabilities = balance_sheet['Total Liabilities']
    total_equity = balance_sheet['Total Equity']
    total_revenue = income_statement['Total Revenue']
    total_expenses = income_statement['Total Expenses']
    net_income = income_statement['Net Income']
    
    # Extract current assets components
    cash = balance_sheet['Assets'][balance_sheet['Assets']['account'] == 'Cash']['balance'].sum()
    accounts_receivable = balance_sheet['Assets'][balance_sheet['Assets']['account'] == 'Accounts Receivable']['balance'].sum()
    inventory = balance_sheet['Assets'][balance_sheet['Assets']['account'] == 'Inventory']['balance'].sum()
    current_assets = cash + accounts_receivable + inventory
    
    # Extract current liabilities
    accounts_payable = balance_sheet['Liabilities'][balance_sheet['Liabilities']['account'] == 'Accounts Payable']['balance'].sum()
    current_liabilities = accounts_payable if accounts_payable > 0 else total_liabilities * 0.5
    
    # Extract specific expense items
    cogs = income_statement['Expenses'][income_statement['Expenses']['account'] == 'Cost of Goods Sold']['debit'].sum()
    interest_expense = income_statement['Expenses'][income_statement['Expenses']['account'] == 'Interest Expense']['debit'].sum()
    
    # Calculate gross profit
    gross_profit = total_revenue - cogs
    
    ratios = {
        'Liquidity Ratios': {
            'Current Ratio': {
                'value': current_assets / current_liabilities if current_liabilities > 0 else 0,
                'description': 'Measures ability to pay short-term obligations',
                'benchmark': '≥ 2.0 (Excellent), ≥ 1.0 (Adequate)'
            },
            'Quick Ratio': {
                'value': (current_assets - inventory) / current_liabilities if current_liabilities > 0 else 0,
                'description': 'Measures ability to pay short-term obligations without inventory',
                'benchmark': '≥ 1.0 (Good)'
            },
            'Cash Ratio': {
                'value': cash / current_liabilities if current_liabilities > 0 else 0,
                'description': 'Measures ability to pay short-term obligations with cash only',
                'benchmark': '≥ 0.5 (Good)'
            }
        },
        'Profitability Ratios': {
            'Gross Profit Margin': {
                'value': (gross_profit / total_revenue * 100) if total_revenue > 0 else 0,
                'description': 'Percentage of revenue retained after cost of goods sold',
                'benchmark': '≥ 40% (Excellent), ≥ 20% (Good)'
            },
            'Net Profit Margin': {
                'value': (net_income / total_revenue * 100) if total_revenue > 0 else 0,
                'description': 'Percentage of revenue that becomes profit',
                'benchmark': '≥ 20% (Excellent), ≥ 10% (Good)'
            },
            'Return on Assets (ROA)': {
                'value': (net_income / total_assets * 100) if total_assets > 0 else 0,
                'description': 'How efficiently assets generate profit',
                'benchmark': '≥ 5% (Strong), ≥ 2% (Moderate)'
            },
            'Return on Equity (ROE)': {
                'value': (net_income / total_equity * 100) if total_equity > 0 else 0,
                'description': 'Return generated on shareholders\' investment',
                'benchmark': '≥ 15% (Excellent), ≥ 10% (Good)'
            },
            'Operating Profit Margin': {
                'value': ((total_revenue - total_expenses + interest_expense) / total_revenue * 100) if total_revenue > 0 else 0,
                'description': 'Profit from core operations before interest',
                'benchmark': '≥ 15% (Strong)'
            }
        },
        'Efficiency Ratios': {
            'Asset Turnover': {
                'value': total_revenue / total_assets if total_assets > 0 else 0,
                'description': 'How efficiently assets generate revenue',
                'benchmark': '≥ 2.0 (Excellent), ≥ 1.0 (Good)'
            },
            'Inventory Turnover': {
                'value': cogs / inventory if inventory > 0 else 0,
                'description': 'How many times inventory is sold and replaced',
                'benchmark': '≥ 6 (Good) - varies by industry'
            },
            'Receivables Turnover': {
                'value': total_revenue / accounts_receivable if accounts_receivable > 0 else 0,
                'description': 'How quickly receivables are collected',
                'benchmark': '≥ 10 (Excellent)'
            },
            'Days Sales Outstanding': {
                'value': (accounts_receivable / total_revenue * 365) if total_revenue > 0 else 0,
                'description': 'Average days to collect receivables',
                'benchmark': '≤ 45 days (Good)'
            },
            'Days Inventory Outstanding': {
                'value': (inventory / cogs * 365) if cogs > 0 else 0,
                'description': 'Average days inventory is held',
                'benchmark': '≤ 60 days (Good) - varies by industry'
            }
        },
        'Solvency Ratios': {
            'Debt to Assets': {
                'value': (total_liabilities / total_assets * 100) if total_assets > 0 else 0,
                'description': 'Percentage of assets financed by debt',
                'benchmark': '≤ 40% (Low Risk), ≤ 60% (Moderate)'
            },
            'Debt to Equity': {
                'value': (total_liabilities / total_equity) if total_equity > 0 else 0,
                'description': 'Ratio of debt to shareholder equity',
                'benchmark': '≤ 1.0 (Conservative), ≤ 2.0 (Moderate)'
            },
            'Equity Ratio': {
                'value': (total_equity / total_assets * 100) if total_assets > 0 else 0,
                'description': 'Percentage of assets financed by equity',
                'benchmark': '≥ 60% (Strong), ≥ 40% (Adequate)'
            },
            'Interest Coverage': {
                'value': ((net_income + interest_expense) / interest_expense) if interest_expense > 0 else 0,
                'description': 'Ability to pay interest on debt',
                'benchmark': '≥ 3.0 (Good), ≥ 1.5 (Adequate)'
            },
            'Debt Service Coverage': {
                'value': (net_income + interest_expense) / (interest_expense + (total_liabilities * 0.1)) if (interest_expense + (total_liabilities * 0.1)) > 0 else 0,
                'description': 'Ability to service all debt obligations',
                'benchmark': '≥ 1.25 (Good)'
            }
        }
    }
    
    return ratios
def generate_balance_sheet_csv(balance_sheet):
    """Generate CSV format for balance sheet download"""
    output = io.StringIO()
    
    output.write("BALANCE SHEET\n")
    output.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    
    output.write("ASSETS\n")
    output.write("Account,Balance\n")
    if not balance_sheet['Assets'].empty:
        for _, row in balance_sheet['Assets'].iterrows():
            output.write(f"{row['account']},${row['balance']:,.2f}\n")
    output.write(f"Total Assets,${balance_sheet['Total Assets']:,.2f}\n\n")
    
    output.write("LIABILITIES\n")
    output.write("Account,Balance\n")
    if not balance_sheet['Liabilities'].empty:
        for _, row in balance_sheet['Liabilities'].iterrows():
            output.write(f"{row['account']},${row['balance']:,.2f}\n")
    output.write(f"Total Liabilities,${balance_sheet['Total Liabilities']:,.2f}\n\n")
    
    output.write("EQUITY\n")
    output.write("Account,Balance\n")
    if not balance_sheet['Equity'].empty:
        for _, row in balance_sheet['Equity'].iterrows():
            output.write(f"{row['account']},${row['balance']:,.2f}\n")
    output.write(f"Total Equity,${balance_sheet['Total Equity']:,.2f}\n\n")
    
    output.write(f"Total Liabilities & Equity,${balance_sheet['Total Liabilities'] + balance_sheet['Total Equity']:,.2f}\n")
    
    return output.getvalue()

def generate_income_statement_csv(income_statement):
    """Generate CSV format for income statement download"""
    output = io.StringIO()
    
    output.write("INCOME STATEMENT\n")
    output.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    
    output.write("REVENUES\n")
    output.write("Account,Amount\n")
    if not income_statement['Revenues'].empty:
        for _, row in income_statement['Revenues'].iterrows():
            output.write(f"{row['account']},${row['credit']:,.2f}\n")
    output.write(f"Total Revenue,${income_statement['Total Revenue']:,.2f}\n\n")
    
    output.write("EXPENSES\n")
    output.write("Account,Amount\n")
    if not income_statement['Expenses'].empty:
        for _, row in income_statement['Expenses'].iterrows():
            output.write(f"{row['account']},${row['debit']:,.2f}\n")
    output.write(f"Total Expenses,${income_statement['Total Expenses']:,.2f}\n\n")
    
    output.write(f"NET INCOME,${income_statement['Net Income']:,.2f}\n")
    output.write(f"Gross Profit Margin,{income_statement['Gross Profit Margin']:.2f}%\n")
    
    return output.getvalue()

def get_ai_insights(trial_balance, balance_sheet):
    """Get AI insights on financial statements"""
    try:
        prompt = f"""
        As a financial analyst, provide insights on these financial statements:
        
        Trial Balance Summary:
        {trial_balance.to_string()}
        
        Balance Sheet:
        Total Assets: ${balance_sheet['Total Assets']:,.2f}
        Total Liabilities: ${balance_sheet['Total Liabilities']:,.2f}
        Total Equity: ${balance_sheet['Total Equity']:,.2f}
        
        Provide:
        1. Key observations (3-4 points)
        2. Financial health assessment
        3. Recommendations (2-3 points)
        
        Keep it concise and actionable.
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating insights: {str(e)}"

def chat_with_ai(user_query, context):
    """Natural language chat about financial data with structured responses"""
    try:
        prompt = f"""
You are an expert financial analyst assistant with access to complete financial data. You have all the transaction details, trial balance, balance sheet, income statement, and financial ratios.

IMPORTANT INSTRUCTIONS:
1. Use the financial data provided below to answer ALL questions about transactions, accounts, financial statements, and ratios
2. Provide specific numbers, amounts, and calculations from the data
3. Reference specific accounts, transactions, or financial metrics when answering
4. If asked about ratios, use the calculated ratios provided
5. If asked about specific transactions, use the detailed transaction list
6. Be accurate and cite specific numbers from the data
7. Never say you don't have the information - you have complete access to all financial data

RESPONSE FORMAT REQUIREMENTS:
- Structure your answer using bullet points (•) for key findings and information
- Use clear sections with headers if needed
- Always include a "Recommendations" section with actionable suggestions when relevant
- Always include a "Suggestions" section with additional insights or next steps when relevant
- Format numbers with proper currency symbols and commas (e.g., $1,234.56)
- Use clear, concise language

EXAMPLE FORMAT:
• Key Finding 1: [specific data with numbers]
• Key Finding 2: [specific data with numbers]
• Key Finding 3: [specific data with numbers]

Recommendations:
• Recommendation 1: [actionable advice]
• Recommendation 2: [actionable advice]

Suggestions:
• Suggestion 1: [additional insight or next step]
• Suggestion 2: [additional insight or next step]

FINANCIAL DATA:
{context}

USER QUESTION: {user_query}

Please provide a structured answer following the format above. Include specific numbers, amounts, account names, and metrics where relevant.
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert financial analyst assistant with complete access to all financial data including transactions, balance sheets, income statements, and financial ratios. Always provide structured answers with bullet points, recommendations, and suggestions based on the data provided."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3  # Lower temperature for more accurate, factual responses
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

def generate_relevant_graphs(user_query, transactions_df, trial_balance, balance_sheet, income_statement, ratios):
    """Generate relevant graphs based on the user's question"""
    graphs = []
    
    if transactions_df is None or transactions_df.empty:
        return graphs
    
    query_lower = user_query.lower()
    
    # Account-related questions
    if any(word in query_lower for word in ['account', 'accounts', 'balance', 'balances']):
        if not trial_balance.empty:
            account_data = trial_balance[['account', 'balance']].copy()
            account_data = account_data.sort_values('balance', ascending=False).head(10)
            
            graphs.append({
                'type': 'bar',
                'title': 'Account Balances',
                'data': {
                    'x': account_data['account'].tolist(),
                    'y': [float(b) for b in account_data['balance'].tolist()],
                    'colors': ['#10b981' if float(b) >= 0 else '#ef4444' for b in account_data['balance'].tolist()]
                }
            })
    
    # Transaction-related questions
    if any(word in query_lower for word in ['transaction', 'transactions', 'debit', 'credit', 'spending', 'income']):
        account_summary = transactions_df.groupby('account').agg({
            'debit': 'sum',
            'credit': 'sum'
        }).reset_index()
        account_summary = account_summary.head(10)
        
        graphs.append({
            'type': 'bar_grouped',
            'title': 'Debits vs Credits by Account',
            'data': {
                'x': account_summary['account'].tolist(),
                'y1': [float(d) for d in account_summary['debit'].tolist()],
                'y2': [float(c) for c in account_summary['credit'].tolist()],
                'label1': 'Debits',
                'label2': 'Credits'
            }
        })
    
    # Time-based questions
    if any(word in query_lower for word in ['time', 'date', 'timeline', 'trend', 'over time', 'monthly', 'daily']):
        if 'date' in transactions_df.columns:
            try:
                transactions_df['date'] = pd.to_datetime(transactions_df['date'])
                daily_summary = transactions_df.groupby(transactions_df['date'].dt.date).agg({
                    'debit': 'sum',
                    'credit': 'sum'
                }).reset_index()
                daily_summary = daily_summary.sort_values('date')
                
                graphs.append({
                    'type': 'line',
                    'title': 'Transaction Timeline',
                    'data': {
                        'x': [str(d) for d in daily_summary['date'].tolist()],
                        'y1': [float(d) for d in daily_summary['debit'].tolist()],
                        'y2': [float(c) for c in daily_summary['credit'].tolist()],
                        'label1': 'Debits',
                        'label2': 'Credits'
                    }
                })
            except:
                pass
    
    # Revenue/Expense questions
    if any(word in query_lower for word in ['revenue', 'expense', 'expenses', 'income statement', 'profit', 'loss']):
        if income_statement:
            if not income_statement['Expenses'].empty:
                expense_data = income_statement['Expenses'].head(10)
                graphs.append({
                    'type': 'pie',
                    'title': 'Expense Distribution',
                    'data': {
                        'labels': expense_data['account'].tolist(),
                        'values': [float(v) for v in expense_data['debit'].tolist()]
                    }
                })
            
            graphs.append({
                'type': 'bar_grouped',
                'title': 'Revenue vs Expenses',
                'data': {
                    'x': ['Total'],
                    'y1': [float(income_statement['Total Revenue'])],
                    'y2': [float(income_statement['Total Expenses'])],
                    'y3': [float(income_statement['Net Income'])],
                    'label1': 'Revenue',
                    'label2': 'Expenses',
                    'label3': 'Net Income'
                }
            })
    
    # Ratio questions
    if any(word in query_lower for word in ['ratio', 'ratios', 'liquidity', 'profitability', 'efficiency', 'solvency']):
        if ratios:
            for category, ratio_data in ratios.items():
                if ratio_data:
                    ratio_names = list(ratio_data.keys())[:10]
                    ratio_values = [ratio_data[name]['value'] for name in ratio_names]
                    
                    graphs.append({
                        'type': 'bar',
                        'title': f'{category} Overview',
                        'data': {
                            'x': ratio_names,
                            'y': [float(v) for v in ratio_values],
                            'colors': ['#3b82f6'] * len(ratio_names)
                        }
                    })
                    break  # Only show first category to avoid too many graphs
    
    # Balance sheet questions
    if any(word in query_lower for word in ['balance sheet', 'assets', 'liabilities', 'equity']):
        if balance_sheet:
            graphs.append({
                'type': 'bar_grouped',
                'title': 'Balance Sheet Overview',
                'data': {
                    'x': ['Assets', 'Liabilities', 'Equity'],
                    'y1': [float(balance_sheet['Total Assets']), 0, 0],
                    'y2': [0, float(balance_sheet['Total Liabilities']), 0],
                    'y3': [0, 0, float(balance_sheet['Total Equity'])],
                    'label1': 'Assets',
                    'label2': 'Liabilities',
                    'label3': 'Equity'
                }
            })
    
    return graphs

def get_sample_transactions():
    """Return sample transaction data"""
    return [
        {"date": "2024-01-15", "account": "Cash", "debit": 50000, "credit": 0, "description": "Initial capital"},
        {"date": "2024-01-15", "account": "Capital", "debit": 0, "credit": 50000, "description": "Owner investment"},
        {"date": "2024-01-20", "account": "Equipment", "debit": 15000, "credit": 0, "description": "Purchase equipment"},
        {"date": "2024-01-20", "account": "Cash", "debit": 0, "credit": 15000, "description": "Payment for equipment"},
        {"date": "2024-01-25", "account": "Inventory", "debit": 8000, "credit": 0, "description": "Purchase inventory"},
        {"date": "2024-01-25", "account": "Accounts Payable", "debit": 0, "credit": 8000, "description": "Inventory on credit"},
        {"date": "2024-02-01", "account": "Cash", "debit": 25000, "credit": 0, "description": "Sales revenue"},
        {"date": "2024-02-01", "account": "Sales Revenue", "debit": 0, "credit": 25000, "description": "Revenue earned"},
        {"date": "2024-02-05", "account": "Salaries Expense", "debit": 5000, "credit": 0, "description": "Employee salaries"},
        {"date": "2024-02-05", "account": "Cash", "debit": 0, "credit": 5000, "description": "Salary payment"},
        {"date": "2024-02-10", "account": "Rent Expense", "debit": 2000, "credit": 0, "description": "Office rent"},
        {"date": "2024-02-10", "account": "Cash", "debit": 0, "credit": 2000, "description": "Rent payment"},
        {"date": "2024-02-15", "account": "Accounts Receivable", "debit": 10000, "credit": 0, "description": "Sales on credit"},
        {"date": "2024-02-15", "account": "Sales Revenue", "debit": 0, "credit": 10000, "description": "Credit sales"},
    ]