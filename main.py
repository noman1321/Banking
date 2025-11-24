from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import io
import os
from dotenv import load_dotenv

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
    generate_relevant_graphs,
    get_sample_transactions
)

# Load environment variables
load_dotenv()

# Helper function to convert numpy types to native Python types
def convert_numpy_types(obj):
    """Recursively convert numpy types to native Python types for JSON serialization"""
    import math
    
    # Handle NaN values
    if isinstance(obj, (float, np.floating)):
        try:
            if math.isnan(obj):
                return None
        except (TypeError, ValueError):
            pass
        try:
            if pd.isna(obj):
                return None
        except (TypeError, ValueError):
            pass
        return float(obj)
    
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return [convert_numpy_types(item) for item in obj.tolist()]
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {str(key): convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, pd.DataFrame):
        # Replace NaN with None before converting
        df_clean = obj.where(pd.notnull(obj), None)
        return convert_numpy_types(df_clean.to_dict('records'))
    elif isinstance(obj, pd.Series):
        # Replace NaN with None before converting
        series_clean = obj.where(pd.notnull(obj), None)
        return convert_numpy_types(series_clean.to_dict())
    elif pd.isna(obj):
        return None
    return obj

app = FastAPI(title="AI Accounting Dashboard API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (in production, use a database)
transactions_store: List[Dict[str, Any]] = []
chat_history_store: List[Dict[str, str]] = []

# Pydantic models
class Transaction(BaseModel):
    date: str
    account: str
    debit: float
    credit: float
    description: Optional[str] = ""

class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

# Mount static files first (before routes)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# API Routes
@app.get("/")
async def read_root():
    """Serve the frontend HTML"""
    if os.path.exists("static/index.html"):
        return FileResponse('static/index.html')
    return {"message": "Please ensure static/index.html exists"}

@app.post("/api/transactions", response_model=Dict[str, Any])
async def add_transaction(transaction: Transaction):
    """Add a new transaction"""
    transaction_dict = transaction.dict()
    transactions_store.append(transaction_dict)
    return {"success": True, "message": "Transaction added successfully", "transaction": transaction_dict}

@app.get("/api/transactions", response_model=Dict[str, Any])
async def get_transactions():
    """Get all transactions"""
    return {"success": True, "transactions": transactions_store}

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int):
    """Delete a transaction by index"""
    if 0 <= transaction_id < len(transactions_store):
        deleted = transactions_store.pop(transaction_id)
        return {"success": True, "message": "Transaction deleted successfully", "transaction": deleted}
    raise HTTPException(status_code=404, detail="Transaction not found")

@app.delete("/api/transactions")
async def clear_all_transactions():
    """Clear all transactions"""
    transactions_store.clear()
    chat_history_store.clear()
    return {"success": True, "message": "All data cleared"}

@app.post("/api/transactions/load-sample")
async def load_sample_transactions():
    """Load sample transactions"""
    transactions_store.clear()
    transactions_store.extend(get_sample_transactions())
    return {"success": True, "message": f"Loaded {len(transactions_store)} sample transactions", "count": len(transactions_store)}

