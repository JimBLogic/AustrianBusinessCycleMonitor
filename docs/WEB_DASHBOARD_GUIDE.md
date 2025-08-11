# 📊 Austrian Business Cycle Monitor - Real-Time Web Dashboard

## 🎯 Overview

The Austrian Business Cycle Monitor now features a comprehensive real-time web dashboard that provides live economic analysis with dynamic updates and PDF report generation capabilities.

## 🚀 Key Features

### 📈 Real-Time Monitoring
- **Live Data Updates**: Automatic refresh every 5 minutes via WebSocket
- **Connection Status**: Visual indicators showing connection health
- **Manual Refresh**: On-demand data updates with one click
- **Real-Time Alerts**: Browser notifications for status changes

### 🎛️ Interactive Dashboard
- **Risk Assessment Cards**: Color-coded risk levels with confidence scores
- **Asset Price Display**: Live Bitcoin ($113K+) and Gold ($3.4K+/oz) prices
- **Signal Status Grid**: Individual indicator status with detailed analysis
- **Austrian Interpretation**: Live Austrian economics analysis updates

### 📄 PDF Report Generation
- **One-Click Download**: Generate comprehensive Austrian analysis reports
- **Professional Formatting**: Clean, printable PDF with tables and charts
- **Educational Content**: Complete Austrian economics theory application
- **Historical Context**: Comparison with 1929, 2000, 2008 cycles
- **Investment Implications**: Austrian-aligned portfolio recommendations

### 🔧 Dashboard Controls
- **Start/Stop Monitoring**: Control real-time data collection
- **Refresh Data**: Manual analysis trigger
- **Download PDF**: Comprehensive report generation
- **WebSocket Status**: Real-time connection monitoring

## 🏁 Quick Start

### Option 1: Windows Batch File (Easiest)
```bash
# Double-click this file
start_dashboard.bat
```

### Option 2: Python Launcher
```bash
python run_dashboard.py
```

### Option 3: Direct Execution
```bash
# Activate virtual environment
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Run dashboard
python src/web_app.py
```

### Option 4: Custom Configuration
```bash
python src/web_app.py --host 0.0.0.0 --port 8080 --config custom.yaml
```

## 🌐 Accessing the Dashboard

1. **Start the dashboard** using any method above
2. **Open browser** to: http://127.0.0.1:5000
3. **Connect automatically** - dashboard will show connection status
4. **Start monitoring** by clicking "Start Real-Time"

## 📊 Dashboard Interface

### Header Section
- **Title**: Austrian Business Cycle Monitor
- **Connection Status**: Real-time connection indicator
- **Last Updated**: Timestamp of most recent data

### Control Panel
- **Start Real-Time**: Begin continuous monitoring (5-minute intervals)
- **Stop**: Pause real-time monitoring
- **Refresh**: Manual data update
- **Download PDF Report**: Generate comprehensive analysis PDF

### Risk Overview Cards
1. **Risk Level**: Current cycle risk (LOW/MODERATE/HIGH/CRITICAL)
2. **Active Signals**: Number of active warning signals (X/4)
3. **Confidence**: Statistical confidence in analysis
4. **Status**: Monitoring state (Active/Stopped/Offline)

### Asset Analysis Section
#### Bitcoin (Digital Sound Money)
- **Current Price**: Live price from CoinGecko API
- **Source**: Data provider confirmation
- **Signal**: Austrian monetary uncertainty indicator
- **Confidence**: Signal reliability percentage

#### Gold (Traditional Store of Value)
- **Current Price**: Live price from Yahoo Finance
- **Source**: Data provider confirmation  
- **Signal**: Fiat currency debasement indicator
- **Confidence**: Signal reliability percentage

### Austrian Economics Interpretation
Real-time analysis based on current signal configuration:
- ✅ **STABLE CONDITIONS**: No immediate warnings
- 🔍 **SINGLE SIGNAL**: Monitor closely
- ⚠️ **EMERGING RISKS**: Multiple signals active
- 🚨 **HIGH RISK**: Austrian cycle peak pattern

### Economic Indicators Detail
Individual analysis for each indicator:

#### NFCI (National Financial Conditions Index)
- **Status**: 🔴 ACTIVE / 🟢 INACTIVE
- **Current Value**: Real-time NFCI reading
- **Confidence**: Statistical confidence level
- **Trend**: Slope direction and magnitude
- **Analysis**: Detailed interpretation

#### Credit Growth (Private Non-Financial Sector)
- **Status**: Signal activation state
- **YoY Growth**: Year-over-year percentage change
- **Trend**: Growth rate direction
- **Analysis**: Austrian credit expansion assessment

#### Treasury Yields (2Y/10Y)
- **Status**: Signal states for both yields
- **Current Values**: Real-time yield levels
- **Spread**: 10-2 year spread calculation
- **Analysis**: Yield curve interpretation

## 📄 PDF Report Features

### Comprehensive Content
- **Executive Summary**: Risk assessment and key metrics
- **Asset Analysis**: Bitcoin and Gold with Austrian perspective
- **Signal Details**: Complete indicator analysis with confidence levels
- **Austrian Economics Analysis**: Full theoretical framework application
- **Historical Context**: Comparison with past cycles
- **Investment Implications**: Portfolio recommendations
- **Educational Content**: Austrian economics learning resources

### Professional Format
- **Clean Layout**: Professional typography and spacing
- **Data Tables**: Organized metrics and analysis
- **Color Coding**: Risk levels and signal status
- **Timestamped**: Generation date and analysis period
- **Disclaimer**: Appropriate risk warnings

### Download Process
1. Click **"Download PDF Report"** button
2. System generates comprehensive analysis
3. PDF downloads automatically with timestamp
4. Filename format: `austrian_cycle_report_YYYYMMDD_HHMMSS.pdf`

