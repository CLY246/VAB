"""Convert a OneMap postal CSV export into lookup files by first digit."""
import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / 'public/data/postal'


def build(source):
    groups = defaultdict(dict)
    with source.open(encoding='utf-8-sig', newline='') as file:
        for row in csv.DictReader(file):
            code = row['postal_code']
            if not re.fullmatch(r'[0-8][0-9]{5}', code):
                continue
            try:
                lat, lng = float(row['latitude']), float(row['longitude'])
            except (TypeError, ValueError):
                continue
            address = row['address'].strip()
            if not address or not (1.15 <= lat <= 1.50 and 103.55 <= lng <= 104.10):
                continue
            address = re.sub(rf'\s+SINGAPORE\s+{code}$', '', address, flags=re.I)
            entry = [address, round(lat, 6), round(lng, 6)]
            shard = groups[code[0]]
            if code in shard and shard[code] != entry:
                raise ValueError(f'Conflicting postal locations for {code}')
            shard[code] = entry

    OUTPUT.mkdir(parents=True, exist_ok=True)
    for prefix in '012345678':
        shard = groups[prefix]
        (OUTPUT / f'{prefix}.json').write_text(
            json.dumps(shard, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n',
            encoding='utf-8',
        )
    print(f'{sum(map(len, groups.values())):,} postal locations written to {OUTPUT}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    build(parser.parse_args().csv)
