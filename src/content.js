// Site copy. Every number here is listed with its claim id in
// agents/content/2026-11-19-frozen-numbers.json (verification pass, 19 Nov 2026).

const novemberNursery = 'Nursery 1 · November 2026 start · 14 November 2026 listing';
const januaryFees = 'Nursery 1 · January 2027 start · 14 November 2026 listing';
const listedFeeBasis = 'Fees are listed monthly Singapore Citizen full day fees before subsidy and GST, from the October 2026 centre services listing.';
const feeReference = januaryFees + ' · All areas and schemes · S$650 and S$1,820 monthly fee limits';
const checks = 'Five ECDA listings: a dataset last updated by 24 September 2026 (downloaded 12 October), then downloads on 19 October, 24 October, 1 November and 14 November 2026';
const novemberPlaygroup = 'Playgroup · November 2026 start · Limited or Full · five listings, late September to 14 November 2026';

const geographyInsight = 'Tampines had 71 centres reporting Available or Limited for 14,830 resident children aged 0 to 4, or 4.79 per 1,000. Jurong East had 26 for 1,800, or 14.44 per 1,000.';
const workplaceInsight = 'Downtown Core had 332,600 employed residents working there, and 7 of its 19 centres with a report (36.8%) reported Limited or Full. Geylang had 125,700, and 42 of 55 centres (76.4%) reported Limited or Full.';
const feeInsight = 'At a S$650 limit, 749 of the 1,712 centres offering Nursery 1 had a listed fee within the limit and reported Available or Limited. At S$1,820 the count was 971, a gain of 222 centres.';
const persistenceInsight = 'Of 1,652 matched Playgroup options, 987 (59.7%) reported Limited or Full at all five listings, 37 (2.2%) at one to four, and 628 (38.0%) at none.';
const timingInsight = 'For a November 2026 start, 59.7% of the 1,652 options (987) reported Limited or Full at every listing. For a January 2027 start the share was 42.2% (697), a gap of 17.6 percentage points across the same options and the same five dates.';
const schemeInsight = 'Persistent Limited or Full shares were 75.6% for Anchor Operators (465 of 615), 54.6% for Partner Operators (208 of 381) and 47.9% for centres in neither scheme (314 of 656).';

export const researchQuestions = [
  { id: 'RQ1', question: 'Where are centres reporting a place in short supply relative to the young children who live in an area?', dashboard: 'geography' },
  { id: 'RQ2', question: 'How do listed fees, operator scheme and location shape how many centres with a reported place a parent can choose from?', dashboard: 'affordability' },
  { id: 'RQ3', question: 'Which options keep reporting Limited or Full across repeated listings, and what do they have in common?', dashboard: 'persistence' },
];

