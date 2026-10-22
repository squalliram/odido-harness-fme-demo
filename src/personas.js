// Display names and emails stay in the app. Only the key and the attributes below are handed to the
// FME SDK, which evaluates targeting locally: attributes are not sent to Harness with impressions.

export const CITIES = ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'London'];

export const PERSONAS = [
  {
    id: 'fleur',
    name: 'Fleur de Vries',
    tagline: 'Odido employee, Den Haag',
    key: 'odido-emp-0007',
    expected: 'New journey: in segment odido_staff (dogfooding)',
    attributes: { city: 'Den Haag', customerType: 'consumer', isEmployee: true, plan: 'unlimited_start', usagePct: 64, tenureMonths: 52, appVersion: '9.6.2', platform: 'ios' },
  },
  {
    id: 'daan',
    name: 'Daan Bakker',
    tagline: 'Beta tester, Utrecht',
    key: 'odido-cust-2041',
    expected: 'New journey: in segment beta_testers',
    attributes: { city: 'Utrecht', customerType: 'consumer', isEmployee: false, plan: 'go10', usagePct: 95, tenureMonths: 18, appVersion: '9.6.2', platform: 'android' },
  },
  {
    id: 'sanne',
    name: 'Sanne Jansen',
    tagline: 'Customer, Amsterdam',
    key: 'odido-cust-3318',
    expected: 'New journey: city is Amsterdam, consumer, app 9.6.0 or later',
    attributes: { city: 'Amsterdam', customerType: 'consumer', isEmployee: false, plan: 'go10', usagePct: 88, tenureMonths: 30, appVersion: '9.6.2', platform: 'ios' },
  },
  {
    id: 'mohammed',
    name: 'Mohammed El Amrani',
    tagline: 'Customer, Rotterdam',
    key: 'odido-cust-4402',
    expected: 'Current journey until Rotterdam is added to the city rule',
    attributes: { city: 'Rotterdam', customerType: 'consumer', isEmployee: false, plan: 'unlimited_start', usagePct: 81, tenureMonths: 9, appVersion: '9.6.1', platform: 'android' },
  },
  {
    id: 'lotte',
    name: 'Lotte Visser',
    tagline: 'Customer, Amsterdam, old app',
    key: 'odido-cust-5127',
    expected: 'Current journey: app 9.4.0 is below the 9.6.0 minimum',
    attributes: { city: 'Amsterdam', customerType: 'consumer', isEmployee: false, plan: 'go10', usagePct: 92, tenureMonths: 44, appVersion: '9.4.0', platform: 'ios' },
  },
  {
    id: 'smit',
    name: 'Bakkerij Smit B.V.',
    tagline: 'Business customer, Eindhoven',
    key: 'odido-biz-6650',
    expected: 'Current journey: business customers are out of scope for now',
    attributes: { city: 'Eindhoven', customerType: 'business', isEmployee: false, plan: 'unlimited_start', usagePct: 73, tenureMonths: 70, appVersion: '9.6.2', platform: 'android' },
  },
  {
    id: 'custom',
    name: 'Custom customer',
    tagline: 'Edit any attribute live',
    key: 'odido-cust-9000',
    expected: 'Depends on the attributes you set. Try London.',
    attributes: { city: 'London', customerType: 'consumer', isEmployee: false, plan: 'go10', usagePct: 75, tenureMonths: 12, appVersion: '9.6.2', platform: 'ios' },
  },
];
