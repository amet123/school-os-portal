# School OS — Next.js Portal

Next.js 14 App Router front-end for School OS. Serves four portal personas — student, parent, teacher, admin — each with their own layout, pages, and BFF API routes.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **i18n**: next-intl (en / ar RTL)
- **Port**: 3005
- **Auth**: httpOnly `school_sid` cookie; BFF proxies all Frappe calls

## Running

```bash
npm run build
node node_modules/.bin/next start --port 3005
```

Or for dev:

```bash
npm run dev -- --port 3005
```

## Portal Personas & Pages

### Student (`/[locale]/student/`)
| Path | Description |
|------|-------------|
| `/student` | **Dashboard** — attendance %, fee balance, next class, homework due, upcoming events, recent results, books on loan, certificates |
| `/student/timetable` | Weekly timetable |
| `/student/homework` | Homework list + submit |
| `/student/attendance` | Attendance log |
| `/student/report-card` | Report cards |
| `/student/exams` | Exam results |
| `/student/library` | Library — browse + loans |
| `/student/calendar` | School calendar |
| `/student/payment` | Online payment checkout |
| `/student/certificates` | Certificate request + status |
| `/student/events` | School events |

### Parent (`/[locale]/parent/`)
| Path | Description |
|------|-------------|
| `/parent` | Parent home |
| `/parent/[student]` | Child progress overview |
| `/parent/fees` | **Fee Statement** — ledger + payment history |
| `/parent/health` | Child health records + nurse visits |
| `/parent/discipline` | Incident history |
| `/parent/ptm` | Book PTM slots |
| `/parent/admissions` | Admissions application |
| `/parent/announcements` | School announcements |
| `/parent/messages` | Teacher messaging |
| `/parent/transport` | Transport assignment |
| `/parent/calendar` | School calendar |

### Teacher (`/[locale]/teacher/`)
| Path | Description |
|------|-------------|
| `/teacher` | Teacher home |
| `/teacher/timetable` | My schedule |
| `/teacher/homework` | Set + review homework |
| `/teacher/attendance` | Mark attendance |
| `/teacher/report-card` | Enter grades |
| `/teacher/exams` | Exam management |
| `/teacher/library` | Library |
| `/teacher/announcements` | Post announcements |
| `/teacher/messages` | Parent messaging |
| `/teacher/leave` | Leave requests |
| `/teacher/payslip` | Salary payslips |
| `/teacher/ptm` | PTM appointments |
| `/teacher/discipline` | Log + track incidents |
| `/teacher/directory` | **Staff Directory** — browse staff, today's schedule, subjects |
| `/teacher/calendar` | School calendar |

### Admin (`/[locale]/admin/`)
| Path | Description |
|------|-------------|
| `/admin` | Admin home |
| `/admin/calendar` | **Academic Calendar** — create/edit/delete events |
| `/admin/certificates` | Certificate approve/issue workflow |
| `/admin/fees` | **Fee Overview** — collection %, by category, defaulters, student lookup |
| `/admin/health` | School nurse dashboard — profiles, visits, allergy alerts |
| `/admin/discipline` | Incident board — review, escalate, actions |
| `/admin/ptm` | PTM session management |
| `/admin/admissions` | Admissions Kanban |
| `/admin/leaves` | Staff leave board |
| `/admin/concessions` | Fee concessions |
| `/admin/students` | **Student 360 Lookup** — health alerts, guardians, attendance, results, open incidents, transport |

## BFF Architecture

Every page talks to `/app/api/*/route.ts` handlers which:
1. Read `school_sid` from httpOnly cookie
2. Call `getPortalSession(sid)` to validate the Frappe session
3. Proxy to `callFrappe(endpoint, RequestInit, sid)` → `http://erpnext-backend-1:8000`
4. Return JSON to the client

**Key**: `callFrappe(endpoint, options: RequestInit, sid)` — the second arg is `RequestInit`. To pass data to Frappe whitelist endpoints, encode as URL query params:
```typescript
const qs = new URLSearchParams({data: JSON.stringify(payload)}).toString();
const res = await callFrappe(`/api/method/school_os.api.foo.bar?${qs}`, {}, sid);
```

## Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CalendarView` | `components/CalendarView.tsx` | Month-grouped event timeline used by parent/teacher/student/admin calendar |

## Seeded Logins

| Role | Email | Password |
|------|-------|----------|
| Student | student@greenfield.test | Student@2026 |
| Parent | parent@greenfield.test | Parent@2026 |
| Teacher | teacher@greenfield.test | Teacher@2026 |
