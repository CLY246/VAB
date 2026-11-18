const novemberNursery = 'Nursery 1 · November 2026 start · 14 November 2026 snapshot';
const januaryFees = 'Nursery 1 · January 2027 start · 14 November 2026 snapshot';
const listedFeeBasis = 'Fees are listed Singapore Citizen full-day monthly fees before subsidy and GST.';
const feeReference = januaryFees + ' · All areas and schemes · S$650 and S$1,820 monthly ceilings';
const period = 'Five snapshots from 12 October to 14 November 2026';
const novemberPlaygroup = 'Playgroup · November 2026 start · Limited or Full · ' + period;

const geographyInsight = 'Tampines had 71 centres reporting Available or Limited for 14,830 resident children aged 0–4, or 4.79 per 1,000. Jurong East had 26 for 1,800, or 14.44 per 1,000.';
const feeInsight = 'At S$650, 972 of 1,712 offering centres were within the fee limit. Of these, 749 reported Available or Limited and 223 reported Full. At S$1,820, 971 of 1,712 reported Available or Limited within the limit, a gain of 222.';
const persistenceInsight = 'Of 1,652 matched options, 969 (58.7%) reported Limited or Full at all five checks, 63 (3.8%) at one to four checks, and 620 (37.5%) at none.';
const timingInsight = 'The persistent Limited-or-Full share was 58.7% for November (969 of 1,652) and 39.0% for January (644 of 1,652), a difference of 19.7 percentage points across the same matched centres.';
const schemeInsight = 'Persistent Limited-or-Full rates were 75.0% for Anchor Operators (461/615), 53.3% for Partner Operators (203/381) and 46.5% for Scheme unlisted (305/656).';

export const dashboardCopy = {
  geography: {
    question: 'Where are preschool options relatively scarce compared with the population of young children?',
    purpose: 'The map and area rankings compare centres reporting Available or Limited per 1,000 resident children aged 0–4. Workplace charts compare worker counts with the share of applicable reports marked Limited or Full.',
    scope: 'Vacancy snapshot on 14 November 2026. Population and workplace counts come from SingStat’s 2025 General Household Survey.',
    controls: 'Choose Programme and Start month in Tableau. Read the map and ranked bars together, then explore the status breakdown in workplace areas.',
    selection: novemberNursery,
    insights: [
      geographyInsight + ' The pooled rate across eligible areas was 6.89 per 1,000 and serves as a comparison benchmark.',
      'Downtown Core had 332,600 workers and 7 of 19 centres (36.8%) reporting Limited or Full. Geylang had 125,700 workers and 42 of 55 centres (76.4%) reporting Limited or Full.',
    ],
    implication: 'Planning areas can look very different when ranked by raw counts or by rates per child. Workplace patterns add context because families may also search near work. Worker counts cannot establish preschool demand.',
  },
  affordability: {
    question: 'How many preschools within a parent’s monthly fee limit report Available or Limited for the selected programme and start month?',
    purpose: 'The totals, cumulative fee curve, area and scheme bars, and map distinguish Available, Limited and Full within the limit, above the limit, and no single comparable full-day fee.',
    scope: 'Vacancy snapshot on 14 November 2026. Fees are listed monthly Singapore Citizen full-day fees before subsidy and GST, from the October 2026 centre services listing.',
    controls: 'Set Programme, Start month and the monthly fee limit. The Planning area and Operator scheme lists focus the totals, curve and map. Click an area bar to show it on the map. The bar charts retain all areas and schemes.',
    selection: feeReference,
    insights: [
      'At S$650, 972 centres were within the limit (474 Available, 275 Limited and 223 Full). At S$1,820, 1,317 were within the limit (662 Available, 309 Limited and 346 Full).',
      'Raising the limit added 222 centres reporting Available or Limited (749 to 971). At both ceilings, 138 of the 1,712 offering centres (8.1%) lacked a single comparable full-day fee.',
    ],
    implication: 'Check fee and reported vacancy separately when building a shortlist. Centres with unknown or incomparable fees stay visible as a separate group. Listed fees cannot tell a family what it will pay or what quality to expect.',
    chart: 'budget-options',
  },
  persistence: {
    question: 'How persistent are reported preschool availability constraints, and how do they differ by intended start month and operator scheme?',
    purpose: 'Track matched centre–programme options by intended month, programme, operator scheme and planning area. The dashboard shows how often the selected constraint definition is met and links to saved model findings.',
    scope: period + '. Intended start months run from November 2026 to April 2027.',
    controls: 'Use Constraint definition and Programme focus. Select an intended month on the trend, then use Planning region and Area measure to explore geography. Use View Model Findings and Return within Tableau.',
    selection: 'Playgroup · November 2026 and January 2027 starts · Limited or Full · ' + period,
    insights: [
      'November. ' + persistenceInsight,
      timingInsight,
      'November Playgroup. ' + schemeInsight + ' Anchor Operators had the highest share in each of the four November programme comparisons.',
    ],
    implication: 'Repeated reports reveal patterns that a single check can miss. The one-to-four group counts checks meeting the combined definition. An option can switch between Limited and Full while meeting that definition at every check.',
    chart: 'availability-paths',
  },
};

