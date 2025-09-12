import type { Task, Alarm, Reminder, PayCard, IdDoc, Note } from './types';

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

export const seedTasks: Task[] = [
  { id: uid('t'), title: 'Call Priya about Stripe retry', priority: 'P1', tag: '#work', due: '15:00', done: false, confidence: 0.96 },
  { id: uid('t'), title: 'Pay electricity bill', priority: 'P1', tag: '#bills', due: 'today', done: false, confidence: 0.98 },
  { id: uid('t'), title: 'Submit quarterly reimbursements', priority: 'P2', tag: '#work', due: 'Fri', done: true, confidence: 0.94 },
  { id: uid('t'), title: 'Book a physio slot for Tuesday', priority: 'P2', tag: '#health', due: 'Tue', done: false, confidence: 0.78 },
  { id: uid('t'), title: 'Move the weekend grocery run earlier', priority: 'P3', tag: '#home', done: false, confidence: 0.72 },
  { id: uid('t'), title: 'Reply to Anand about the seed deck', priority: 'P2', tag: '#work', done: false, confidence: 0.9 },
  { id: uid('t'), title: 'Transfer rent to landlord', priority: 'P1', tag: '#bills', due: '30 Apr', done: false, confidence: 0.99 },
  { id: uid('t'), title: 'Research exponential backoff for retry flow', priority: 'P3', tag: '#eng', done: false, confidence: 0.82 },
];

export const seedAlarms: Alarm[] = [
  { id: uid('a'), time: '06:30', label: 'Wake', days: ['M', 'T', 'W', 'Th', 'F'], recurring: true, enabled: true },
  { id: uid('a'), time: '07:15', label: 'Leave for run', days: ['M', 'W', 'F'], recurring: true, enabled: true },
  { id: uid('a'), time: '09:00', label: 'Standup', days: ['M', 'T', 'W', 'Th', 'F'], recurring: true, enabled: true },
  { id: uid('a'), time: '22:30', label: 'Wind down', days: ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'], recurring: true, enabled: false },
];

export const seedReminders: Reminder[] = [
  { id: uid('r'), at: '14:00', label: 'Clinic appointment' },
  { id: uid('r'), at: '17:30', label: 'Pick up prescription' },
  { id: uid('r'), at: '19:00', label: 'Call mom' },
];

export const seedPayCards: PayCard[] = [
  { id: uid('c'), kind: 'pay', brand: 'visa', cardType: 'credit', last4: '8842', holder: 'AAKASH NARUKULA', expiry: '08/29', issuer: 'HDFC Bank', network: 'Visa', lastUsed: 'Today · Swiggy', confidence: 0.99 },
  { id: uid('c'), kind: 'pay', brand: 'mc',   cardType: 'credit', last4: '4501', holder: 'AAKASH NARUKULA', expiry: '04/27', issuer: 'ICICI Bank', network: 'Mastercard', lastUsed: '2d · Amazon', limitHint: '₹4.2L limit', confidence: 0.97 },
  { id: uid('c'), kind: 'pay', brand: 'other', cardType: 'debit', last4: '9215', holder: 'AAKASH NARUKULA', expiry: '11/28', issuer: 'Axis Bank', network: 'RuPay', lastUsed: '5d · Metro', confidence: 0.82 },
];

export const seedIdDocs: IdDoc[] = [
  { id: uid('d'), kind: 'id', docKind: 'pan', maskedNumber: 'AKPXX····Y', name: 'Aakash Narukula', frontUri: '', lastVerified: 'Mar 2026', confidence: 0.96 },
  { id: uid('d'), kind: 'id', docKind: 'aadhaar', maskedNumber: '···· ···· 9012', name: 'Aakash Narukula', frontUri: '', lastVerified: 'Jan 2026', confidence: 0.91 },
  { id: uid('d'), kind: 'id', docKind: 'dl', maskedNumber: 'TS01 ··········345', name: 'Aakash Narukula', frontUri: '', lastVerified: 'Dec 2025', confidence: 0.88 },
];

export const seedNotes: Note[] = [
  { id: uid('n'), body: 'Exponential backoff, cap at 6 attempts, jitter 10%', tag: '#eng', createdAt: '2026-04-18T10:00:00Z' },
  { id: uid('n'), body: 'Gift for dad — new fountain pen, fine nib', tag: '#personal', createdAt: '2026-04-19T20:14:00Z' },
];