## ⚡ Real-Time Features

### WebSocket Connection
- **Automatic**: Connects on page load
- **Reconnection**: Automatic reconnection on disconnect
- **Status Indicators**: Visual connection health
- **Error Handling**: Graceful degradation

### Live Updates
- **Economic Data**: Fresh analysis every 5 minutes
- **Asset Prices**: Real-time Bitcoin and Gold prices
- **Risk Assessment**: Dynamic risk level calculation
- **Austrian Analysis**: Updated interpretation

### Browser Notifications
- **Connection Status**: Connect/disconnect alerts
- **Data Updates**: Successful refresh notifications
- **Error Alerts**: Issue notifications with details
- **Auto-dismiss**: Alerts disappear after 5 seconds

## 🛠️ Technical Architecture

### Backend (Flask/Python)
- **Flask Framework**: Web application server
- **SocketIO**: Real-time WebSocket communication
- **ReportLab**: PDF generation (Windows-compatible)
- **Threading**: Background monitoring tasks
- **Austrian Monitor**: Core economic analysis engine

### Frontend (HTML/JavaScript)
- **Bootstrap 5**: Modern responsive design
- **Font Awesome**: Professional icons
- **Chart.js**: Ready for future charting features
- **Socket.IO Client**: Real-time communication
- **Vanilla JavaScript**: No heavy frameworks

### Data Sources
- **FRED API**: Economic indicators (NFCI, Credit, Yields)
- **CoinGecko**: Bitcoin price data
- **Yahoo Finance**: Gold price data
- **BIS**: International banking statistics

## 🔧 Configuration

### Default Settings
- **Host**: 127.0.0.1 (localhost)
- **Port**: 5000
- **Update Interval**: 300 seconds (5 minutes)
- **Auto-start Monitoring**: Optional
- **Debug Mode**: Disabled by default

### Command Line Options
```bash
python src/web_app.py --help

Options:
  --host HOST           Host to bind to (default: 127.0.0.1)
  --port PORT           Port to bind to (default: 5000)
  --config CONFIG       Path to configuration file
  --debug               Enable debug mode
  --auto-start          Auto-start real-time monitoring
```

### Configuration File
Use standard `config/monitor_config.yaml` for analysis parameters:
```yaml
analysis_periods:
  nfci_weeks: 16
  credit_quarters: 4
  yield_weeks: 8

thresholds:
  nfci_threshold: 0.0
  credit_growth_threshold: 0.0
  yield_curve_inversion: 0.0
```

## 🚨 Troubleshooting

### Common Issues

#### Dashboard Won't Start
```bash
# Check virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.executable)"
```

#### No Data Loading
- Verify FRED API key in `.env` file
- Check internet connection for API access
- Review terminal logs for specific errors

#### PDF Generation Fails
- ReportLab dependency installed automatically
- Check available disk space
- Verify write permissions in project directory

#### WebSocket Connection Issues
- Check browser compatibility (modern browsers required)
- Verify port 5000 not blocked by firewall
- Try refreshing browser or clearing cache

### Performance Tips
- **Memory Usage**: Dashboard uses ~100MB RAM typically
- **CPU Usage**: Minimal during monitoring periods
- **Network**: Requires internet for API data fetching
- **Browser**: Chrome/Firefox/Edge recommended

## 🛡️ Security Considerations

### Development Server Warning
- Built-in Flask server is for development only
- For production use, deploy with proper WSGI server
- Current setup suitable for local/personal use

### API Key Security
- Store FRED API key in `.env` file (not tracked by git)
- Never commit API keys to version control
- Use environment variables in production

### Network Security
- Default binding to localhost only (127.0.0.1)
- Change to 0.0.0.0 only if remote access needed
- Consider firewall rules for production deployment

## 📚 Educational Value

### Austrian Economics Learning
- **Real-time Application**: See theory in practice
- **Historical Context**: Compare with past cycles
- **Investment Integration**: Practical portfolio insights
- **Source References**: Academic and practitioner perspectives

### Technical Skills
- **Economic Analysis**: Statistical trend analysis
- **Web Development**: Flask, WebSocket, JavaScript
- **Data Visualization**: Real-time dashboard design
- **PDF Generation**: Professional reporting

## 🔮 Future Enhancements

### Planned Features
- **Chart Integration**: Interactive historical charts
- **Email Alerts**: Automated risk notifications
- **Multiple Timeframes**: Customizable analysis periods
- **Export Options**: CSV, JSON data export
- **Mobile Optimization**: Responsive design improvements

### Advanced Features
- **Multi-user Support**: Session management
- **Custom Indicators**: User-defined metrics
- **Backtesting**: Historical signal validation
- **API Endpoints**: Programmatic access

## 📞 Support

### Getting Help
1. **Check Logs**: Review terminal output for errors
2. **Documentation**: Refer to this guide and README.md
3. **Configuration**: Verify config/monitor_config.yaml
4. **Dependencies**: Ensure all packages installed

### Common Solutions
- **Import Errors**: Activate virtual environment
- **API Errors**: Check FRED API key setup
- **Port Conflicts**: Use different port with --port option
- **Permission Issues**: Run from project root directory

---

## 🎉 Success! 

You now have a comprehensive real-time Austrian Business Cycle monitoring system with:

✅ **Live Web Dashboard** with real-time updates  
✅ **Professional PDF Reports** with comprehensive analysis  
✅ **Austrian Economics Integration** with educational content  
✅ **Asset Price Monitoring** (Bitcoin & Gold)  
✅ **Risk Assessment** with confidence scoring  
✅ **Historical Context** and investment implications  

**Access your dashboard at: http://127.0.0.1:5000**

*Monitor the Austrian business cycle in real-time with professional-grade analysis and reporting capabilities!*
