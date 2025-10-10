# Dev Tool Stocks

A beautiful and functional stock market data tool for the Dev Tools application.

## Features

- **Real-time Stock Quotes**: Get current stock prices, changes, and trading volume
- **Popular Stocks**: Quick access to major tech stocks (AAPL, GOOGL, MSFT, etc.)
- **Beautiful UI**: Modern gradient design with responsive layout
- **Mock Data Fallback**: Works without API keys for development/demo purposes
- **Auto-refresh**: Updates stock data every 30 seconds
- **Global Header**: Uses the application's global header system (no tool-specific header needed)

## API Endpoints

### GET /api/dev-tool-stocks/quote
Get stock quote for a specific symbol.

**Parameters:**
- `symbol` (string): Stock symbol (e.g., AAPL, GOOGL, MSFT)
- `api_key` (string, optional): Alpha Vantage API key

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "price": 175.50,
    "change": 2.34,
    "change_percent": "+1.35%",
    "volume": 45238900,
    "previous_close": 173.16,
    "last_updated": "2025-10-10 14:30:00"
  }
}
```

### GET /api/dev-tool-stocks/popular
Get list of popular stock symbols.

**Response:**
```json
{
  "success": true,
  "data": ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "NFLX"]
}
```

## Setup

### API Key Configuration

This tool uses the Alpha Vantage API for real stock data. You have two options for API key configuration:

1. **Environment Variable**: Set `ALPHA_VANTAGE_API_KEY` in your system environment
2. **.env File**: Add your API key to the tool's `.env` file:
   ```
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   ```

### Getting an API Key

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free API key
3. Add the key using one of the methods above

### Mock Data

If no API key is provided, the tool will automatically use mock/demo data for development and testing purposes. This allows the tool to work immediately without requiring API key setup.

## Architecture

- **Backend**: Python Flask API with Alpha Vantage integration
- **Frontend**: HTML/CSS/JavaScript with modern responsive design
- **Data**: Real-time stock quotes with automatic fallback to mock data