import os
import sys

# Ensure project root is on sys.path so we can import app.py
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import app as flask_app  # noqa: E402

# Vercel Python runtime looks for a module-level `app`
app = flask_app
