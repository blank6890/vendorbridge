"""Verify P0 security fixes without requiring MongoDB for route/RBAC checks."""
import jwt
from datetime import datetime, timedelta, timezone

from config import JWT_ALGORITHM, JWT_SECRET
from app import app


def make_token(role):
    payload = {
        "userId": "test",
        "email": f"{role}@test.com",
        "role": role,
        "name": "Test",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


print("=== Route map (key paths) ===")
expected = [
    ("GET", "/api/vendors"),
    ("GET", "/api/rfq"),
    ("GET", "/api/admin/users"),
    ("GET", "/api/reports/export"),
    ("POST", "/api/approvals/approve/fake"),
]
adapter = app.url_map.bind("localhost")
for method, path in expected:
    try:
        endpoint, _ = adapter.match(path, method=method)
        print(f"OK  {method} {path} -> {endpoint}")
    except Exception as exc:
        print(f"FAIL {method} {path} -> {exc}")

print("\n=== RBAC without DB (expect 403 before DB) ===")
client = app.test_client()
vendor_headers = {"Authorization": f"Bearer {make_token('vendor')}"}
admin_headers = {"Authorization": f"Bearer {make_token('admin')}"}

r = client.post("/api/approvals/approve/507f1f77bcf86cd799439011", headers=vendor_headers)
print(f"vendor approve -> {r.status_code} {r.get_json()}")

r = client.get("/api/admin/users", headers=vendor_headers)
print(f"vendor admin users -> {r.status_code} {r.get_json()}")

r = client.get("/logs", headers=vendor_headers)
print(f"vendor logs -> {r.status_code} {r.get_json()}")

r = client.post(
    "/api/auth/register",
    json={
        "name": "Evil Admin",
        "email": "evil@test.com",
        "password": "password123",
        "role": "admin",
    },
)
print(f"register as admin -> {r.status_code} {r.get_json()}")
