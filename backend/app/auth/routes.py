import datetime
import os
import random
import smtplib
import ssl
from email.message import EmailMessage
from typing import Optional, Tuple

import bcrypt
import jwt
from flask import jsonify, request

from . import auth_bp
from .supabase_client import supabase

# In-memory store for pending registrations: { email: {data, otp_hash, expires_at} }
_pending_regs = {}

# Config
JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
OTP_EXP_MINUTES = int(os.getenv("OTP_EXP_MINUTES", "10"))
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
GMAIL_FROM_NAME = os.getenv("GMAIL_FROM_NAME", "MedSync")

# Mail-style configs (preferred if provided)
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "465"))
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "False").lower() == "true"
MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "True").lower() == "true"
MAIL_USERNAME = os.getenv("MAIL_USERNAME", GMAIL_USER)
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", GMAIL_APP_PASSWORD)
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME or GMAIL_USER)

USER_CODE_FIELD = os.getenv("USER_CODE_FIELD", "user_code")
_USER_CODE_SUPPORTED = True  # flip to False on first detected missing column error


def _generate_otp() -> str:
    """Return a 6-digit numeric OTP as a string."""
    return f"{random.randint(100000, 999999)}"


def _send_otp_email(to_email: str, otp: str) -> None:
    """Send the OTP email via Gmail SMTP. Raises on failure."""
    username = MAIL_USERNAME or GMAIL_USER
    password = MAIL_PASSWORD or GMAIL_APP_PASSWORD
    if not username or not password:
        raise RuntimeError(
            "Missing mail credentials. Set MAIL_USERNAME/MAIL_PASSWORD or GMAIL_USER/GMAIL_APP_PASSWORD."
        )
    subject = f"{GMAIL_FROM_NAME} Email Verification Code"
    body = (
        f"Your verification code is: {otp}\n\n"
        f"This code expires in {OTP_EXP_MINUTES} minutes.\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )
    msg = EmailMessage()
    msg["Subject"] = subject
    from_email = MAIL_DEFAULT_SENDER or username
    msg["From"] = f"{GMAIL_FROM_NAME} <{from_email}>"
    msg["To"] = to_email
    msg.set_content(body)

    context = ssl.create_default_context()
    # Prefer TLS if explicitly enabled, else SSL; fallback to SSL 465
    if MAIL_USE_TLS:
        port = MAIL_PORT or 587
        with smtplib.SMTP(MAIL_SERVER, port) as server:
            server.starttls(context=context)
            server.login(username, password)
            server.send_message(msg)
    else:
        port = MAIL_PORT or 465
        with smtplib.SMTP_SSL(MAIL_SERVER, port, context=context) as server:
            server.login(username, password)
            server.send_message(msg)


def _role_prefix(role: str) -> Optional[str]:
    mapping = {
        "Patient": "P",
        "Doctor": "D",
        "Staff": "S",
        "Pharmacy": "PH",
    }
    return mapping.get(role)


def _code_exists_in_db(code: str) -> bool:
    """Check if a generated user code exists in DB. If column missing, mark unsupported and return False."""
    global _USER_CODE_SUPPORTED
    if not _USER_CODE_SUPPORTED:
        return False
    try:
        # Try to select by the user code field; if the column doesn't exist, PostgREST returns an error.
        result = (
            supabase.table("users")
            .select("id")
            .eq(USER_CODE_FIELD, code)
            .limit(1)
            .execute()
        )
        error = (
            getattr(result, "error", None)
            if hasattr(result, "error")
            else result.get("error")
            if isinstance(result, dict)
            else None
        )
        data_out = (
            getattr(result, "data", None)
            if hasattr(result, "data")
            else result.get("data")
            if isinstance(result, dict)
            else None
        )
        if error:
            msg = getattr(error, "message", str(error))
            if USER_CODE_FIELD in msg and "column" in msg.lower():
                _USER_CODE_SUPPORTED = False
                return False
            # For other errors, assume not exists to avoid blocking registration
            return False
        return bool(data_out)
    except Exception:
        # On any unexpected error, avoid blocking; assume not exists
        return False


def _generate_unique_user_code(role: str) -> Tuple[str, bool]:
    """Generate a unique role-based code like P0001, D1234, PH0456. Returns (code, persisted_supported)."""
    prefix = _role_prefix(role)
    if not prefix:
        return ("", False)
    # Try up to N attempts for uniqueness if column is supported
    for _ in range(20):
        number = random.randint(1, 9999)
        code = f"{prefix}{number:04d}"
        if not _code_exists_in_db(code):
            return (code, _USER_CODE_SUPPORTED)
    # Fallback to time-based suffix if unlucky
    ts = datetime.datetime.utcnow().strftime("%H%M%S")
    code = f"{prefix}{ts[-4:]}"
    return (code, _USER_CODE_SUPPORTED)


def _send_account_email(
    to_email: str,
    full_name: str,
    role: str,
    code: Optional[str],
    department: Optional[str] = None,
) -> None:
    """Send a post-registration email with login details including the user code."""
    username = MAIL_USERNAME or GMAIL_USER
    password = MAIL_PASSWORD or GMAIL_APP_PASSWORD
    if not username or not password:
        # If email credentials are not configured, silently skip to avoid blocking registration
        return

    subject = f"{GMAIL_FROM_NAME} Registration Successful"
    lines = [
        f"Hi {full_name},",
        "",
        "Your MedSync account has been created successfully.",
    ]
    if role:
        lines.append(f"Role: {role}")
    if department:
        lines.append(f"Department: {department}")
    if code:
        lines.append(f"Login ID (User Code): {code}")
    lines.extend(
        [
            "",
            "How to login:",
            "- Use your email OR the above User Code as the identifier.",
            "- Use the password you set during registration.",
            "",
            "If you didn't create this account, please contact support immediately.",
        ]
    )

    body = "\n".join(lines)

    msg = EmailMessage()
    msg["Subject"] = subject
    from_email = MAIL_DEFAULT_SENDER or username
    msg["From"] = f"{GMAIL_FROM_NAME} <{from_email}>"
    msg["To"] = to_email
    msg.set_content(body)

    context = ssl.create_default_context()
    if MAIL_USE_TLS:
        port = MAIL_PORT or 587
        with smtplib.SMTP(MAIL_SERVER, port) as server:
            server.starttls(context=context)
            server.login(username, password)
            server.send_message(msg)
    else:
        port = MAIL_PORT or 465
        with smtplib.SMTP_SSL(MAIL_SERVER, port, context=context) as server:
            server.login(username, password)
            server.send_message(msg)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return {
            "message": "POST full_name, email, password, role, (department if Doctor). You'll receive an OTP to verify email before account creation."
        }
    data = request.get_json(force=True, silent=True) or {}
    required = ["full_name", "email", "password", "role"]
    valid_roles = ["Patient", "Doctor", "Staff", "Pharmacy"]
    valid_departments = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "General OPD"]
    if not all(k in data and data[k] for k in required):
        return {
            "error": f"Missing fields: {', '.join([k for k in required if not data.get(k)])}"
        }, 400
    if data["role"] not in valid_roles:
        return {"error": "Invalid role."}, 400
    department = data.get("department")
    if data["role"] == "Doctor":
        if not department:
            return {"error": "Department is required for Doctor role."}, 400
        if department not in valid_departments:
            return {"error": "Invalid department."}, 400
    else:
        department = None
    try:
        # Prepare OTP and pending registration
        otp = _generate_otp()
        otp_hash = bcrypt.hashpw(otp.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(
            minutes=OTP_EXP_MINUTES
        )

        # Hash password now; we won't store plaintext in memory
        hashed_password = bcrypt.hashpw(
            data["password"].encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        _pending_regs[data["email"]] = {
            "full_name": data["full_name"],
            "email": data["email"],
            "password": hashed_password,
            "role": data["role"],
            "department": department,
            "otp_hash": otp_hash,
            "expires_at": expires_at,
        }

        # Send OTP email
        _send_otp_email(data["email"], otp)

        return {
            "message": f"OTP sent to {data['email']}. Please verify within {OTP_EXP_MINUTES} minutes via /api/auth/verify-otp.",
        }, 200
    except Exception as e:
        # On failure, clean pending entry
        _pending_regs.pop(data.get("email", ""), None)
        return {"error": str(e)}, 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    # Accept either email or user code as identifier
    identifier = (
        data.get("identifier")
        or data.get("email")
        or data.get("user_code")
        or data.get("code")
        or data.get("login")
        or data.get("id")
    )
    password = data.get("password")
    if not identifier or not password:
        return {
            "error": "Identifier (email or user code) and password are required."
        }, 400
    try:
        # Determine whether identifier is an email or a role-based user code
        is_email = "@" in identifier
        if is_email:
            result = (
                supabase.table("users").select("*").eq("email", identifier).execute()
            )
        else:
            try:
                result = (
                    supabase.table("users")
                    .select("*")
                    .eq(USER_CODE_FIELD, identifier)
                    .execute()
                )
            except Exception as qe:
                return {
                    "error": f"Login by user code is not available. Ensure '{USER_CODE_FIELD}' column exists in users table.",
                    "details": str(qe),
                }, 400
        error = (
            getattr(result, "error", None)
            if hasattr(result, "error")
            else result.get("error")
            if isinstance(result, dict)
            else None
        )
        data_out = (
            getattr(result, "data", None)
            if hasattr(result, "data")
            else result.get("data")
            if isinstance(result, dict)
            else None
        )
        if error:
            msg = getattr(error, "message", str(error))
            # If trying to login by code and column missing
            if not is_email and USER_CODE_FIELD in msg and "column" in msg.lower():
                return {
                    "error": f"Login by user code is not available. Add '{USER_CODE_FIELD}' column to users table."
                }, 400
            return {"error": msg}, 400
        if not data_out or not isinstance(data_out, list) or not data_out:
            return {"error": "User not found."}, 404
        user = data_out[0]
        if not bcrypt.checkpw(
            password.encode("utf-8"), user["password"].encode("utf-8")
        ):
            return {"error": "Invalid password."}, 401
        payload = {
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user.get("full_name"),  # Add full_name to JWT payload
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        user.pop("password", None)
        return {"message": "Login successful.", "user": user, "token": token}, 200
    except Exception as e:
        return {"error": str(e)}, 500


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get("email")
    otp = data.get("otp")
    if not email or not otp:
        return {"error": "Email and otp are required."}, 400

    pending = _pending_regs.get(email)
    if not pending:
        return {
            "error": "No pending registration found for this email or it has expired."
        }, 404
    # Check expiration
    if datetime.datetime.utcnow() > pending["expires_at"]:
        _pending_regs.pop(email, None)
        return {"error": "OTP expired. Please register again."}, 400
    # Validate OTP
    if not bcrypt.checkpw(otp.encode("utf-8"), pending["otp_hash"].encode("utf-8")):
        return {"error": "Invalid OTP."}, 401

    # Passed verification: create user in Supabase
    insert_data = {
        "full_name": pending["full_name"],
        "email": pending["email"],
        "password": pending["password"],
        "role": pending["role"],
    }
    if pending.get("department"):
        insert_data["department"] = pending["department"]

    # Generate role-based code
    code, supported = _generate_unique_user_code(pending["role"])
    note = None
    if code:
        insert_data[USER_CODE_FIELD] = code

    try:
        result = supabase.table("users").insert(insert_data).execute()
        error = (
            getattr(result, "error", None)
            if hasattr(result, "error")
            else result.get("error")
            if isinstance(result, dict)
            else None
        )
        data_out = (
            getattr(result, "data", None)
            if hasattr(result, "data")
            else result.get("data")
            if isinstance(result, dict)
            else None
        )
        if error:
            # If column missing, retry without user code
            msg = getattr(error, "message", str(error))
            if code and USER_CODE_FIELD in msg and "column" in msg.lower():
                try:
                    insert_data.pop(USER_CODE_FIELD, None)
                    retry = supabase.table("users").insert(insert_data).execute()
                    retry_error = (
                        getattr(retry, "error", None)
                        if hasattr(retry, "error")
                        else retry.get("error")
                        if isinstance(retry, dict)
                        else None
                    )
                    data_out = (
                        getattr(retry, "data", None)
                        if hasattr(retry, "data")
                        else retry.get("data")
                        if isinstance(retry, dict)
                        else None
                    )
                    if retry_error:
                        return {
                            "error": getattr(retry_error, "message", str(retry_error))
                        }, 400
                    note = f"Note: '{USER_CODE_FIELD}' column not found in users table. The generated code '{code}' was not saved. Add this column to persist it."
                except Exception as ie:
                    return {"error": str(ie)}, 500
            else:
                return {"error": msg}, 400

        if not data_out or not isinstance(data_out, list) or not data_out:
            return {"error": "No user returned from Supabase."}, 500

        user = data_out[0]
        _pending_regs.pop(email, None)
        user.pop("password", None)
        # Attempt to email the user their login code and details (non-blocking)
        email_status = "skipped"
        try:
            code_to_send = user.get(USER_CODE_FIELD) if isinstance(user, dict) else None
            if not code_to_send:
                code_to_send = code
            _send_account_email(
                to_email=email,
                full_name=pending["full_name"],
                role=pending["role"],
                code=code_to_send,
                department=pending.get("department"),
            )
            email_status = "sent"
        except Exception as _:
            email_status = "failed"

        response = {
            "message": "Registration verified and completed.",
            "user": user,
            "email_status": email_status,
        }
        if code:
            response["generated_code"] = code
        if note:
            response["note"] = note
        return response, 201
    except Exception as e:
        return {"error": str(e)}, 500


@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    """Resend a new OTP for a pending registration and extend its expiry."""
    data = request.get_json(force=True, silent=True) or {}
    email = data.get("email")
    if not email:
        return {"error": "Email is required."}, 400

    pending = _pending_regs.get(email)
    if not pending:
        # Check if the user is already registered
        try:
            result = (
                supabase.table("users")
                .select("id")
                .eq("email", email)
                .limit(1)
                .execute()
            )
            error = (
                getattr(result, "error", None)
                if hasattr(result, "error")
                else result.get("error")
                if isinstance(result, dict)
                else None
            )
            data_out = (
                getattr(result, "data", None)
                if hasattr(result, "data")
                else result.get("data")
                if isinstance(result, dict)
                else None
            )
            if error:
                return {"error": getattr(error, "message", str(error))}, 400
            if data_out:
                return {
                    "error": "This email is already registered. Please login instead."
                }, 400
        except Exception:
            # If we can't check, proceed with a generic message
            pass
        return {
            "error": "No pending registration found for this email. Please register again."
        }, 404

    # Generate a fresh OTP and extend expiry
    try:
        otp = _generate_otp()
        otp_hash = bcrypt.hashpw(otp.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(
            minutes=OTP_EXP_MINUTES
        )

        pending["otp_hash"] = otp_hash
        pending["expires_at"] = expires_at
        _pending_regs[email] = pending

        _send_otp_email(email, otp)
        return {
            "message": f"A new OTP has been sent to {email}. It will expire in {OTP_EXP_MINUTES} minutes."
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get("email")

    if not email:
        return {"error": "Email is required."}, 400

    try:
        # Fetch user
        result = (
            supabase.table("users").select("*").eq("email", email).limit(1).execute()
        )
        user = result.data[0] if result.data else None

        if not user:
            return {"error": "User not found."}, 404

        # Generate OTP
        otp = _generate_otp()
        otp_hash = bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(
            minutes=OTP_EXP_MINUTES
        )).isoformat()
        otp_last_sent_at = datetime.datetime.utcnow().isoformat()

        # Update user with OTP info
        supabase.table("users").update(
            {
                "otp_hash": otp_hash,
                "otp_expires_at": expires_at,
                "otp_purpose": "password_reset",
                "otp_last_sent_at": otp_last_sent_at,
                "otp_resend_count": (user.get("otp_resend_count") or 0) + 1,
            }
        ).eq("email", email).execute()

        # Send email
        _send_otp_email(email, otp)

        return {"message": f"Password reset OTP sent to {email}."}, 200

    except Exception as e:
        return {"error": str(e)}, 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")

    if not email or not otp or not new_password:
        return {"error": "Email, OTP and new password are required."}, 400

    try:
        # Fetch user
        result = (
            supabase.table("users").select("*").eq("email", email).limit(1).execute()
        )
        user = result.data[0] if result.data else None

        if not user:
            return {"error": "User not found."}, 404

        # Check OTP purpose
        if user.get("otp_purpose") != "password_reset":
            return {"error": "This OTP is not valid for password reset."}, 400

        # Validate OTP expiry
        expires_at_raw = user.get("otp_expires_at")
        if not expires_at_raw:
            return {"error": "OTP expired."}, 400

        # Parse ISO datetime from DB robustly. Accept both naive and offset-aware
        # forms and normalize to UTC-aware datetimes for a safe comparison.
        try:
            # Replace trailing Z with +00:00 so fromisoformat can parse it
            expires_dt = datetime.datetime.fromisoformat(
                expires_at_raw.replace("Z", "+00:00")
            )
        except Exception:
            # Fallback: try direct fromisoformat (may raise)
            expires_dt = datetime.datetime.fromisoformat(expires_at_raw)

        # Ensure expires_dt is timezone-aware in UTC
        if expires_dt.tzinfo is None:
            expires_dt = expires_dt.replace(tzinfo=datetime.timezone.utc)
        else:
            expires_dt = expires_dt.astimezone(datetime.timezone.utc)

        now_utc = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

        if now_utc > expires_dt:
            return {"error": "OTP expired."}, 400

        # Validate OTP hash
        if not bcrypt.checkpw(otp.encode(), user["otp_hash"].encode()):
            return {"error": "Invalid OTP."}, 401

        # Update password
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

        supabase.table("users").update(
            {
                "password": hashed,
                "otp_hash": None,
                "otp_expires_at": None,
                "otp_purpose": None,
            }
        ).eq("email", email).execute()

        return {"message": "Password has been reset successfully."}, 200

    except Exception as e:
        return {"error": str(e)}, 500
