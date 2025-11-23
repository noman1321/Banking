# AI Accounting Dashboard

A modern, mobile-responsive accounting dashboard built with FastAPI and vanilla JavaScript. This application provides comprehensive financial management features including transaction management, financial statements, ratio analysis, and AI-powered insights.

## Features

- 📝 **Transaction Management**: Manual entry and file upload (CSV, Excel, PDF)
- 📊 **Financial Dashboard**: Real-time metrics and visualizations
- ⚖️ **Trial Balance**: Automatic generation and validation
- 💼 **Balance Sheet**: Assets, Liabilities, and Equity tracking
- 📈 **Income Statement**: Revenue and expense analysis
- 📉 **Financial Ratios**: Comprehensive ratio analysis across 4 categories
- 🤖 **AI Insights**: AI-powered financial analysis
- 💬 **Chat Assistant**: Natural language queries about your financial data

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the application:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Project Structure

```
Finance-main/
├── main.py                 # FastAPI backend
├── utils.py                # Business logic (unchanged from original)
├── static/
│   ├── index.html         # Frontend HTML
│   ├── styles.css         # Stylesheet
│   └── app.js             # Frontend JavaScript
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## API Endpoints

All API endpoints are prefixed with `/api`:

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add a new transaction
- `DELETE /api/transactions/{id}` - Delete a transaction
- `DELETE /api/transactions` - Clear all transactions
- `POST /api/transactions/load-sample` - Load sample data
- `POST /api/transactions/upload-csv` - Upload CSV file
- `POST /api/transactions/upload-excel` - Upload Excel file
- `POST /api/transactions/parse-document` - Parse document with AI

### Financial Reports
- `GET /api/dashboard` - Get dashboard metrics
- `GET /api/trial-balance` - Get trial balance
- `GET /api/balance-sheet` - Get balance sheet
- `GET /api/income-statement` - Get income statement
- `GET /api/financial-ratios` - Get financial ratios
- `GET /api/financial-health-score` - Get health score

### AI Features
- `POST /api/ai-insights` - Generate AI insights
- `POST /api/chat` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### Exports
- `GET /api/export/transactions` - Export transactions as CSV
- `GET /api/export/balance-sheet` - Export balance sheet as CSV
- `GET /api/export/income-statement` - Export income statement as CSV

## Technologies Used

- **Backend**: FastAPI, Python
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: Plotly.js
- **Icons**: Font Awesome
- **AI**: OpenAI GPT-4

## Features Overview

### Responsive Design
- Mobile-first approach
- Adaptive layouts for tablets and desktops
- Touch-friendly interface

### Modern UI
- Dark theme with gradient accents
- Smooth animations and transitions
- Intuitive navigation

### Data Visualization
- Interactive charts and graphs
- Real-time updates
- Multiple chart types (bar, line, pie)

## Notes

- The original Streamlit app has been preserved as `app_streamlit.py` for reference
- All backend logic in `utils.py` remains unchanged
- The application uses in-memory storage for transactions (consider using a database for production)

## License

This project is provided as-is for educational and development purposes.

