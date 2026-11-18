"""Export the matched report rows of the Visualisation_3_final v3 workbook data.

Usage: python3 scripts/export_v3_reports.py /path/to/v3/Data/processed/preschool_factor_analysis.csv

Writes src/preschool_access/Data/Processed/preschool_factor_reports_v3.csv (UTF-8, comma separated).
The v3 export aligns the 12 Oct 2026 download to September 2026 (see LISTING_MONTHS in
prepare_deep_dive.py). The older UTF-16 preschool_factor_analysis.csv is left untouched.
"""
import argparse
import csv
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / 'src/preschool_access/Data/Processed/preschool_factor_reports_v3.csv'
FIELDS = ['centre_code', 'programme', 'start_month', 'snapshot_date', 'status']


def export(source):
    with source.open(encoding='utf-8-sig', newline='') as file, OUTPUT.open('w', encoding='utf-8', newline='') as out:
        writer = csv.DictWriter(out, FIELDS)
        writer.writeheader()
        n = 0
        for row in csv.DictReader(file):
            if row['row_type'] == 'Reports':
                writer.writerow({field: row[field] for field in FIELDS})
                n += 1
    print(f'{n:,} report rows written to {OUTPUT}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    export(parser.parse_args().csv)