@app.post("/api/transactions/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and import CSV file"""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        imported = []
        for _, row in df.iterrows():
            transaction = row.to_dict()
            transactions_store.append(transaction)
            imported.append(transaction)
        
        return {"success": True, "message": f"Imported {len(imported)} transactions", "count": len(imported)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

@app.post("/api/transactions/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload and import Excel file"""
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        imported = []
        for _, row in df.iterrows():
            transaction = row.to_dict()
            transactions_store.append(transaction)
            imported.append(transaction)
        
        return {"success": True, "message": f"Imported {len(imported)} transactions", "count": len(imported)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing Excel: {str(e)}")

@app.post("/api/transactions/parse-document")
async def parse_document(file: UploadFile = File(...)):
    """Parse document with AI"""
    try:
        contents = await file.read()
        file_type = file.content_type or "text/plain"
        content = contents.decode('utf-8', errors='ignore')
        
        transactions = parse_document_with_ai(content, file_type)
        if transactions:
            transactions_store.extend(transactions)
            return {"success": True, "message": f"Extracted {len(transactions)} transactions", "count": len(transactions)}
        else:
            return {"success": False, "message": "No transactions found in document"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing document: {str(e)}")

@app.get("/api/dashboard", response_model=Dict[str, Any])
async def get_dashboard():
    """Get dashboard metrics"""
    if not transactions_store:
        return {"success": True, "metrics": None, "message": "No transactions available"}
    
    df = pd.DataFrame(transactions_store)
    total_debits = float(df['debit'].sum())
    total_credits = float(df['credit'].sum())
    difference = abs(total_debits - total_credits)
    
    account_summary = df.groupby('account').agg({
        'debit': 'sum',
        'credit': 'sum'
    }).reset_index()
    account_summary['net'] = account_summary['debit'] - account_summary['credit']
    
    return {
        "success": True,
        "metrics": {
            "total_debits": total_debits,
            "total_credits": total_credits,
            "difference": difference,
            "transaction_count": len(df),
            "account_summary": convert_numpy_types(account_summary.to_dict('records'))
        }
    }

@app.get("/api/trial-balance", response_model=Dict[str, Any])
async def get_trial_balance():
    """Get trial balance"""
    if not transactions_store:
        return {"success": False, "message": "No transactions available"}
    
    trial_balance = create_trial_balance(transactions_store)
    
    if trial_balance.empty:
        return {"success": False, "message": "Cannot generate trial balance"}
    
    total_debits = float(trial_balance['debit'].sum())
    total_credits = float(trial_balance['credit'].sum())
    difference = abs(total_debits - total_credits)
    is_balanced = difference < 0.01
    
    return {
        "success": True,
        "trial_balance": convert_numpy_types(trial_balance.to_dict('records')),
        "totals": {
            "total_debits": total_debits,
            "total_credits": total_credits,
            "difference": difference,
            "is_balanced": bool(is_balanced)  # Explicitly convert to Python bool
        }
    }

@app.get("/api/balance-sheet", response_model=Dict[str, Any])
async def get_balance_sheet():
    """Get balance sheet"""
    try:
        if not transactions_store:
            return {"success": False, "message": "No transactions available"}
        
        trial_balance = create_trial_balance(transactions_store)
        
        if trial_balance.empty:
            return {"success": False, "message": "Cannot generate balance sheet: trial balance is empty"}
        
        balance_sheet, balance_check = create_balance_sheet(trial_balance)
        
        if not balance_sheet:
            return {"success": False, "message": "Cannot generate balance sheet"}
        
        # Convert DataFrames to dictionaries with numpy type conversion
        assets_list = []
        if not balance_sheet['Assets'].empty:
            assets_dict = balance_sheet['Assets'].to_dict('records')
            assets_list = convert_numpy_types(assets_dict)
        
        liabilities_list = []
        if not balance_sheet['Liabilities'].empty:
            liabilities_dict = balance_sheet['Liabilities'].to_dict('records')
            liabilities_list = convert_numpy_types(liabilities_dict)
        
        equity_list = []
        if not balance_sheet['Equity'].empty:
            equity_dict = balance_sheet['Equity'].to_dict('records')
            equity_list = convert_numpy_types(equity_dict)
        
        return {
            "success": True,
            "balance_sheet": {
                "assets": assets_list,
                "liabilities": liabilities_list,
                "equity": equity_list,
                "total_assets": float(balance_sheet['Total Assets']),
                "total_liabilities": float(balance_sheet['Total Liabilities']),
                "total_equity": float(balance_sheet['Total Equity']),
                "balance_check": float(balance_check),
                "is_balanced": bool(abs(balance_check) < 0.01)
            }
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_balance_sheet: {error_details}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error generating balance sheet: {str(e)}"}
        )

@app.get("/api/income-statement", response_model=Dict[str, Any])
async def get_income_statement():
    """Get income statement"""
    if not transactions_store:
        return {"success": False, "message": "No transactions available"}
    
    trial_balance = create_trial_balance(transactions_store)
    income_statement = create_income_statement(trial_balance)
    
    if not income_statement:
        return {"success": False, "message": "Cannot generate income statement"}
    
    return {
        "success": True,
        "income_statement": {
            "revenues": convert_numpy_types(income_statement['Revenues'].to_dict('records')) if not income_statement['Revenues'].empty else [],
            "expenses": convert_numpy_types(income_statement['Expenses'].to_dict('records')) if not income_statement['Expenses'].empty else [],
            "total_revenue": float(income_statement['Total Revenue']),
            "total_expenses": float(income_statement['Total Expenses']),
            "net_income": float(income_statement['Net Income']),
            "gross_profit_margin": float(income_statement['Gross Profit Margin'])
        }
    }

@app.get("/api/financial-ratios", response_model=Dict[str, Any])
async def get_financial_ratios():
    """Get financial ratios"""
    if not transactions_store:
        return {"success": False, "message": "No transactions available"}
    
    trial_balance = create_trial_balance(transactions_store)
    balance_sheet, _ = create_balance_sheet(trial_balance)
    income_statement = create_income_statement(trial_balance)
    
    if not balance_sheet or not income_statement:
        return {"success": False, "message": "Cannot calculate ratios. Need balance sheet and income statement data."}
    
    ratios = calculate_financial_ratios(balance_sheet, income_statement)
    
    if not ratios:
        return {"success": False, "message": "Cannot calculate financial ratios"}
    
    return {
        "success": True,
        "ratios": convert_numpy_types(ratios)
    }

@app.get("/api/financial-health-score", response_model=Dict[str, Any])
async def get_financial_health_score():
    """Calculate overall financial health score"""
    if not transactions_store:
        return {"success": False, "message": "No transactions available"}
    
    trial_balance = create_trial_balance(transactions_store)
    balance_sheet, _ = create_balance_sheet(trial_balance)
    income_statement = create_income_statement(trial_balance)
    
    if not balance_sheet or not income_statement:
        return {"success": False, "message": "Cannot calculate health score"}
    
    ratios = calculate_financial_ratios(balance_sheet, income_statement)
    
    if not ratios:
        return {"success": False, "message": "Cannot calculate health score"}
    
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
    
    return {
        "success": True,
        "score": score,
        "max_score": max_score,
        "percentage": (score / max_score) * 100
    }

@app.post("/api/ai-insights", response_model=Dict[str, Any])
async def get_ai_insights_endpoint():
    """Get AI insights on financial statements"""
    if not transactions_store:
        return {"success": False, "message": "No transactions available"}
    
    trial_balance = create_trial_balance(transactions_store)
    balance_sheet, _ = create_balance_sheet(trial_balance)
    
    if not balance_sheet:
        return {"success": False, "message": "Cannot generate insights"}
    
    try:
        insights = get_ai_insights(trial_balance, balance_sheet)
        return {"success": True, "insights": insights}
    except Exception as e:
        return {"success": False, "message": f"Error generating insights: {str(e)}"}

@app.post("/api/chat", response_model=Dict[str, Any])
async def chat(chat_message: ChatMessage):
    """Chat with AI assistant"""
    if not transactions_store:
        return {"success": False, "message": "No transactions available"}
    
    try:
        # Get comprehensive financial data
        df = pd.DataFrame(transactions_store)
        
        # Trial Balance
        trial_balance = create_trial_balance(transactions_store)
        
        # Balance Sheet
        balance_sheet, balance_check = create_balance_sheet(trial_balance)
        
        # Income Statement
        income_statement = create_income_statement(trial_balance)
        
        # Financial Ratios
        ratios = None
        if balance_sheet and income_statement:
            ratios = calculate_financial_ratios(balance_sheet, income_statement)
        
        # Build comprehensive context
        context_parts = []
        
        # 1. Transactions Summary
        context_parts.append("=== TRANSACTIONS SUMMARY ===\n")
        context_parts.append(f"Total Transactions: {len(df)}\n")
        context_parts.append(f"Total Debits: ${df['debit'].sum():,.2f}\n")
        context_parts.append(f"Total Credits: ${df['credit'].sum():,.2f}\n")
        context_parts.append(f"All Accounts: {', '.join(sorted(df['account'].unique()))}\n\n")
        
        # 2. Detailed Transactions
        context_parts.append("=== DETAILED TRANSACTIONS ===\n")
        for idx, row in df.iterrows():
            context_parts.append(
                f"Transaction {idx + 1}: Date={row['date']}, Account={row['account']}, "
                f"Debit=${float(row['debit']):,.2f}, Credit=${float(row['credit']):,.2f}, "
                f"Description={row.get('description', 'N/A')}\n"
            )
        context_parts.append("\n")
        
        # 3. Trial Balance
        if not trial_balance.empty:
            context_parts.append("=== TRIAL BALANCE ===\n")
            for _, row in trial_balance.iterrows():
                context_parts.append(
                    f"Account: {row['account']}, Debit: ${float(row['debit']):,.2f}, "
                    f"Credit: ${float(row['credit']):,.2f}, Balance: ${float(row['balance']):,.2f}\n"
                )
            context_parts.append(f"Total Debits: ${trial_balance['debit'].sum():,.2f}\n")
            context_parts.append(f"Total Credits: ${trial_balance['credit'].sum():,.2f}\n\n")
        
        # 4. Balance Sheet
        if balance_sheet:
            context_parts.append("=== BALANCE SHEET ===\n")
            
            # Assets
            if not balance_sheet['Assets'].empty:
                context_parts.append("ASSETS:\n")
                for _, row in balance_sheet['Assets'].iterrows():
                    context_parts.append(f"  {row['account']}: ${float(row['balance']):,.2f}\n")
                context_parts.append(f"Total Assets: ${balance_sheet['Total Assets']:,.2f}\n")
            
            # Liabilities
            if not balance_sheet['Liabilities'].empty:
                context_parts.append("\nLIABILITIES:\n")
                for _, row in balance_sheet['Liabilities'].iterrows():
                    context_parts.append(f"  {row['account']}: ${float(row['balance']):,.2f}\n")
                context_parts.append(f"Total Liabilities: ${balance_sheet['Total Liabilities']:,.2f}\n")
            
            # Equity
            if not balance_sheet['Equity'].empty:
                context_parts.append("\nEQUITY:\n")
                for _, row in balance_sheet['Equity'].iterrows():
                    context_parts.append(f"  {row['account']}: ${float(row['balance']):,.2f}\n")
                context_parts.append(f"Total Equity: ${balance_sheet['Total Equity']:,.2f}\n")
            
            context_parts.append(f"\nBalance Check: ${balance_check:,.2f}\n\n")
        
        # 5. Income Statement
        if income_statement:
            context_parts.append("=== INCOME STATEMENT ===\n")
            
            # Revenues
            if not income_statement['Revenues'].empty:
                context_parts.append("REVENUES:\n")
                for _, row in income_statement['Revenues'].iterrows():
                    context_parts.append(f"  {row['account']}: ${float(row['credit']):,.2f}\n")
                context_parts.append(f"Total Revenue: ${income_statement['Total Revenue']:,.2f}\n")
            
            # Expenses
            if not income_statement['Expenses'].empty:
                context_parts.append("\nEXPENSES:\n")
                for _, row in income_statement['Expenses'].iterrows():
                    context_parts.append(f"  {row['account']}: ${float(row['debit']):,.2f}\n")
                context_parts.append(f"Total Expenses: ${income_statement['Total Expenses']:,.2f}\n")
            
            context_parts.append(f"\nNet Income: ${income_statement['Net Income']:,.2f}\n")
            context_parts.append(f"Gross Profit Margin: {income_statement['Gross Profit Margin']:.2f}%\n\n")
        
        # 6. Financial Ratios
        if ratios:
            context_parts.append("=== FINANCIAL RATIOS ===\n")
            
            # Liquidity Ratios
            if 'Liquidity Ratios' in ratios:
                context_parts.append("LIQUIDITY RATIOS:\n")
                for name, info in ratios['Liquidity Ratios'].items():
                    context_parts.append(f"  {name}: {info['value']:.2f} ({info['description']})\n")
            
            # Profitability Ratios
            if 'Profitability Ratios' in ratios:
                context_parts.append("\nPROFITABILITY RATIOS:\n")
                for name, info in ratios['Profitability Ratios'].items():
                    context_parts.append(f"  {name}: {info['value']:.2f}% ({info['description']})\n")
            
            # Efficiency Ratios
            if 'Efficiency Ratios' in ratios:
                context_parts.append("\nEFFICIENCY RATIOS:\n")
                for name, info in ratios['Efficiency Ratios'].items():
                    if 'Days' in name:
                        context_parts.append(f"  {name}: {info['value']:.0f} days ({info['description']})\n")
                    else:
                        context_parts.append(f"  {name}: {info['value']:.2f} ({info['description']})\n")
            
            # Solvency Ratios
            if 'Solvency Ratios' in ratios:
                context_parts.append("\nSOLVENCY RATIOS:\n")
                for name, info in ratios['Solvency Ratios'].items():
                    if '%' in info.get('benchmark', '') or 'Debt to Assets' in name or 'Equity Ratio' in name:
                        context_parts.append(f"  {name}: {info['value']:.2f}% ({info['description']})\n")
                    else:
                        context_parts.append(f"  {name}: {info['value']:.2f} ({info['description']})\n")
        
        context = "\n".join(context_parts)
        
        # Call chat with comprehensive context
        response = chat_with_ai(chat_message.message, context)
        
        # Generate relevant graphs based on the question
        graphs = generate_relevant_graphs(
            chat_message.message, 
            df, 
            trial_balance, 
            balance_sheet, 
            income_statement, 
            ratios
        )
        
        chat_history_store.append({"role": "user", "content": chat_message.message})
        chat_history_store.append({"role": "assistant", "content": response})
        return {"success": True, "response": response, "graphs": graphs}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in chat endpoint: {error_details}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.get("/api/chat/history", response_model=Dict[str, Any])
async def get_chat_history():
    """Get chat history"""
    return {"success": True, "history": chat_history_store}

@app.delete("/api/chat/history")
async def clear_chat_history():
    """Clear chat history"""
    chat_history_store.clear()
    return {"success": True, "message": "Chat history cleared"}

@app.get("/api/export/transactions")
async def export_transactions():
    """Export transactions as CSV"""
    if not transactions_store:
        raise HTTPException(status_code=404, detail="No transactions to export")
    
    df = pd.DataFrame(transactions_store)
    csv = df.to_csv(index=False)
    return JSONResponse(content={"csv": csv})

@app.get("/api/export/balance-sheet")
async def export_balance_sheet():
    """Export balance sheet as CSV"""
    if not transactions_store:
        raise HTTPException(status_code=404, detail="No transactions available")
    
    trial_balance = create_trial_balance(transactions_store)
    balance_sheet, _ = create_balance_sheet(trial_balance)
    
    if not balance_sheet:
        raise HTTPException(status_code=404, detail="Cannot generate balance sheet")
    
    csv = generate_balance_sheet_csv(balance_sheet)
    return JSONResponse(content={"csv": csv})

@app.get("/api/export/income-statement")
async def export_income_statement():
    """Export income statement as CSV"""
    if not transactions_store:
        raise HTTPException(status_code=404, detail="No transactions available")
    
    trial_balance = create_trial_balance(transactions_store)
    income_statement = create_income_statement(trial_balance)
    
    if not income_statement:
        raise HTTPException(status_code=404, detail="Cannot generate income statement")
    
    csv = generate_income_statement_csv(income_statement)
    return JSONResponse(content={"csv": csv})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

