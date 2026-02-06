import {
  addDoc,
  collection,
  getCountFromServer,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  formatDateYYYYMMDD,
  formatTimeHHMMSS,
  getDiaSemanaPt,
  startOfDay,
  endOfDay
} from '../utils/date';

const FEEDBACK_COL = 'feedback';

function nextLocalSuffixForMs(ms) {
  const key = 'feedback_id_ms_v1';
  const raw = localStorage.getItem(key);
  let state;
  try {
    state = raw ? JSON.parse(raw) : null;
  } catch {
    state = null;
  }
  const lastMs = state?.ms;
  const lastN = state?.n;

  let n = 0;
  if (typeof lastMs === 'number' && lastMs === ms && typeof lastN === 'number') {
    n = (lastN + 1) % 1000;
  }

  localStorage.setItem(key, JSON.stringify({ ms, n }));
  return n;
}

function generateNumericId(clientDate) {
  // 13 digits ms + 3 digits suffix => 16-digit numeric id.
  // Ex: 1700000000000 042
  const ms = clientDate.getTime();
  const suffix = nextLocalSuffixForMs(ms);
  return ms * 1000 + suffix;
}

async function safeCount(q) {
  try {
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    const snap = await getDocs(q);
    return snap.size;
  }
}

export function feedbackCollection() {
  return collection(db, FEEDBACK_COL);
}

export async function getLastFeedback() {
  const lastQ = query(feedbackCollection(), orderBy('timestamp', 'desc'), limit(1));
  const snap = await getDocs(lastQ);
  const lastDoc = snap.docs[0];
  if (!lastDoc) return null;
  const data = lastDoc.data() || {};
  return { ...data, docId: lastDoc.id };
}