export const dashboardCopy = {
  geography: {
    question: 'Where is reported preschool availability lower once we allow for how many young children live in an area?',
    purpose: 'The map and ranked bars count centres reporting Available or Limited for the chosen programme and start month, per 1,000 resident children aged 0 to 4. Darker blue means fewer centres reporting a place per child. The population chart plots children against centres reporting a place, with a line at the pooled rate. The workplace charts cover the 15 areas where the most employed residents work and show the status mix of centres there.',
    scope: 'Status from the ECDA Listing of Centres downloaded 14 November 2026. Children aged 0 to 4 from SingStat table C020123 and employed residents by workplace area from table C020151 (General Household Survey 2025).',
    controls: 'Choose Programme and Start month at the top; every chart updates. Click an area on the map or the population chart to filter the whole dashboard to it, and click again to clear. If the area is not one of the 15 workplace areas, the workplace charts go empty. Hover for counts of Available, Limited and Full centres and the number of children.',
    selection: novemberNursery,
    insights: [
      geographyInsight + ' Tableau shows these rounded to 4.8 and 14.4.',
      'The pooled rate across the 29 areas with more than 500 resident children aged 0 to 4 was 6.89 per 1,000 (6.9 in Tableau). It is a comparison point and not a standard of adequacy.',
      workplaceInsight + ' In this selection, Downtown Core had more employed residents working there but a lower constrained share than Geylang.',
    ],
    implication: 'A large town can have many centres and still have few reporting a place for each child. Comparing per child shows where a reported place may be harder to find, which raw counts hide.',
    limitations: [
      'Statuses are centres’ own reports to ECDA. We count centres because seat numbers are not published, and Limited has no published threshold.',
      'The rate uses all residents aged 0 to 4 for every programme, so it does not match each programme’s age band.',
      'Areas with 500 or fewer children aged 0 to 4, or no population figure, are not ranked. No rank does not mean no centres.',
      'Population and workplace counts are 2025 survey estimates, and workplace counts are rounded to 100. They cover employed residents and do not identify parents.',
      'This view uses one listing, 14 November 2026.',
    ],
  },
  affordability: {
    question: 'For a chosen programme, start month and monthly fee limit, how many centres list a fee within the limit and report a place?',
    purpose: 'The summary counts centres within the limit that report Available or Limited, and separately those within the limit but Full, those above the limit, and those with no single full day fee. The fee curve shows how the count grows as the limit rises, with grey lines at the Anchor and Partner Operator fee caps. Area bars show each area’s centres as shares, scheme bars show counts, and the map shows centres within the limit coloured by status.',
    scope: 'Status from the 14 November 2026 listing. ' + listedFeeBasis,
    controls: 'Set Programme, Start month and the fee limit (S$10 steps; the published view opens at S$1,820, so type 650 to see the lower limit). Planning area and Operator scheme focus the summary, curve and map; the area bars keep every area and the scheme bars keep every scheme. Click an area bar to show only that area on the map, and click again to clear.',
    selection: feeReference,
    insights: [
      'At S$650, 972 centres were within the limit: 474 Available, 275 Limited and 223 Full. At S$1,820, 1,317 were within the limit: 662 Available, 309 Limited and 346 Full. Centres reporting Available or Limited rose from 749 to 971, a gain of 222.',
      'At S$650, Punggol had 61 of 77 centres offering Nursery 1 (79.2%) within the limit and reporting a place, the highest share among areas with at least 10 centres offering.',
      'At S$650, 748 of the 749 centres with a place within the limit were Anchor (431) or Partner (317) Operators. At both limits, 138 of the 1,712 centres (8.1%) had no single comparable full day fee.',
    ],
    implication: 'A listed fee and a reported place are separate filters. The dashboard shows how much a shortlist grows when a family can stretch its limit, and which areas and schemes the extra options come from.',
    limitations: [
      'Listed fees are before subsidy and GST. A household’s own cost after subsidy will be lower and varies; ECDA’s preschool search tools estimate it.',
      'Available or Limited is a centre’s report and does not guarantee a place.',
      'Centres with no single comparable full day fee stay in the counts as a separate group but cannot sit on the curve.',
      'Counts are centres; seat numbers are not published. Rows without a usable centre code (88 in the 14 November listing) cannot be matched to fees.',
    ],
    chart: 'budget-options',
  },
  persistence: {
    question: 'Across five listings, how often did the same option keep reporting Limited or Full for the same intended start month, and how does this differ by start month, operator scheme and area?',
    purpose: 'The unit is a matched option: one centre offering one programme, found with a valid report in all five listings. An option is persistent when it meets the chosen definition (Limited or Full, or Full only) at all five listings. The frequency bars group options by how many listings met the definition. The heatmap shows the persistent share by programme and operator scheme. The area bars rank areas with at least 20 options. The budget table counts options reporting Available on 14 November with a listed fee within the fee limit set by its Monthly fee ceiling control. The model chart shows saved results.',
    scope: checks + '. Intended start months November 2026 to March 2027. The first download’s months were aligned to September, the month its content refers to.',
    controls: 'Choose Enrolment month, Constraint definition and Programme focus. The heatmap always shows all four programmes. Use Planning region and Area measure (rate or count) for the area bars. Move the Monthly fee ceiling for the budget table, which opens with only a few planning areas selected; add others from its Planning area list. The model findings are fixed and do not change with the controls.',
    selection: 'Playgroup · November 2026 and January 2027 starts · Limited or Full · five listings, late September to 14 November 2026',
    insights: [
      'November 2026 start. ' + persistenceInsight,
      timingInsight,
      schemeInsight + ' Anchor Operators had the highest share in all four programmes for a November start (Infant care 64.9%, Playgroup 75.6%, Nursery 1 65.5%, Nursery 2 68.8%).',
    ],
    implication: 'One listing shows one moment. Repeated listings show which options stay hard to get, which is closer to what a family trying to enrol meets.',
    limitations: [
      'Five listings over about seven weeks cannot show seasonal or long term patterns.',
      'November and January are intended start months seen on the same five dates. Their gap does not show that availability improved over time. January also sits further ahead in each listing, and centres may report distant months less carefully.',
      'Operator scheme and the other characteristics are associations. They do not explain why a centre is constrained.',
      'The budget table counts Available only, while Dashboard 2 counts Available or Limited, so the two can differ.',
      'Rows without a usable centre code cannot be matched across listings.',
    ],
    chart: 'availability-paths',
  },
};

