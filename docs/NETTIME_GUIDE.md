# NetTime - Simple Network Time Protocol (SNTP) Client

NetTime is a free open source tool that implements the Simple Network Time Protocol (SNTP) as defined in RFC 4330. It provides accurate time synchronization for the Austrian Business Cycle Monitor and other applications requiring precise timestamps.

## 🌟 Features

- **RFC 4330 Compliant**: Full SNTP client implementation
- **Multiple Server Support**: Automatic fallback across multiple NTP servers
- **High Accuracy**: Microsecond precision for financial monitoring
- **Robust Error Handling**: Graceful degradation and retry logic
- **Quality Assessment**: Real-time accuracy estimation and server quality metrics
- **Austrian Monitor Integration**: Seamless integration with business cycle monitoring
- **Windows Compatible**: Optimized for Windows PowerShell environment

## 🚀 Quick Start

### Command Line Usage

```bash
# Synchronize time with NTP servers
nettime sync

# Check synchronization status
nettime status

# Get accurate current time
nettime time

# Run comprehensive test
nettime test
```

### Python API Usage

```python
from src.utils.nettime import NetTimeClient

# Create NetTime client
client = NetTimeClient()

# Synchronize time
success = client.sync_time()
print(f"Sync successful: {success}")

# Get accurate timestamp
accurate_time = client.get_accurate_time()
print(f"Accurate time: {accurate_time}")

# Get synchronization status
status = client.get_status()
print(f"Accuracy: ±{status['accuracy_estimate']:.3f} seconds")
```

## 🏛️ Austrian Business Cycle Monitor Integration

NetTime automatically integrates with the Austrian Business Cycle Monitor to provide accurate timestamps for all economic analysis:

### Automatic Integration

When enabled in the monitor configuration, NetTime:
- Synchronizes time before each analysis run
- Provides accurate timestamps for all indicator signals
- Includes time quality information in reports
- Ensures consistent timing across all monitoring components

### Configuration

Enable NetTime in `config/monitor_config.yaml`:

```yaml
nettime:
  use_nettime: true        # Enable NetTime for monitoring
  auto_sync: true          # Auto-sync before analysis
  sync_interval: 3600      # Sync every hour
```

### Benefits for Financial Monitoring

- **Accurate Timestamps**: Precise timing for economic data correlation
- **Global Synchronization**: Consistent timing across distributed systems
- **Quality Assurance**: Real-time accuracy assessment
- **Audit Trail**: Documented time synchronization quality

## 🌐 Default NTP Servers

NetTime uses a carefully selected list of reliable NTP servers:

**Primary Servers:**
- `pool.ntp.org` - Global NTP pool
- `time.nist.gov` - US National Institute of Standards
- `time.google.com` - Google's NTP service
- `time.cloudflare.com` - Cloudflare's NTP service

**Backup Servers:**
- `time.windows.com` - Microsoft time service
- `0.pool.ntp.org` through `3.pool.ntp.org` - NTP pool servers

**Specialized Servers:**
- `tick.usno.navy.mil` - US Naval Observatory
- `time-a.nist.gov` - NIST atomic clock reference

## ⚙️ Configuration

### NetTime Configuration File

Create or modify `config/nettime_config.yaml`:

```yaml
# NTP server configuration
ntp_servers:
  primary:
    - "pool.ntp.org"
    - "time.nist.gov"
    - "time.google.com"

# Network settings
network:
  timeout_seconds: 5.0
  port: 123
  max_retries: 3

# Synchronization settings
sync:
  samples_per_server: 3
  max_servers_to_query: 5
  auto_sync_interval: 3600
```

### Command Line Options

```bash
# Use specific NTP servers
python src/utils/nettime.py --servers pool.ntp.org time.nist.gov

# Adjust timeout and samples
python src/utils/nettime.py --timeout 10 --samples 5

# Verbose output for debugging
python src/utils/nettime.py --verbose --sync
```

## 📊 Technical Details

### SNTP Algorithm

NetTime implements the SNTP algorithm defined in RFC 4330:

1. **Packet Creation**: Constructs proper NTP request packets
2. **Timestamp Exchange**: Records precise send/receive times
3. **Offset Calculation**: Uses the standard NTP algorithm:
   - Offset = ((T2 - T1) + (T3 - T4)) / 2
   - Delay = (T4 - T1) - (T3 - T2)
4. **Quality Assessment**: Evaluates server stratum, delay, and consistency

### Accuracy Estimation

NetTime provides real-time accuracy estimates based on:
- Network round-trip delay
- Server stratum level (distance from atomic clock)
- Root dispersion (server's uncertainty estimate)
- Statistical analysis of multiple samples

### Error Handling

- **Network Timeouts**: Automatic retry with different servers
- **DNS Resolution**: Graceful handling of unreachable servers
- **Invalid Responses**: Packet validation and error detection
- **Clock Anomalies**: Detection of unreasonable time offsets

## 🧪 Testing

### Run Test Suite

```bash
# Complete test suite
python test_nettime.py

# Quick functionality test
python test_nettime.py --quick

# Verbose test output
python test_nettime.py --verbose
```

### Test Coverage

The test suite covers:
- Basic SNTP client functionality
- Time synchronization accuracy
- High-level NetTime client API
- Performance characteristics
- Austrian Business Cycle Monitor integration

## 📈 Performance

### Typical Performance Metrics

- **Sync Duration**: 1-3 seconds for full synchronization
- **Accuracy**: ±1-10 milliseconds under normal conditions
- **Timestamp Speed**: <1ms for subsequent timestamp requests
- **Memory Usage**: Minimal impact on monitoring system

### Optimization Features

- **Cached Results**: Reuses recent synchronization data
- **Intelligent Server Selection**: Prioritizes high-quality servers
- **Adaptive Timeout**: Adjusts timing based on network conditions
- **Background Sync**: Optional automatic synchronization

## 🔧 Troubleshooting

### Common Issues

**"NetTime: Not synchronized"**
- Check internet connectivity
- Verify NTP servers are accessible
- Try different NTP servers
- Check firewall settings (port 123 UDP)

**Poor Time Accuracy**
- Check network latency to NTP servers
- Use servers geographically closer
- Increase samples per server
- Ensure stable network connection

**Import Errors**
- Verify Python environment is activated
- Check that nettime.py is in utils directory
- Install any missing dependencies

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
python src/utils/nettime.py --verbose --sync
```

## 🛡️ Security Considerations

- **NTP Security**: Uses only well-known, trusted NTP servers
- **Network Safety**: No system clock modification by default
- **Input Validation**: Strict validation of all NTP responses
- **Error Boundaries**: Rejects unreasonable time offsets

## 📄 License

NetTime is part of the Austrian Business Cycle Monitor project and is released under the MIT License. This is free and open source software.

## 🤝 Contributing

NetTime is designed to be:
- **Reliable**: Robust error handling and fallback mechanisms
- **Accurate**: High-precision timing for financial applications
- **Maintainable**: Clear code structure and comprehensive documentation
- **Extensible**: Easy to modify and enhance

## 📚 References

- [RFC 4330 - Simple Network Time Protocol (SNTP) Version 4](https://tools.ietf.org/html/rfc4330)
- [NTP Pool Project](https://www.ntppool.org/)
- [NIST Time Services](https://www.nist.gov/pml/time-and-frequency-division/services/internet-time-service-its)
- [Austrian Business Cycle Theory](../docs/austrian_theory.md)

---

*NetTime provides the temporal precision needed for accurate Austrian Business Cycle analysis, ensuring that all economic indicators are properly synchronized for meaningful correlation and trend analysis.*