export async function getFeedbackById(docId) {
  if (!docId) return null;
  const ref = doc(feedbackCollection(), String(docId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  return { ...data, docId: snap.id };
}

export async function getAvailableDates({ maxScan = 2000 } = {}) {
  // Firestore não tem DISTINCT: vamos varrer uma amostra recente e extrair datas únicas.
  const snap = await getDocs(
    query(feedbackCollection(), orderBy('timestamp', 'desc'), limit(maxScan))
  );
  const set = new Set();
  for (const d of snap.docs) {
    const data = d.data()?.data;
    if (typeof data === 'string' && data) set.add(data);
  }
  return Array.from(set).sort();
}

function pctVariation(p1, p2) {
  const a = Number(p1 || 0);
  const b = Number(p2 || 0);
  if (a === 0) return b === 0 ? 0 : 100;
  return Math.round(((b - a) / a) * 100);
}

async function countsForRange(start, end) {
  const base = [where('timestamp', '>=', start), where('timestamp', '<=', end)];
  const msQ = query(
    feedbackCollection(),
    ...base,
    where('grau_satisfacao', '==', 'muito_satisfeito')
  );
  const sQ = query(feedbackCollection(), ...base, where('grau_satisfacao', '==', 'satisfeito'));
  const iQ = query(
    feedbackCollection(),
    ...base,
    where('grau_satisfacao', '==', 'insatisfeito')
  );
  const [ms, s, i] = await Promise.all([safeCount(msQ), safeCount(sQ), safeCount(iQ)]);
  return { muito_satisfeito: ms, satisfeito: s, insatisfeito: i, total: ms + s + i };
}

export async function comparePeriods(p1StartStr, p1EndStr, p2StartStr, p2EndStr) {
  const p1Start = startOfDay(new Date(p1StartStr));
  const p1End = endOfDay(new Date(p1EndStr));
  const p2Start = startOfDay(new Date(p2StartStr));
  const p2End = endOfDay(new Date(p2EndStr));

  const [periodo1, periodo2] = await Promise.all([
    countsForRange(p1Start, p1End),
    countsForRange(p2Start, p2End)
  ]);

  const variacao = {
    muito_satisfeito: pctVariation(periodo1.muito_satisfeito, periodo2.muito_satisfeito),
    satisfeito: pctVariation(periodo1.satisfeito, periodo2.satisfeito),
    insatisfeito: pctVariation(periodo1.insatisfeito, periodo2.insatisfeito),
    total: pctVariation(periodo1.total, periodo2.total)
  };

  return { periodo1, periodo2, variacao };
}

export async function submitFeedback(grau, { clientDate } = {}) {
  const now = clientDate instanceof Date ? clientDate : new Date();
  const payload = {
    id: generateNumericId(now),
    grau_satisfacao: grau,
    data: formatDateYYYYMMDD(now),
    hora: formatTimeHHMMSS(now),
    dia_semana: getDiaSemanaPt(now),
    timestamp: serverTimestamp(),
    clientTimestamp: now.toISOString()
  };

  const docRef = await addDoc(feedbackCollection(), payload);
  return { ...payload, docId: docRef.id };
}

export async function getPublicSummary() {
  const today = formatDateYYYYMMDD(new Date());

  const total = await safeCount(query(feedbackCollection()));

  const msQ = query(
    feedbackCollection(),
    where('data', '==', today),
    where('grau_satisfacao', '==', 'muito_satisfeito')
  );
  const sQ = query(
    feedbackCollection(),
    where('data', '==', today),
    where('grau_satisfacao', '==', 'satisfeito')
  );
  const iQ = query(
    feedbackCollection(),
    where('data', '==', today),
    where('grau_satisfacao', '==', 'insatisfeito')
  );

  const todayCounts = {
    muito_satisfeito: await safeCount(msQ),
    satisfeito: await safeCount(sQ),
    insatisfeito: await safeCount(iQ)
  };
  const todayTotal =
    todayCounts.muito_satisfeito + todayCounts.satisfeito + todayCounts.insatisfeito;

  const lastQ = query(feedbackCollection(), orderBy('timestamp', 'desc'), limit(1));
  let lastId = null;
  try {
    const lastSnap = await getDocs(lastQ);
    const lastDoc = lastSnap.docs[0];
    lastId = lastDoc ? lastDoc.id : null;
  } catch {
    lastId = null;
  }

  return {
    date: today,
    today: todayCounts,
    todayTotal,
    total,
    lastId
  };
}

export async function getTotalsAllTime() {
  const msQ = query(feedbackCollection(), where('grau_satisfacao', '==', 'muito_satisfeito'));
  const sQ = query(feedbackCollection(), where('grau_satisfacao', '==', 'satisfeito'));
  const iQ = query(feedbackCollection(), where('grau_satisfacao', '==', 'insatisfeito'));

  return {
    muito_satisfeito: await safeCount(msQ),
    satisfeito: await safeCount(sQ),
    insatisfeito: await safeCount(iQ),
    total: await safeCount(query(feedbackCollection()))
  };
}

export async function getTotalsForDay(dateStr) {
  const msQ = query(
    feedbackCollection(),
    where('data', '==', dateStr),
    where('grau_satisfacao', '==', 'muito_satisfeito')
  );
  const sQ = query(
    feedbackCollection(),
    where('data', '==', dateStr),
    where('grau_satisfacao', '==', 'satisfeito')
  );
  const iQ = query(
    feedbackCollection(),
    where('data', '==', dateStr),
    where('grau_satisfacao', '==', 'insatisfeito')
  );

  return {
    muito_satisfeito: await safeCount(msQ),
    satisfeito: await safeCount(sQ),
    insatisfeito: await safeCount(iQ)
  };
}

export async function getTotalsForRange(startDateStr, endDateStr, grau) {
  const start = startOfDay(new Date(startDateStr));
  const end = endOfDay(new Date(endDateStr));

  const clauses = [
    where('timestamp', '>=', start),
    where('timestamp', '<=', end)
  ];
  if (grau) clauses.push(where('grau_satisfacao', '==', grau));

  const q1 = query(feedbackCollection(), ...clauses);
  return await safeCount(q1);
}
