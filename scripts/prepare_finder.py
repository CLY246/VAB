"""Build the browser dataset for the Preschool Finder from the dated project exports."""
import json
import re
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit

from prepare_deep_dive import DATA, LEVELS, PERIODS, PROGRAMMES, ROOT, code, month, rows

SCHEMES = {'Anchor Operator Scheme': 'Anchor Operator', 'Partner Operator Scheme': 'Partner Operator'}
STATUSES = {'Available': 'A', 'Limited': 'L', 'Full': 'F'}
FEE_BASIS = 'Singapore Citizen full-day listed monthly fee before subsidy and GST'
# Documented in the published Tableau affordability dashboard.
FEE_SOURCE_MONTHS = {'2026-11-14': '2026-10'}
PROVISIONAL_MONTHS = {'2026-11-14': ['2027-05']}


def clean(value):
    value = (value or '').strip()
    return '' if value.lower() in {'na', 'n/a', 'nil', '-'} else value


def one(values):
    return next(iter(values)) if len(values) == 1 else None


def website(value):
    if not value or any(c.isspace() for c in value):
        return ''
    url = value if '://' in value else f'https://{value}'
    parts = urlsplit(url)
    if (parts.scheme in {'https', 'http'} and parts.hostname and '.' in parts.hostname
            and 'life.gov.sg' not in parts.hostname and 'lifesg' not in parts.hostname
            and not parts.username):
        return url
    return ''


def fee_cents(value):
    try:
        amount = Decimal(value)
    except InvalidOperation:
        return None
    return int(round(amount * 100)) if amount.is_finite() and amount > 0 else None


def coords(row):
    try:
        lat, lng = float(row['latitude']), float(row['longitude'])
    except (ValueError, TypeError):
        return None
    if 1.15 <= lat <= 1.50 and 103.55 <= lng <= 104.10:
        return round(lat, 7), round(lng, 7)
    return None


def build():
    joined = list(rows(DATA / 'Processed/affordability_availability.csv'))
    latest = max(date.fromisoformat(r['snapshot_date']) for r in joined).isoformat()
    raw_path = DATA / f'Raw/ListingofCentres {latest[8:]}-{latest[5:7]}.csv'
    raw = defaultdict(list)
    audit = Counter()
    for row in rows(raw_path):
        centre = code(row['centre_code'])
        if centre:
            raw[centre].append(row)
        else:
            audit['uncodedListingRows'] += 1
    audit['duplicateListingRows'] = sum(len(group) - 1 for group in raw.values())

    reports = defaultdict(list)
    location = defaultdict(set)
    fees = defaultdict(set)
    for row in joined:
        if row['snapshot_date'] != latest or row['programme'] not in PROGRAMMES:
            continue
        centre = code(row['centre_code'])
        if not centre:
            audit['uncodedJoinedRows'] += 1
            continue
        programme = row['programme']
        offset = PERIODS.index(row['enrolment_period'].removesuffix(' Month'))
        reports[centre, programme, offset].append(row['vacancy_status'])
        point = coords(row)
        if point:
            location[centre].add(point)
        if (row['citizenship'], row['type_of_service'], row['levels_offered']) == ('SC', 'Full Day', LEVELS[programme]):
            amount = fee_cents(row['fee_amount'])
            if amount:
                fees[centre, programme].add(amount)

    audit['duplicateJoinedRows'] = sum(len(group) - 1 for group in reports.values())
    audit['conflictingFees'] = sum(len(group) > 1 for group in fees.values())
    assert set(raw) == {key[0] for key in reports}, 'Latest listing centre codes differ from joined export'
    centres = {}
    programmes = {label: set() for label in PROGRAMMES.values()}
    for centre, records in sorted(raw.items()):
        def field(name):
            return one({clean(row[name]) for row in records} - {''}) or ''

        point = one(location[centre])
        audit['missingCoordinates'] += point is None
        audit['conflictingCoordinates'] += len(location[centre]) > 1
        postal = field('postal_code')
        centre_data = {
            'name': field('centre_name') or centre,
            'address': field('centre_address'),
            'postal': postal if re.fullmatch(r'\d{6}', postal) else '',
            'point': point,
            'scheme': SCHEMES.get(field('scheme_type'), 'Scheme unlisted'),
            'phone': field('centre_contact_no'),
            'email': field('centre_email_address'),
            'website': website(field('centre_website')),
            'programmes': {},
        }
        for key, label in PROGRAMMES.items():
            status_path = []
            for i, period in enumerate(PERIODS):
                raw_statuses = {row[f'{key.lower()}_vacancy_{period.lower()}_month'] for row in records}
                matched = set(reports[centre, key, i])
                status = one(raw_statuses | matched) if matched else None
                audit['conflictingStatuses'] += len(raw_statuses | matched) > 1
                status_path.append(STATUSES.get(status, '-'))
                if status in STATUSES:
                    programmes[label].add(month(latest, i))
            if set(status_path) != {'-'}:
                fee = one(fees[centre, key])
                centre_data['programmes'][label] = [fee, ''.join(status_path)]
        centres[centre] = centre_data

    months = [month(latest, i) for i in range(len(PERIODS))]
    data = {
        'snapshot': latest, 'months': months,
        'programmes': {label: sorted(supported) for label, supported in programmes.items() if supported},
        'feeBasis': FEE_BASIS, 'feeSourceMonth': FEE_SOURCE_MONTHS.get(latest),
        'provisionalMonths': PROVISIONAL_MONTHS.get(latest, []),
        'centres': centres, 'audit': dict(audit), 'sources': [raw_path.name, 'affordability_availability.csv'],
    }
    output = ROOT / 'public/data/preschool-finder.json'
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'{latest}: {len(centres)} coded centres, {len(reports)} latest joined option keys. {dict(audit)}')


if __name__ == '__main__':
    build()
