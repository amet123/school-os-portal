/**
 * Server-side Frappe API client.
 * [GUARDRAIL] Never call Frappe from the browser — always go through BFF routes.
 */

const FRAPPE_URL = process.env.FRAPPE_URL ?? 'http://localhost:8092';

export interface FrappeResponse<T> {
  message: T;
  exc_type?: string;
  exception?: string;
}

export interface PortalSession {
  role: 'student' | 'teacher' | 'admin';
  user: string;
  display_name: string;
  student?: {
    name: string;
    student_name: string;
    region_company: string;
    preferred_locale?: string;
  };
}

/** Make an authenticated call to Frappe (server-side only). */
export async function callFrappe<T>(
  endpoint: string,
  options: RequestInit = {},
  sid?: string,
): Promise<FrappeResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (sid) headers['Cookie'] = `sid=${sid}`;

  const res = await fetch(`${FRAPPE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 403) {
    throw new FrappeAuthError(res.status);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Frappe ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<FrappeResponse<T>>;
}

export class FrappeAuthError extends Error {
  status: number;
  constructor(status: number) {
    super('Frappe auth error');
    this.status = status;
  }
}

/** Login to Frappe, return sid cookie value. */
export async function frappeLogin(usr: string, pwd: string): Promise<string> {
  const res = await fetch(`${FRAPPE_URL}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usr, pwd }),
    redirect: 'manual',
  });

  if (!res.ok && res.status !== 302 && res.status !== 200) {
    throw new Error('Login failed');
  }

  const setCookie = res.headers.get('set-cookie') ?? '';
  const sidMatch  = setCookie.match(/\bsid=([^;,\s]+)/);
  const sid       = sidMatch?.[1];

  if (!sid || sid === 'Guest') {
    throw new Error('Invalid credentials');
  }
  return sid;
}

/** Get portal session for a given Frappe sid. */
export async function getPortalSession(sid: string): Promise<PortalSession | null> {
  try {
    const res = await callFrappe<PortalSession>(
      '/api/method/school_os.api.portal.get_portal_session',
      {},
      sid,
    );
    return res.message;
  } catch {
    return null;
  }
}

/** Get student attendance summary. */
export async function getStudentAttendance(student: string, sid: string) {
  const res = await callFrappe<Record<string, unknown>>(
    `/api/method/school_os.api.attendance.get_attendance_summary?student=${encodeURIComponent(student)}`,
    {},
    sid,
  );
  return res.message;
}

/** Get fee statement for a student. */
export async function getFeeStatement(student: string, sid: string) {
  const res = await callFrappe<unknown>(
    `/api/method/school_os.api.fees.get_fee_statement?student=${encodeURIComponent(student)}`,
    {},
    sid,
  );
  return res.message;
}

/** Get class roster for a student group. */
export async function getRoster(studentGroup: string, sid: string) {
  const res = await callFrappe<unknown>(
    `/api/method/school_os.api.enrollment.get_class_roster?student_group=${encodeURIComponent(studentGroup)}`,
    {},
    sid,
  );
  return res.message;
}

/** Mark attendance for a student group. */
export async function markAttendance(
  studentGroup: string,
  date: string,
  attendance: {student: string; status: string}[],
  sid: string,
) {
  const res = await callFrappe<unknown>(
    '/api/method/school_os.api.attendance.mark_attendance',
    {
      method: 'POST',
      body: JSON.stringify({student_group: studentGroup, date, attendance}),
    },
    sid,
  );
  return res.message;
}

/** Get all student groups (for teacher to select from). */
export async function getStudentGroups(sid: string) {
  const res = await callFrappe<{name: string; student_group_name: string}[]>(
    '/api/method/school_os.api.attendance.get_student_groups',
    {},
    sid,
  );
  return (res.message as {name: string; student_group_name: string}[]) ?? [];
}
