import os
import sys

from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "vendorbridge")

_DEFAULT_JWT_SECRET = "vendorbridge-super-secret-key-change-in-prod"
JWT_SECRET = os.getenv("JWT_SECRET", _DEFAULT_JWT_SECRET)
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() in ("1", "true", "yes")
FLASK_ENV = os.getenv("FLASK_ENV", "development")

MAIL_EMAIL = os.getenv("MAIL_EMAIL", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")

if FLASK_ENV == "production" and (
    not os.getenv("JWT_SECRET") or JWT_SECRET == _DEFAULT_JWT_SECRET
):
    print("FATAL: Set a strong JWT_SECRET environment variable in production.", file=sys.stderr)
    sys.exit(1)
