type Job = { company: string; role?: string; dates?: string; points?: string[] };
// Employers are supplied in the specification. TODO: confirm titles, dates and achievements.
export const experience: { name: string; jobs: Job[] }[] = [
  { name: 'GIS & Geospatial Experience', jobs: [{ company: 'Yandex' }, { company: 'Eurotechnik' }, { company: 'Data 3' }] },
  { name: 'AI & Data Evaluation', jobs: [{ company: 'Outlier' }, { company: 'RWS' }] },
];