export const findings = [
  { eyebrow: 'Finding 1 · Geography', title: 'Many centres, but few reporting a place per child', key: 'geography', selection: novemberNursery, text: geographyInsight + ' The pooled rate was 6.89.' },
  {
    eyebrow: 'Finding 2 · Workplaces',
    title: 'Downtown Core had more employed residents working there but a lower constrained share than Geylang',
    key: 'geography',
    selection: novemberNursery + ' · Employed residents by workplace area, 2025',
    text: workplaceInsight,
  },
  { eyebrow: 'Finding 3 · Fees', title: 'A higher fee limit adds options with a reported place', key: 'affordability', selection: feeReference, text: feeInsight + ' 138 centres (8.1%) had no single comparable full day fee.' },
  { eyebrow: 'Finding 4 · Persistence', title: 'Most November Playgroup constraints held at every listing', key: 'persistence', selection: novemberPlaygroup, text: persistenceInsight },
  { eyebrow: 'Finding 5 · Start month', title: 'The intended start month matters', key: 'persistence', selection: dashboardCopy.persistence.selection, text: timingInsight },
];

export const deepDiveNotes = [
  {
    title: 'Investigation 1 · Punggol: many affordable options, but fewer centres per child',
    selection: 'Nursery 1 · January 2027 start · S$650 limit · 14 November 2026 listing · All operator schemes',
    paragraphs: [
      'In Punggol, 61 of the 77 centres offering Nursery 1 (79.2%) listed a fee within S$650 and reported a place: 47 Available and 14 Limited. That was the highest share among areas with at least 10 centres offering.',
      'For the same start month, Punggol had 67 centres reporting Available or Limited for 11,830 resident children aged 0 to 4. That is 5.66 per 1,000, below the pooled rate of 7.00 for areas with more than 500 children. This rate applies no fee limit.',
      listedFeeBasis,
    ],
    why: 'The two views answer different questions. A high share of affordable centres tells a family its shortlist will be mostly within budget. A low rate per child suggests more families may be looking at the same centres. Both count centres; neither counts seats.',
    dashboard: 'affordability',
  },
  {
    title: 'Investigation 2 · River Valley: why a shortlist can be empty',
    selection: 'Nursery 1 · January 2027 start · S$1,820 limit · 14 November 2026 listing · All operator schemes',
    paragraphs: [
      'River Valley had 10 centres offering Nursery 1 and none within S$1,820 that reported a place. Seven listed fees above the limit. Two had no single comparable full day fee. The one centre within the limit reported Full.',
      listedFeeBasis,
    ],
    why: 'An empty shortlist can come from fees, from missing fee information or from Full reports. Dashboard 2 keeps these apart, so a family can see which filter is binding. Raising the limit helps only with the first.',
    dashboard: 'affordability',
  },
  {
    title: 'Investigation 3 · Persistent constraints: counting listings, following paths, and what the model adds',
    selection: 'Playgroup · November 2026 start · Limited or Full · five listings, late September to 14 November 2026',
    paragraphs: [
      'Counting listings: 987 of 1,652 options reported Limited or Full at all five listings. That count treats an option that switches between Limited and Full as persistent.',
      'Following paths: of 595 options reporting Full at the first listing, 13 (2.2%) reported Available at the last, 41 Limited and 541 Full. Of those 541, 531 reported Full at every listing and 10 changed in between. The chart below shows each path.',
      'What the model adds: the team’s saved model results report that adding operator scheme to the other four characteristics (planning area, start month, listed fee, programme level) raised held out AUC by 5.26 points, or 0.053 on the AUC scale, for Limited or Full. The other four each added less than 0.6 points. For Full only, scheme added 1.01 points.',
    ],
    why: 'Counts and paths agree that a Full report at the first listing rarely turned into Available within seven weeks. The model shows scheme is the characteristic most associated with persistence. It does not show that scheme causes it.',
    detail: {
      title: 'How to read the model result',
      paragraphs: [
        'AUC measures how well a model ranks persistent options above other options. It is not accuracy, and a contribution in AUC points is not a share of constraints explained or a change in any one centre’s chance of a place.',
        'The team’s appendix states that validation held out whole centres. The model code is not in the submitted files, so these values are saved results that cannot be rerun here. No overall AUC is available for this model. Dashboard controls do not retrain it.',
      ],
    },
    dashboard: 'persistence',
    linkLabel: 'Explore Persistent Constraints',
  },
];

