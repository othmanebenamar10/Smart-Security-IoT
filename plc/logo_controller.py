import argparse
import os
import sys
import time

import snap7
from snap7.util import set_bool
from snap7.types import Areas

LOGO_HOST = os.getenv('LOGO_HOST', '192.168.0.100')
LOGO_RACK = int(os.getenv('LOGO_RACK', '0'))
LOGO_SLOT = int(os.getenv('LOGO_SLOT', '1'))

client = snap7.client.Client()


def connect():
    if not client.get_connected():
        client.connect(LOGO_HOST, LOGO_RACK, LOGO_SLOT)


def set_light(state: bool):
    connect()
    block = client.db_read(1, 0, 1)
    set_bool(block, 0, 0, state)
    client.db_write(1, 0, block)


def read_light() -> bool:
    connect()
    block = client.db_read(1, 0, 1)
    return bool(block[0] & 1)


def main():
    parser = argparse.ArgumentParser(description='Siemens LOGO! V8 controller interface')
    parser.add_argument('--activate', type=int, help='Activate entrance light for timeout seconds')
    parser.add_argument('--status', action='store_true', help='Read current light status')
    args = parser.parse_args()

    if args.activate is not None:
        duration = args.activate
        try:
            set_light(True)
            print('LIGHT_ON')
            time.sleep(duration)
            set_light(False)
            print('LIGHT_OFF')
        except Exception as error:
            print(f'ERROR: {error}', file=sys.stderr)
            sys.exit(1)
    elif args.status:
        try:
            state = read_light()
            print('ON' if state else 'OFF')
        except Exception as error:
            print(f'ERROR: {error}', file=sys.stderr)
            sys.exit(1)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
