type Job = { company: string; sector: string; description: string };
export const experience: { name: string; jobs: Job[] }[] = [
 { name: 'GIS & Geospatial Experience', jobs: [
  { company: 'Yandex', sector: 'Web Mapping', description: 'Maintained and improved geospatial data for a web mapping service used by more than 4 million people daily.' },
  { company: 'Data 3 Consulting', sector: 'Gas Infrastructure', description: 'Worked on a gas infrastructure project, turning engineering plans into accurate digital records of pipelines, valves and equipment.' },
  { company: 'Eurotechnika Tatarstan', sector: 'Agriculture', description: 'Helped farmers digitise their operations through field boundary mapping, spatial data validation and agricultural reporting.' },
 ] },
 { name: 'AI & Data Evaluation', jobs: [
  { company: 'Outlier AI / RWS Group', sector: 'AI Training & Quality Evaluation', description: 'Evaluate AI-generated text, imagery and video, create GIS-related evaluation tasks and review model outputs against structured quality criteria.' },
 ] },
];
