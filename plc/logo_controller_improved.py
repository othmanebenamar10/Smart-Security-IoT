#!/usr/bin/env python3
"""
Siemens LOGO! V8 PLC Controller Interface
@author BENAMAR Othmane
@secure Includes connection timeout, error handling, and validation
"""
import argparse
import logging
import os
import sys
import time
from typing import Optional

import snap7
from snap7.util import set_bool
from snap7.types import Areas

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Configuration
LOGO_HOST = os.getenv('LOGO_HOST', '192.168.0.100')
LOGO_RACK = int(os.getenv('LOGO_RACK', '0'))
LOGO_SLOT = int(os.getenv('LOGO_SLOT', '1'))
CONNECTION_TIMEOUT = 5  # seconds
MAX_RETRIES = 3

# Global client
client = snap7.client.Client()


def validate_host(host: str) -> bool:
    """Validate host address format."""
    if not isinstance(host, str) or not host.strip():
        return False
    
    # Basic IP validation
    parts = host.split('.')
    if len(parts) != 4:
        return False
    
    try:
        for part in parts:
            num = int(part)
            if num < 0 or num > 255:
                return False
        return True
    except ValueError:
        return False


def connect_with_retry(max_retries: int = MAX_RETRIES) -> bool:
    """Connect to LOGO controller with retry logic and timeout."""
    if not validate_host(LOGO_HOST):
        logger.error(f"Invalid LOGO host address: {LOGO_HOST}")
        return False
    
    if client.get_connected():
        return True
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Connecting to LOGO at {LOGO_HOST} (attempt {attempt + 1}/{max_retries})")
            
            # Set connection timeout
            client.set_param(snap7.snap7_lib.JobTimeout, CONNECTION_TIMEOUT * 1000)
            
            client.connect(LOGO_HOST, LOGO_RACK, LOGO_SLOT)
            
            if client.get_connected():
                logger.info(f"Successfully connected to LOGO at {LOGO_HOST}")
                return True
        
        except Exception as e:
            logger.warning(f"Connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait before retry
                continue
    
    logger.error(f"Failed to connect to LOGO after {max_retries} attempts")
    return False


def disconnect():
    """Safely disconnect from LOGO controller."""
    try:
        if client.get_connected():
            client.disconnect()
            logger.info("Disconnected from LOGO")
    except Exception as e:
        logger.warning(f"Error during disconnect: {e}")


def set_light(state: bool) -> bool:
    """Set light state on/off."""
    try:
        if not connect_with_retry():
            logger.error("Cannot set light: not connected to LOGO")
            return False
        
        # Read current block state
        block = client.db_read(1, 0, 1)
        
        if not block or len(block) < 1:
            logger.error("Invalid block read from LOGO")
            return False
        
        # Set bit 0
        set_bool(block, 0, 0, state)
        
        # Write back to LOGO
        client.db_write(1, 0, block)
        
        logger.info(f"Light set to {'ON' if state else 'OFF'}")
        return True
    
    except Exception as e:
        logger.error(f"Error setting light state: {e}")
        return False


def read_light() -> Optional[bool]:
    """Read current light status."""
    try:
        if not connect_with_retry():
            logger.error("Cannot read light: not connected to LOGO")
            return None
        
        # Read current block state
        block = client.db_read(1, 0, 1)
        
        if not block or len(block) < 1:
            logger.error("Invalid block read from LOGO")
            return None
        
        state = bool(block[0] & 1)
        logger.info(f"Light status: {'ON' if state else 'OFF'}")
        return state
    
    except Exception as e:
        logger.error(f"Error reading light status: {e}")
        return None


def validate_timeout(timeout_seconds: int) -> bool:
    """Validate timeout parameter."""
    if not isinstance(timeout_seconds, int):
        logger.error("Timeout must be an integer")
        return False
    
    if timeout_seconds < 1 or timeout_seconds > 3600:
        logger.error(f"Timeout must be between 1 and 3600 seconds, got {timeout_seconds}")
        return False
    
    return True


def main():
    """Main entry point for PLC controller interface."""
    parser = argparse.ArgumentParser(
        description='Siemens LOGO! V8 controller interface'
    )
    parser.add_argument(
        '--activate',
        type=int,
        help='Activate entrance light for timeout seconds'
    )
    parser.add_argument(
        '--status',
        action='store_true',
        help='Read current light status'
    )
    args = parser.parse_args()
    
    try:
        if args.activate is not None:
            # Validate timeout
            if not validate_timeout(args.activate):
                sys.exit(1)
            
            duration = args.activate
            logger.info(f"Activating light for {duration} seconds")
            
            try:
                # Turn on
                if not set_light(True):
                    sys.exit(1)
                
                print('LIGHT_ON', flush=True)
                
                # Wait
                time.sleep(duration)
                
                # Turn off
                if not set_light(False):
                    sys.exit(1)
                
                print('LIGHT_OFF', flush=True)
                logger.info("Light activation sequence completed")
            
            except Exception as e:
                logger.error(f"Light activation error: {e}")
                print(f"ERROR: {e}", file=sys.stderr, flush=True)
                sys.exit(1)
        
        elif args.status:
            logger.info("Reading light status")
            
            try:
                state = read_light()
                
                if state is None:
                    print("ERROR: Failed to read status", file=sys.stderr, flush=True)
                    sys.exit(1)
                
                print('ON' if state else 'OFF', flush=True)
            
            except Exception as e:
                logger.error(f"Status read error: {e}")
                print(f"ERROR: {e}", file=sys.stderr, flush=True)
                sys.exit(1)
        
        else:
            parser.print_help()
    
    except Exception as e:
        logger.error(f"Critical error: {e}")
        sys.exit(1)
    
    finally:
        disconnect()


if __name__ == '__main__':
    main()
