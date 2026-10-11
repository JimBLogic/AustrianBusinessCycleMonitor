#!/usr/bin/env python3
"""
Configuration classes for Austrian Business Cycle Monitor
"""

import yaml
from pathlib import Path
from typing import Dict, Any, Optional


class IndicatorConfig:
    """Configuration for Austrian Business Cycle indicators"""
    
    def __init__(self):
        """Initialize with default values"""
        # NFCI Configuration
        self.nfci_weeks = 16
        self.nfci_threshold = 0.0
        
        # Credit Growth Configuration
        self.credit_quarters = 4
        self.credit_growth_threshold = 0.0
        
        # Yield Curve Configuration
        self.yield_weeks = 8
        self.yield_curve_inversion = 0.0
        
        # Credit Risk Configuration
        self.credit_risk_weeks = 12
        self.credit_risk_threshold = 4.0
        
        # Austrian Analysis Configuration
        self.austrian_confidence_threshold = 0.7
        self.malinvestment_detection_sensitivity = 0.5
        
        # Asset Monitoring
        self.bitcoin_monitoring = True
        self.gold_monitoring = True
        
        # Web Dashboard Configuration
        self.update_interval_seconds = 300  # 5 minutes
        self.real_time_enabled = True
        
    @classmethod
    def from_yaml(cls, yaml_path: str) -> 'IndicatorConfig':
        """Load configuration from YAML file"""
        config = cls()
        yaml_file = Path(yaml_path)
        
        if yaml_file.exists():
            try:
                with open(yaml_file, 'r', encoding='utf-8') as f:
                    yaml_data = yaml.safe_load(f)
                
                # Update configuration with YAML values
                if yaml_data:
                    for key, value in yaml_data.items():
                        if hasattr(config, key):
                            setattr(config, key, value)
                            
            except Exception as e:
                print(f"Warning: Could not load YAML config from {yaml_path}: {e}")
                print("Using default configuration values")
        
        return config
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            attr: getattr(self, attr) 
            for attr in dir(self) 
            if not attr.startswith('_') and not callable(getattr(self, attr))
        }
    
    def __repr__(self) -> str:
        """String representation of configuration"""
        config_items = [
            f"{key}={value}" 
            for key, value in self.to_dict().items()
        ]
        return f"IndicatorConfig({', '.join(config_items)})"


# Default configuration instance
default_config = IndicatorConfig()
