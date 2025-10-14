# Dev Tool Stocks

A beautiful and functional st## Setup

### API Key Configuration

This tool uses the Twelve Data API for real stock data. You have two options for API key configuration:

1. **Environment Variable**: Set `TWELVE_DATA_API_KEY` in your system environment
2. **.env File**: Add your API key to the tool's `.env` file:
   ```
   TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
   ```

### Getting an API Key

1. Visit [Twelve Data](https://twelvedata.com/pricing)
2. Sign up for a free account
3. Get your API key from the dashboard

**Free Tier**: 800 API calls per day, 8 API calls per minute.

**Note**: The market overview is limited to 3 stocks to respect API rate limits. This tool requires a valid Twelve Data API key to function. No mock data fallback is provided.l for the Dev Tools application.

## Features

- **Real-time Stock Quotes**: Get current stock prices, changes, and trading volume
- **Popular Stocks**: Quick access to major tech stocks (AAPL, GOOGL, MSFT, etc.)
- **Beautiful UI**: Modern gradient design with responsive layout
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
  "data": ["AAPL", "MSFT", "AMZN", "TSLA", "NVDA", "NFLX"]
}
```

## Setup

### API Key Configuration

This tool requires an Alpha Vantage API key for real stock data. You have two options for API key configuration:

1. **Environment Variable**: Set `ALPHA_VANTAGE_API_KEY` in your system environment
2. **.env File**: Add your API key to the tool's `.env` file:
   ```
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   ```

### Getting an API Key

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free API key
3. Add the key using one of the methods above

**Note**: This tool requires a valid Alpha Vantage API key to function. No mock data fallback is provided.

## Dependencies

This tool requires the following Python packages (in addition to the main application dependencies):

- `requests>=2.31.0` - For making HTTP requests to the Alpha Vantage API

See `requirements.txt` in this directory for the complete list of tool-specific dependencies.

## Architecture

- **Backend**: Python Flask API with Alpha Vantage integration
- **Frontend**: HTML/CSS/JavaScript with modern responsive design
- **Data**: Real-time stock quotes from Alpha Vantage API