export const findings = [
  { eyebrow: '01 / Geography', title: 'High centre counts can hide low provision per child', key: 'geography', selection: novemberNursery, text: geographyInsight },
  {
    eyebrow: '02 / Workplace context',
    title: 'More workers do not necessarily mean more reported constraints',
    key: 'geography',
    selection: 'Nursery 1 · November 2026 start · Vacancy snapshot: 14 November 2026 · Workplace counts: 2025',
    text: 'Downtown Core had 332,600 employed residents working there, with 36.8% of its reporting centres Limited or Full (7/19). Geylang had 125,700 workers and a higher constrained share of 76.4% (42/55). Worker concentration alone is insufficient to explain this difference in reported constraints.',
  },
  { eyebrow: '03 / Fees', title: 'Higher ceilings expand the shortlist', key: 'affordability', selection: feeReference, text: feeInsight },
  { eyebrow: '04 / Persistence', title: 'November Playgroup constraints often persisted', key: 'persistence', selection: novemberPlaygroup, text: persistenceInsight },
  { eyebrow: '05 / Timing', title: 'The intended start month matters', key: 'persistence', selection: dashboardCopy.persistence.selection, text: timingInsight },
];

export const deepDiveNotes = [
  {
    title: 'Punggol offers a strong affordable shortlist',
    selection: 'Nursery 1 · January 2027 start · S$650 monthly listed-fee limit · 14 November 2026 snapshot · All operator schemes',
    paragraphs: [
      'In Punggol, 61 of 77 centres offering Nursery 1 (79.2%) reported Available or Limited within the S$650 fee limit. These comprised 47 Available and 14 Limited centres. This was the highest share among planning areas with at least ten centres offering the programme for this selection.',
      listedFeeBasis,
    ],
    why: 'Punggol provides a useful starting point for parents exploring this programme, month and fee limit. Confirm current availability with the centre. The counts describe reported options and cannot establish vacant seats or guarantee admission.',
    detail: {
      title: 'Geographical context for the same start month',
      paragraphs: ['For January 2027, Punggol had 67 centres reporting Available or Limited for 11,830 resident children aged 0–4, or 5.66 per 1,000 against a pooled rate of 7.00. This geographical rate uses the child population and applies no fee limit.'],
    },
    dashboard: 'affordability',
  },
  {
    title: 'Fees and vacancy status can restrict options in different ways',
    selection: 'Nursery 1 · January 2027 start · S$1,820 monthly listed-fee limit · 14 November 2026 snapshot · All operator schemes',
    paragraphs: [
      'River Valley had ten centres offering Nursery 1. None reported Available or Limited within the selected fee limit. Seven exceeded the limit, two lacked a single comparable full-day fee, and the remaining centre was within the limit but reported Full.',
      listedFeeBasis,
    ],
    why: 'An empty shortlist can arise from several barriers. Distinguishing fees, missing fee information and reported Full status helps parents understand which criteria restrict their options.',
    dashboard: 'affordability',
  },
  {
    title: 'Operator scheme added the most information within the model',
    selection: 'Matched options with positive listed fees · Multiple programmes and intended start months · Limited or Full at all five snapshots',
    paragraphs: [
      'Among the five characteristics examined, removing operator scheme produced the largest reduction in model discrimination (4.55 AUC points). Scheme added useful information alongside planning area, programme level, intended start month and listed fee.',
      'The supplied overall AUC estimate of approximately 0.62 suggests modest discrimination. The model supports further investigation of scheme differences. It cannot establish causes or reliably forecast future availability.',
      'Open Persistent Constraints and select View Model Findings inside Tableau.',
    ],
    detail: {
      title: 'How the model comparison works',
      paragraphs: [
        'The supplied analysis describes a logistic regression comparison. Validation held out entire centres. A drop of 4.55 AUC points is 0.0455 on the AUC scale. Using the supplied baseline of about 0.620 implies an AUC of about 0.5745 without scheme. The workbook export reports the drop, but omits the absolute AUC values.',
        'AUC measures how well the model ranks persistently constrained options above other options. An AUC of 0.62 cannot be read as 62% classification accuracy. The 4.55-point contribution cannot be interpreted as a share of constraints explained or a change in an individual centre’s risk.',
        'These are saved overall model results. Dashboard controls do not retrain the model. The result does not measure parents’ preferences.',
      ],
    },
    dashboard: 'persistence',
    linkLabel: 'Explore Model Findings',
  },
];