export const availabilityPathNote = {
  title: 'November Playgroup · From a Full report at the first listing to the last',
  selection: 'Playgroup · November 2026 start · first listing (content to 24 September, downloaded 12 October) and 14 November 2026',
  paragraphs: [
    'Of 595 options reporting Full at the first listing, 13 (2.2%) reported Available at the last listing, 41 reported Limited and 541 reported Full.',
    'Of the 541 reporting Full at both ends, 531 reported Full at every listing and 10 changed status in between. The Tableau persistence dashboard groups options by how many listings met the definition; this chart shows the order of the changes.',
  ],
};

export const conclusions = [
  {
    id: 'RQ1',
    answer: 'Centres reporting a place per child varied about threefold across ranked areas: 4.79 per 1,000 in Tampines and 14.44 in Jurong East for a November Nursery 1 start, against a pooled 6.89. Tampines had 71 centres reporting a place and still ranked low because 14,830 children live there. In this selection, Downtown Core had more employed residents working there (332,600) but a lower constrained share (36.8%) than Geylang (125,700; 76.4%).',
  },
  {
    id: 'RQ2',
    answer: 'Fee limit and reported status cut the shortlist in different ways. For Nursery 1 in January 2027, raising the limit from S$650 to S$1,820 added 222 centres reporting a place (749 to 971). At S$650, 748 of the 749 were Anchor or Partner Operators. Where shortlists are empty, the cause can be fees, missing fees or Full reports.',
  },
  {
    id: 'RQ3',
    answer: 'For a November Playgroup start, 59.7% of matched options reported Limited or Full at all five listings, against 42.2% for January. Anchor Operators had the highest persistent share in every programme, and scheme was the characteristic most associated with persistence in the saved model. These are associations seen over about seven weeks. They do not show causes.',
  },
];

