"""Build the Deep Dive JSON from the local ECDA and Tableau exports."""
import csv
import json
from bisect import bisect_right
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/preschool_access/Data'
PROGRAMMES = {'Infant': 'Infant care', 'PG': 'Playgroup', 'N1': 'Nursery 1', 'N2': 'Nursery 2'}
LEVELS = dict(zip(PROGRAMMES, ('Infant (2 to 18 mths)', 'Playgroup (18 mths to 2 yrs old)',
                               'Pre-Nursery (3 yrs old)', 'Nursery (4 yrs old)')))
PERIODS = ['Current', 'Next', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh']
STATUSES = ['Available', 'Limited', 'Full']


def rows(path, encoding='utf-8-sig', delimiter=','):
    with path.open(encoding=encoding, newline='') as source:
        yield from csv.DictReader(source, delimiter=delimiter)


def month(date, offset):
    year, number = map(int, date[:7].split('-'))
    year, index = divmod(year * 12 + number - 1 + offset, 12)
    return f'{year:04}-{index + 1:02}'


def code(value):
    return '' if value.strip().lower() in ('', 'na') else value.strip()


def availability():
    reports = defaultdict(set)
    for row in rows(DATA / 'Processed/preschool_factor_analysis.csv', 'utf-16', '\t'):
        if row['Data section'] == 'Reports':
            key = (row['Centre code'], row['Programme'], row['Enrolment month'], row['Snapshot date'])
            assert key not in reports, ('Duplicate factor report', key)
            reports[key].add(row['Reported status'])
    dates = sorted({k[3] for k in reports})
    assert len(dates) == 5
    months = sorted(set.intersection(*({month(d, i) for i in range(7)} for d in dates)))
    areas = defaultdict(set)
    for row in rows(DATA / 'Processed/affordability_availability.csv'):
        area = row['planning_area'].strip()
        if row['snapshot_date'] == dates[-1] and area:
            areas[code(row['centre_code'])].add(area)
    names = defaultdict(set)
    raw = defaultdict(set)
    uncoded = Counter()
    duplicates = 0
    for date in dates:
        _, mm, dd = date.split('-')
        for row in rows(DATA / f'Raw/ListingofCentres {dd}-{mm}.csv'):
            centre = code(row['centre_code'])
            name = row['centre_name'].strip()
            if date == dates[-1] and centre and name:
                names[centre].add(name)
            for programme, label in PROGRAMMES.items():
                for i, period in enumerate(PERIODS):
                    start = month(date, i)
                    if start not in months:
                        continue
                    status = row[f'{programme.lower()}_vacancy_{period.lower()}_month']
                    if not centre:
                        uncoded[label, start] += status in STATUSES
                        continue
                    key = (centre, label, start, date)
                    duplicates += key in raw
                    raw[key].add(status)

    candidates = {k[:3] for k, values in raw.items() if values.intersection(STATUSES)}
    groups = {}
    for label in PROGRAMMES.values():
        for start in months:
            paths = Counter()
            path_centres = {}
            excluded = Counter()
            matched_keys = set()
            for centre, programme, intended in sorted(candidates):
                if (programme, intended) != (label, start):
                    continue
                keys = [(centre, label, start, date) for date in dates]
                values = [raw.get(key, set()) for key in keys]
                reasons = set()
                for statuses in values:
                    if len(statuses) > 1:
                        reasons.add('conflicting reports')
                    elif not statuses:
                        reasons.add('missing report')
                    elif not statuses.issubset(STATUSES):
                        reasons.add('invalid status')
                if reasons:
                    excluded[' + '.join(sorted(reasons))] += 1
                    continue
                assert all(raw[key] == reports[key] for key in keys), keys
                matched_keys.update(keys)
                path = ''.join(str(STATUSES.index(next(iter(s)))) for s in values)
                paths[path] += 1
                path_centres[path] = centre

            total = sum(paths.values())
            assert all(sum(n for p, n in paths.items() if p[i] == str(s)) ==
                       sum(key[3] == date and raw[key] == {status} for key in matched_keys)
                       for i, date in enumerate(dates) for s, status in enumerate(STATUSES))
            single_centres = {}
            for path, n in sorted(paths.items()):
                if n == 1:
                    centre = path_centres[path]
                    single_centres[path] = {
                        'name': next(iter(names[centre])) if len(names[centre]) == 1 else centre,
                        'area': next(iter(areas[centre])) if len(areas[centre]) == 1 else None,
                    }
            groups.setdefault(label, {})[start] = {
                'paths': sorted(paths.items()), 'excluded': dict(sorted(excluded.items())),
                'uncoded': uncoded[label, start], 'singleCentres': single_centres,
            }
            assert total * len(dates) == len(matched_keys)
    assert sum(sum(n for _, n in g['paths']) for m in groups.values() for g in m.values()) * 5 == len(reports)
    print('Availability factor report keys:', len(reports), 'raw duplicate coded report rows:', duplicates)
    return {'dates': dates, 'groups': groups}


def affordability():
    source = list(rows(DATA / 'Processed/affordability_availability.csv'))
    date = max(r['snapshot_date'] for r in source)
    options = defaultdict(list)
    uncoded = Counter()
    for row in source:
        if row['snapshot_date'] != date:
            continue
        programme = row['programme']
        start = month(date, PERIODS.index(row['enrolment_period'].removesuffix(' Month')))
        centre = code(row['centre_code'])
        if not centre:
            uncoded[PROGRAMMES[programme], start] += row['vacancy_status'] == 'Available'
            continue
        options[centre, programme, start].append(row)

    groups = {}
    fee_history = defaultdict(set)
    stats = Counter()
    for (centre, programme, start), records in options.items():
        statuses = {r['vacancy_status'] for r in records}
        areas = {r['planning_area'].strip() for r in records} - {''}
        fees = {round(float(r['fee_amount']) * 100) for r in records
                if r['citizenship'] == 'SC' and r['type_of_service'] == 'Full Day'
                and r['levels_offered'] == LEVELS[programme] and r['fee_amount']
                and float(r['fee_amount']) > 0}
        fee_history[centre, programme].update(fees)
        stats['duplicate coded keys'] += len(records) > 1
        stats['conflicting fees at a key'] += len(fees) > 1
        group = groups.setdefault(PROGRAMMES[programme], {}).setdefault(start, {
            'areas': {}, 'missingLocation': 0, 'missingFee': 0,
            'uncoded': uncoded[PROGRAMMES[programme], start], 'statusConflict': 0,
        })
        if 'Available' not in statuses:
            continue
        if len(statuses) > 1:
            group['statusConflict'] += 1
            continue
        fee = next(iter(fees)) if len(fees) == 1 else None
        group['missingFee'] += fee is None
        if len(areas) != 1:
            group['missingLocation'] += 1
            continue
        entry = group['areas'].setdefault(next(iter(areas)), [0, Counter()])
        if fee is None:
            entry[0] += 1
        else:
            entry[1][fee] += 1

    stats['conflicting fees across months'] = sum(len(fees) > 1 for fees in fee_history.values())
    assert not stats['conflicting fees across months'], 'Review conflicting centre–programme fee matches'
    known_areas = sorted({area for months in groups.values() for group in months.values() for area in group['areas']})
    for months in groups.values():
        for group in months.values():
            group['areas'] = [[known_areas.index(area), unknown, sorted(fees.items())]
                              for area, (unknown, fees) in sorted(group['areas'].items())]
    print('Affordability coded keys:', len(options), dict(stats), 'uncoded Available rows:', sum(uncoded.values()))
    result = {'date': date, 'areas': known_areas, 'groups': groups}
    validate_budgets(result, source)
    return result


def validate_budgets(data, source):
    # Count distinct centres directly from source rows at each endpoint.
    direct = defaultdict(dict)
    for row in source:
        if (row['snapshot_date'] != data['date'] or row['vacancy_status'] != 'Available'
                or not code(row['centre_code']) or not row['planning_area']
                or row['citizenship'] != 'SC' or row['type_of_service'] != 'Full Day'
                or row['levels_offered'] != LEVELS[row['programme']]
                or not row['fee_amount'] or float(row['fee_amount']) <= 0):
            continue
        offset = PERIODS.index(row['enrolment_period'].split()[0])
        key = (PROGRAMMES[row['programme']], month(row['snapshot_date'], offset), row['planning_area'])
        direct[key][row['centre_code']] = round(float(row['fee_amount']) * 100)

    remaining = set(direct)
    for programme, months in data['groups'].items():
        for intended, group in months.items():
            for index, _, histogram in group['areas']:
                key = (programme, intended, data['areas'][index])
                raw_fees = sorted(direct.get(key, {}).values())
                remaining.discard(key)
                thresholds = sorted({0, 130000, 190000, *raw_fees, *(fee for fee, _ in histogram)})
                previous = 0
                for ceiling in thresholds:
                    endpoint = sum(n for fee, n in histogram if fee <= ceiling)
                    assert endpoint >= previous
                    assert endpoint == bisect_right(raw_fees, ceiling), (key, ceiling)
                    previous = endpoint
    assert not remaining, remaining
    print('Budget endpoints matched direct counts at all fee breakpoints and both default ceilings.')


if __name__ == '__main__':
    for name, data in [('availability-paths', availability()), ('budget-options', affordability())]:
        with (ROOT / f'public/data/{name}.json').open('w') as target:
            json.dump(data, target, separators=(',', ':'))
            target.write('\n')