export const availabilityPathNote = {
  title: 'November Playgroup · From the first Full report to the final check',
  selection: 'Playgroup · November 2026 start · 12 October and 14 November 2026 endpoints',
  paragraphs: [
    'Additional analysis of the matched paths in the local D3 data. Of 592 options reporting Full at the first snapshot, 12 (2.0%) reported Available at the final snapshot, 51 reported Limited and 529 reported Full.',
    'Of the 529 reporting Full at both endpoints, 519 reported Full at every check and 10 changed status in between. The local parallel sets chart shows those intermediate checks. The Tableau persistence dashboard groups options by how often they met the selected definition.',
  ],
};

export const assumptions = [
  {
    title: 'Counts and status definitions',
    paragraphs: [
      'Each centre counts once for a selected programme and intended start month, regardless of capacity. Counts cannot quantify vacant seats or a seat shortage.',
      'Limited has no quantified threshold in these data. Limited or Full is a broader constraint definition and includes options that may still have places. Full reports alone cannot reveal demand, staffing, capacity or how recently a centre updated its status.',
    ],
  },
  {
    title: 'Population, workplaces and travel',
    paragraphs: [
      'Resident children aged 0–4 provide geographic context. The denominator covers all children in that age range regardless of programme eligibility or participation. Families may travel across planning areas or search near work.',
      'Workplace counts cover employed residents and do not identify parents of preschool-aged children or their childcare preferences. Dashboard 1 leaves areas with 500 or fewer resident children aged 0–4 or missing population data unranked. A missing rank does not establish an absence of provision. The pooled rate is a comparison benchmark rather than an adequacy standard.',
    ],
  },
  {
    title: 'Matching and fee coverage',
    paragraphs: [
      'The 14 November 2026 source listing contains 88 rows without a usable centre code. Code-based matching excludes these rows, and their distribution can affect geographic coverage. The local paths also require a valid report at all five snapshots for each centre, programme and intended start month.',
      'Budget figures use listed monthly Singapore Citizen full-day fees before subsidy and GST. Missing or incomparable fees stay separate. The local budget chart counts Available options with a positive matched fee and a usable planning area.',
    ],
  },
  {
    title: 'Reference periods and intended start months',
    paragraphs: [
      'Population and workplace data are from 2025. Vacancy and fee records are from 2026. The five snapshots cover roughly one month, which limits conclusions about long-term persistence, seasonality and future availability.',
      'A snapshot date is when the report was captured. November and January refer to intended enrolment months compared across the same five observation dates. Their difference does not establish improvement from November to January.',
    ],
  },
];

export const furtherWork = [
  'Compare Available-only rates while keeping underlying centre and population counts visible.',
  'Use travel-time and cross-boundary data to assess access from home and work.',
  'Use applications, waiting lists or enrolment records to study demand, and service quality and family preferences to study value.',
];

export const recommendations = {
  families: 'Start with the programme and intended month, then compare more than one area that fits your travel routine. Check the listed fee and reported status separately. Confirm the current vacancy, waiting time and household cost directly with the centre.',
  planners: 'Review low availability relative to child population alongside persistent Limited or Full reports. Check small denominators, unmatched records and fee coverage before prioritising areas for follow-up.',
};