export const recommendations = [
  {
    group: 'Parents and caregivers',
    items: [
      {
        title: 'Filter on fee and status separately',
        finding: 'For Nursery 1 in January 2027, 749 centres listed a fee within S$650 and reported a place; at S$1,820 the count was 971.',
        implication: 'A small change in budget can change the size of a shortlist a lot, and some empty shortlists are caused by fees or missing fees.',
        action: 'Set a fee limit in the finder or Dashboard 2, then check which centres report a place. Use ECDA’s tools to estimate your cost after subsidy.',
        limitation: 'Fees are listed before subsidy and GST, and a reported place is not a guaranteed place.',
      },
      {
        title: 'Compare more than one start month if you can',
        finding: 'For Playgroup, 59.7% of options reported Limited or Full at every listing for a November start, and 42.2% for January.',
        implication: 'Options for a later intended start month were less often constrained across the same listings.',
        action: 'If your start date is flexible, compare months in the finder and Dashboard 3, then contact centres directly.',
        limitation: 'This was seen over seven weeks in late 2026. January sat further ahead than November in every listing, and centres may report distant months less carefully. It does not predict later months or admission.',
      },
      {
        title: 'Search beyond one planning area',
        finding: 'Centres reporting a place per child ranged from 4.79 per 1,000 in Tampines to 14.44 in Jurong East.',
        implication: 'Where you search from can change how many centres report a place per child. We assume families may consider centres outside their own planning area.',
        action: 'The finder takes one origin at a time: try searching from home, then from work.',
        limitation: 'Rates count centres. They say nothing about seats, quality or travel time.',
      },
    ],
  },
  {
    group: 'Data providers and planners',
    items: [
      {
        title: 'Date each listing and define its months',
        finding: 'The listing downloaded on 12 October 2026 held content last updated by 24 September. No column says which calendar month each vacancy column refers to, so we had to infer it.',
        implication: 'Users who compare downloads can misalign start months without knowing.',
        action: 'ECDA could add a dataset version date and the calendar month to each vacancy column, and publish what Limited means.',
        limitation: 'We inferred the alignment from content and update dates; we cannot confirm how the listing is produced.',
      },
      {
        title: 'Make fees and centre codes complete',
        finding: '138 of 1,712 centres offering Nursery 1 had no single comparable full day fee, and 88 rows in the 14 November listing had no usable centre code.',
        implication: 'These centres are left out of fee comparisons and matching, which can affect some areas more than others.',
        action: 'Give every row a centre code and one comparable monthly fee per programme.',
        limitation: 'We do not know why these values are missing.',
      },
      {
        title: 'Look closer where centres reporting a place per child are few',
        finding: 'Tampines had 4.79 centres reporting a place per 1,000 children aged 0 to 4, well below the pooled rate of 6.89.',
        implication: 'Areas like this are candidates for a closer look. The rate alone does not prove there is a shortage.',
        action: 'Planners could combine this view with seat capacity, waiting lists and enrolment data before drawing conclusions.',
        limitation: 'Our data have no seat counts or demand data, and residents aged 0 to 4 are only a rough proxy for demand.',
      },
    ],
  },
  {
    group: 'Future work',
    items: [
      {
        title: 'Test the website with parents',
        finding: 'Our evaluation was an expert walkthrough of parent tasks and functional testing of the finder. No parents took part.',
        implication: 'We do not know whether parents read the status labels and fee limits as intended.',
        action: 'Run a task based study with five to eight parents covering shortlisting, comparing months and reading a status.',
        limitation: 'A small study can find usability problems but cannot measure effects on enrolment.',
      },
      {
        title: 'Keep collecting listings',
        finding: 'Persistence rests on five listings over about seven weeks.',
        implication: 'We cannot separate seasonal patterns from lasting constraints.',
        action: 'Download the listing on a fixed schedule, record each dataset’s update date, and extend the analysis to a full enrolment year.',
        limitation: 'Statuses would still be self reported and without seat counts.',
      },
      {
        title: 'Make the model reproducible',
        finding: 'The saved model results cannot be rerun because the code and random seed are not in the submission.',
        implication: 'The 5.26 point scheme result cannot be checked independently.',
        action: 'Publish the model code, seed and an overall AUC with its uncertainty, and add travel time catchments.',
        limitation: 'Even a reproducible model would show associations only.',
      },
    ],
  },
];

export const d3VersionNote = 'Note: the embedded Tableau view below still uses an earlier alignment of the first listing, so its figures differ from the text on this page (for example 969 instead of 987 Playgroup options at every listing). The text uses the corrected analysis, which reads the first download as September 2026.';

