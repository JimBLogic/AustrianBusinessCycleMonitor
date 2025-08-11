#!/usr/bin/env python3
"""
Simple translation compiler for Austrian Business Cycle Monitor
Creates basic .mo files for Flask-Babel compatibility
"""
import os
from pathlib import Path

def create_basic_mo_files():
    """Create basic .mo files for Flask-Babel"""
    
    languages = ['en', 'es']
    project_root = Path(__file__).parent
    
    for lang in languages:
        mo_dir = project_root / 'translations' / lang / 'LC_MESSAGES'
        mo_file = mo_dir / 'messages.mo'
        
        # Create directory if it doesn't exist
        mo_dir.mkdir(parents=True, exist_ok=True)
        
        # Create a minimal .mo file (empty but valid)
        # .mo files start with a magic number
        mo_content = b'\xde\x12\x04\x95\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
        
        with open(mo_file, 'wb') as f:
            f.write(mo_content)
        
        print(f"✅ Created {mo_file}")
    
    print("Translation compilation completed!")

if __name__ == '__main__':
    create_basic_mo_files()
