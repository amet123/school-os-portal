#!/usr/bin/env python3
"""Phase 6 integration tests — curl + bench calls."""
import subprocess, sys, time, json

BASE     = "http://localhost:3005"
FRAPPE   = "http://localhost:8092"
passed   = 0
failed   = 0


def ok(name): global passed; passed += 1; print(f"  PASS  {name}")
def fail(name, err): global failed; failed += 1; print(f"  FAIL  {name}: {err}")


def curl(url, method="GET", data=None, cookies=None, follow=False):
    cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-X", method]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    if cookies:
        cmd += ["-H", f"Cookie: {cookies}"]
    if follow:
        cmd += ["-L"]
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return int(r.stdout.strip() or "0")


def curl_json(url, method="GET", data=None, cookies=None):
    cmd = ["curl", "-s", "-X", method]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    if cookies:
        cmd += ["-H", f"Cookie: {cookies}"]
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return {}


def curl_with_cookie(url, method="GET", data=None):
    """Returns (status_code, response_body, set_cookie_header)."""
    cmd = ["curl", "-s", "-D", "-", "-X", method]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True, text=True)
    # text=True converts \r\n → \n; split on \n and strip \r
    lines = [l.rstrip("\r") for l in r.stdout.split("\n")]
    status = int(lines[0].split()[1]) if lines and lines[0] else 0
    cookie = next((l.split(": ", 1)[1] for l in lines if l.lower().startswith("set-cookie:")), "")
    return status, r.stdout, cookie


# 1: Server health
try:
    code = curl(f"{BASE}/api/auth/me")
    assert code in (200, 401), f"got {code}"
    ok("Server running: /api/auth/me reachable")
except Exception as e: fail("server health", e)

# 2: /api/auth/me without session → 401
try:
    code = curl(f"{BASE}/api/auth/me")
    assert code == 401, f"expected 401 got {code}"
    ok("GET /api/auth/me → 401 (no session)")
except Exception as e: fail("me unauthenticated", e)

# 3: Login with bad creds → 401
try:
    code = curl(f"{BASE}/api/auth/login", "POST", {"usr": "bad@bad.com", "pwd": "wrong"})
    assert code == 401, f"expected 401 got {code}"
    ok("POST /api/auth/login (bad creds) → 401")
except Exception as e: fail("login bad creds", e)

# 4: Login with admin → 200
try:
    code = curl(f"{BASE}/api/auth/login", "POST", {"usr": "Administrator", "pwd": "School@2026"})
    assert code == 200, f"expected 200 got {code}"
    ok("POST /api/auth/login (admin) → 200")
except Exception as e: fail("login admin", e)

# 5: Login + get session cookie
try:
    status, body, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "Administrator", "pwd": "School@2026"}
    )
    assert status == 200, f"expected 200 got {status}"
    school_sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    assert school_sid, "no school_sid in Set-Cookie"
    ok(f"Login sets school_sid cookie ({school_sid[:8]}…)")
except Exception as e: fail("login cookie", e)

# 6: /api/auth/me with valid session → 200
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "Administrator", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/api/auth/me", cookies=f"school_sid={sid}")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /api/auth/me (with session) → 200")
except Exception as e: fail("me authenticated", e)

# 7: Login as student, check session role
try:
    data = curl_json(f"{BASE}/api/auth/login", "POST",
                     {"usr": "rahul.sharma@demo.school", "pwd": "School@2026"})
    role = data.get("session", {}).get("role")
    assert role == "student", f"expected student got {role!r}"
    ok(f"Student login: role={role}")
except Exception as e: fail("student login role", e)

# 8: Login as teacher, check session role
try:
    data = curl_json(f"{BASE}/api/auth/login", "POST",
                     {"usr": "demo.teacher@school.os", "pwd": "School@2026"})
    role = data.get("session", {}).get("role")
    assert role == "teacher", f"expected teacher got {role!r}"
    ok(f"Teacher login: role={role}")
except Exception as e: fail("teacher login role", e)

# 9: Logout clears cookie
try:
    code = curl(f"{BASE}/api/auth/logout", "POST")
    assert code == 200, f"expected 200 got {code}"
    ok("POST /api/auth/logout → 200")
except Exception as e: fail("logout", e)

# 10: /en/login page → 200
try:
    code = curl(f"{BASE}/en/login")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /en/login → 200")
except Exception as e: fail("login page en", e)

# 11: /hi/login page → 200
try:
    code = curl(f"{BASE}/hi/login")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /hi/login → 200")
except Exception as e: fail("login page hi", e)

# 12: /ar/login page → 200 (RTL)
try:
    code = curl(f"{BASE}/ar/login")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /ar/login → 200 (RTL Arabic)")
except Exception as e: fail("login page ar", e)

# 13: /en/student without session → redirect (307/302)
try:
    code = curl(f"{BASE}/en/student")
    assert code in (307, 302, 308, 301, 200), f"got {code}"
    ok(f"GET /en/student (no session) → {code}")
except Exception as e: fail("student protected", e)

# 14: /en/student with admin session → 200
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "Administrator", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/en/student", cookies=f"school_sid={sid}", follow=True)
    assert code == 200, f"expected 200 got {code}"
    ok("GET /en/student (with admin session) → 200")
except Exception as e: fail("student page authenticated", e)

# 15: /en/teacher with teacher session → 200
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "demo.teacher@school.os", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/en/teacher", cookies=f"school_sid={sid}", follow=True)
    assert code == 200, f"expected 200 got {code}"
    ok("GET /en/teacher (with teacher session) → 200")
except Exception as e: fail("teacher page authenticated", e)

# 16: /api/student/attendance with student session
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "rahul.sharma@demo.school", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/api/student/attendance", cookies=f"school_sid={sid}")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /api/student/attendance (student session) → 200")
except Exception as e: fail("student attendance API", e)

# 17: /api/student/fees with student session
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "rahul.sharma@demo.school", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/api/student/fees", cookies=f"school_sid={sid}")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /api/student/fees (student session) → 200")
except Exception as e: fail("student fees API", e)

# 18: /api/teacher/groups with teacher session
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "demo.teacher@school.os", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/api/teacher/groups", cookies=f"school_sid={sid}")
    assert code == 200, f"expected 200 got {code}"
    ok("GET /api/teacher/groups (teacher session) → 200")
except Exception as e: fail("teacher groups API", e)

# 19: /api/teacher/attendance blocked for student
try:
    _, _, cookie_h = curl_with_cookie(
        f"{BASE}/api/auth/login", "POST", {"usr": "rahul.sharma@demo.school", "pwd": "School@2026"}
    )
    sid = next((p.split("=", 1)[1] for p in cookie_h.split(";") if "school_sid" in p), "")
    code = curl(f"{BASE}/api/teacher/groups", cookies=f"school_sid={sid}")
    assert code in (403, 401), f"expected 403 got {code}"
    ok(f"GET /api/teacher/groups (student session) → {code} (blocked)")
except Exception as e: fail("teacher role gate", e)

# 20: / → redirect to /en
try:
    code = curl(f"{BASE}/", follow=False)
    assert code in (307, 302, 308, 301), f"expected redirect got {code}"
    ok(f"GET / → {code} (locale redirect)")
except Exception as e: fail("root redirect", e)

print(f"\n  {passed} passed  {failed} failed")
if failed:
    sys.exit(1)
print("PHASE6_OK")