export const evaluationNote = 'We evaluated the website through an expert walkthrough of parent tasks and functional testing of the finder code with automated tests. There was no user study and no parents were tested.';

export const privacyNote = {
  short: 'Your search origin is not saved and is not sent to analytics. Map tiles come from OpenStreetMap, which sees the approximate area shown, and a postal code lookup fetches one file from this site chosen by the code’s first digit.',
  full: 'Your search origin is not saved and is not sent to analytics; the site has no analytics. To draw the map, the page requests map tiles from OpenStreetMap, so the tile server learns the approximate area you are viewing. A postal code lookup fetches one file of postal codes from this site, chosen by the first digit of the code. The page also loads fonts from Google Fonts and the dashboards from Tableau Public.',
};

export const sources = [
  'ECDA Listing of Centres (data.gov.sg), downloaded 12 October, 19 October, 24 October, 1 November and 14 November 2026. The first download reflects data last updated by 24 September 2026. Dashboards 1 and 2 and the finder use the 14 November listing.',
  'ECDA Listing of Centre Services, October 2026: Singapore Citizen full day monthly fees before subsidy and GST.',
  'SingStat table C020123, Resident Population by Planning Area/Subzone of Residence, Age Group and Sex (General Household Survey 2025): residents aged 0 to 4, used as the denominator for centres per 1,000 children.',
  'SingStat table C020151, Employed Residents Aged 15 Years and Over by Planning Area of Workplace and Occupation (General Household Survey 2025): total employed residents by workplace area, rounded to 100, used for the workplace charts.',
  'URA Master Plan 2019 planning area boundaries, used to map centres and areas.',
];

export const assumptions = [
  {
    title: 'Counts and status definitions',
    paragraphs: [
      'Each centre counts once for a programme and intended start month, whatever its size. Counts cannot measure vacant seats or a seat shortage.',
      'Limited has no published threshold. Limited or Full is a broader definition and includes options that may still have places. Full reports alone cannot show demand, staffing, capacity or how recently a centre updated its status.',
    ],
  },
  {
    title: 'Population, workplaces and travel',
    paragraphs: [
      'Resident children aged 0 to 4 (C020123) give geographic context. The same denominator is used for every programme. Families may travel across planning areas or search near work.',
      'Workplace counts (C020151) cover employed residents aged 15 and over and do not identify parents. Areas with 500 or fewer children aged 0 to 4, or no population figure, are not ranked. The pooled rate is a comparison point and sets no standard.',
    ],
  },
  {
    title: 'Cleaning and matching',
    paragraphs: [
      'The 14 November listing has 88 rows without a usable centre code. Matching uses the code, so these rows are left out, and of the 1,785 coded centres 2 have no coordinates and are not mapped.',
      'Fees are matched by centre code and programme (Infant care, Playgroup, Pre Nursery for Nursery 1, Nursery for Nursery 2), Singapore Citizen, full day, above zero. Centres with no single comparable fee stay as a separate group.',
      'For persistence, each option needs a valid report in all five listings. The first download’s months were aligned to September because its content was last updated by 24 September, and its status columns matched the 19 October listing better when shifted one month (about 94% against 87% agreement). This gives a common window of November 2026 to March 2027.',
    ],
  },
  {
    title: 'Reference periods and start months',
    paragraphs: [
      'Population and workplace data are from 2025. Status and fees are from 2026. The five listings span about seven weeks, which limits conclusions about seasonality and future availability.',
      'A listing date is when a report was captured. November and January are intended start months compared on the same five listings, so their gap does not show change over time. Later start months sit further ahead in each listing, and centres may report distant months less carefully.',
    ],
  },
  {
    title: 'Evaluation and privacy',
    paragraphs: [evaluationNote, privacyNote.full],
  },
];

export const furtherWork = recommendations.find((r) => r.group === 'Future work').items.map((item) => item.action);
