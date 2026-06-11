export const CHAT_WELCOME =
  'स्मार्ट बजेट ॲपमध्ये आपले स्वागत आहे. खालील प्रश्नांपैकी एक निवडा किंवा आपला प्रश्न विचारा.';

export const CHAT_FAQ = [
  {
    question: 'How do I log in to Smart Budget?',
    answer:
      'Tap Log In on the home screen, select your office location, enter your registered mobile number, and verify the OTP sent to your phone.',
  },
  {
    question: 'How can I download Excel reports?',
    answer:
      'Open the A.I button, choose Excel, then select report type (MPR, Headwise, All, or Abstract) and the section such as Building, Road, or NABARD. The file will be saved to your Downloads folder.',
  },
  {
    question: 'What is an MPR report?',
    answer:
      'MPR (Monthly Progress Report) shows month-wise progress of works under each budget head for your office. It is available for Building, CRF, Annuity, NABARD, and Road categories.',
  },
  {
    question: 'What is a Headwise report?',
    answer:
      'Headwise report gives a detailed budget head-wise breakdown of expenditure and progress. Use the Excel option in A.I to download it for any section.',
  },
  {
    question: 'How do I update project status?',
    answer:
      'Go to the Status tab, select the budget category (Building, Road, NABARD, etc.), find your work, and update the status, remarks, or upload site photos.',
  },
  {
    question: 'How do I view notifications?',
    answer:
      'Tap the Alert tab at the bottom of the screen to see all notifications related to your office and assigned works.',
  },
  {
    question: 'How do I update my profile?',
    answer:
      'Go to Settings → Profile. You can view your name, post, office, email, and mobile number registered with the system.',
  },
  {
    question: 'What budget categories are available?',
    answer:
      'The app supports Building, Road, NABARD, CRF, Annuity, Deposit Funds, DPDC, GAT A, GAT D, GAT FBC, MLA, MP, Non-Residential Building, Residential Building, 2515, and All categories.',
  },
  {
    question: 'How do I use Ask AI?',
    answer:
      'Open A.I → Ask AI, select a budget category, then speak your question using the microphone. The assistant will guide you about that category.',
  },
  {
    question: 'Who do I contact for technical support?',
    answer:
      'SGHI-TECH SOFTWARE COMPANY, Pune. Phone: (+91) 9096408111 / 9975408111. Email: info@sghitech.in. Website: www.sghitech.in',
  },
];

export const ASK_AI_CATEGORIES = [
  { label: 'Building', color: '#28a745', keywords: ['building', 'इमारत', 'बांधकाम'] },
  { label: 'Road', color: '#007AFF', keywords: ['road', 'रस्ता', 'मार्ग'] },
  { label: 'NABARD', color: '#6f42c1', keywords: ['nabard', 'नाबार्ड'] },
  { label: 'CRF', color: '#fd7e14', keywords: ['crf', 'सीआरएफ'] },
  { label: 'Annuity', color: '#20c997', keywords: ['annuity', 'अॅन्युइटी', 'annuty'] },
  { label: 'Deposite Funds', color: '#17a2b8', keywords: ['deposit', 'deposite', 'ठेव'] },
  { label: 'DPDC', color: '#e83e8c', keywords: ['dpdc'] },
  { label: 'GAT_A', color: '#6610f2', keywords: ['gat a', 'gat_a', 'गट अ'] },
  { label: 'GAT_D', color: '#343a40', keywords: ['gat d', 'gat_d', 'गट ड'] },
  { label: 'GAT_FBC', color: '#795548', keywords: ['gat fbc', 'gat_fbc', 'गट एफबीसी'] },
  { label: 'MLA', color: '#dc3545', keywords: ['mla', 'एमएलए'] },
  { label: 'MP', color: '#c2185b', keywords: ['mp', 'एमपी'] },
  { label: 'NonResBuilding', color: '#5c6bc0', keywords: ['nonres', 'non residential', '3054'] },
  { label: 'ResBuilding', color: '#00897b', keywords: ['resbuilding', 'residential', '2216'] },
  { label: '2515', color: '#f57c00', keywords: ['2515'] },
  { label: 'All', color: '#14b8a6', keywords: ['all', 'सर्व'] },
];

export const ASK_AI_RESPONSES = {
  Building:
    'Building category covers government building construction and renovation works. View live status in the Status tab or download Building reports via the Excel option.',
  Road:
    'Road category includes road construction, repair, and bridge works. Check progress in Status tab or download Road MPR/Headwise reports via Excel.',
  NABARD:
    'NABARD funds irrigation and rural development projects. Track NABARD works in Status tab and download NABARD reports from the Excel section.',
  CRF:
    'CRF (Central Road Fund) category is for centrally funded road projects. View and update CRF project status from the Status tab.',
  Annuity:
    'Annuity category covers annuity-based road projects. Monitor annuity works in Status and download reports via Excel.',
  'Deposite Funds':
    'Deposit Funds category tracks deposited budget allocations. View details in Status tab under Deposit category.',
  DPDC:
    'DPDC (District Planning & Development Council) funds local development works. Check DPDC projects in the Status tab.',
  GAT_A:
    'GAT A (Grant Aid to Towns - A) covers urban local body grants. View GAT A works in Status under NonPlan(3054).',
  GAT_D:
    'GAT D category covers district-level grant works. Find GAT D projects in the Status tab.',
  GAT_FBC:
    'GAT FBC (Grant Aid to Towns - FBC) covers fire brigade and civic works. Check in Status under Gat_BCF.',
  MLA:
    'MLA fund category covers works sanctioned under MLA local area development. View MLA projects in Status or MLA screen.',
  MP:
    'MP fund category covers Member of Parliament local area development works. View MP projects in Status or MP screen.',
  NonResBuilding:
    'Non-Residential Building (NonPlan 3054) covers non-residential construction works. Check Status tab for updates.',
  ResBuilding:
    'Residential Building (2216) covers residential construction projects. View and update from the Status tab.',
  '2515':
    '2515 is a specific budget head for designated works. Track 2515 projects in the Status tab.',
  All:
    'All category shows combined data across every budget head. Use Excel → All to download a comprehensive report.',
};
