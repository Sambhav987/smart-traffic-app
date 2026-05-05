"""
Direct FCM (no Expo relay). Drop these pieces into your Django project to:
  (a) accept FCM device tokens from the mobile app
  (b) send notifications on specific events via firebase-admin

Install once:
    pip install firebase-admin

One-time Firebase setup:
  Firebase Console → ⚙️ Project Settings → Service accounts tab
  → "Generate new private key" → save the JSON somewhere outside the repo,
  e.g.  D:\\secrets\\smart-traffic-firebase-admin.json
  Reference its path in settings.py (see step 6) — or via an env var.

================================================================
1) models.py  (add to any Django app, e.g. `core`)
================================================================
from django.db import models

class PushToken(models.Model):
    token = models.CharField(max_length=500, unique=True)
    platform = models.CharField(max_length=20, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.token[:32] + "…"


================================================================
2) views.py  (registration endpoint the mobile app calls on launch)
================================================================
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import PushToken

@csrf_exempt
@require_POST
def register_push_token(request):
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid json"}, status=400)

    token = body.get("token")
    if not token:
        return JsonResponse({"error": "token required"}, status=400)

    PushToken.objects.update_or_create(
        token=token,
        defaults={"platform": body.get("platform", "")},
    )
    return JsonResponse({"ok": True})


================================================================
3) urls.py  (project-level)
================================================================
from django.urls import path
from core.views import register_push_token

urlpatterns = [
    # ... your existing routes ...
    path("api/push-tokens/register/", register_push_token),
]


================================================================
4) services/push.py  (helper you call from anywhere on an event)
================================================================
import os
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
from .models import PushToken  # adjust import to your app

# Initialize the Firebase Admin SDK exactly once per process.
if not firebase_admin._apps:
    cred_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", None) \\
        or os.environ.get("FIREBASE_CREDENTIALS_PATH")
    if not cred_path:
        raise RuntimeError(
            "Set FIREBASE_CREDENTIALS_PATH (in settings.py or env) to the "
            "Firebase service account JSON file."
        )
    firebase_admin.initialize_app(credentials.Certificate(cred_path))


def send_push(title, body, data=None):
    \"\"\"Send an FCM push to every registered device. Prunes invalid tokens.\"\"\"
    tokens = list(PushToken.objects.values_list("token", flat=True))
    if not tokens:
        print("[push] no tokens registered")
        return

    # FCM data payloads must be string-to-string.
    data_payload = {k: str(v) for k, v in (data or {}).items()}

    message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(title=title, body=body),
        data=data_payload,
        android=messaging.AndroidConfig(priority="high"),
    )
    response = messaging.send_each_for_multicast(message)
    print(f"[push] sent: success={response.success_count} failure={response.failure_count}")

    # Clean up tokens FCM rejected as no-longer-valid.
    for token, resp in zip(tokens, response.responses):
        if not resp.success:
            err = resp.exception
            code = getattr(err, "code", "") or ""
            if code in ("registration-token-not-registered", "invalid-argument"):
                PushToken.objects.filter(token=token).delete()
                print(f"[push] removed invalid token: {token[:20]}…")
            else:
                print(f"[push] error for {token[:20]}…: {err}")


================================================================
5) settings.py  (point Django at the service account JSON)
================================================================
# Adjust path. Do NOT commit this JSON to git.
FIREBASE_CREDENTIALS_PATH = r"D:\\secrets\\smart-traffic-firebase-admin.json"


================================================================
6) Use it on any event
================================================================
from core.services.push import send_push

def on_accident_detected(intersection_id, intersection_name):
    send_push(
        title="Accident detected",
        body=f"At {intersection_name}",
        data={
            "intersectionId": intersection_id,
            "intersectionName": intersection_name,
        },
    )

# The mobile app's notification listener already navigates to
# IntersectionDetails when the tapped notification's data includes
# `intersectionId`.

================================================================
Migrations
================================================================
python manage.py makemigrations
python manage.py migrate

================================================================
Quick test from Django shell
================================================================
python manage.py shell
>>> from core.services.push import send_push
>>> send_push("Hello", "Test from Django",
...           {"intersectionId": 1, "intersectionName": "Intersection 1"})
"""
