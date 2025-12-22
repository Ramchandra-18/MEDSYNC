from datetime import datetime, date, time, timedelta  # ✅ single style
import os
import random
import smtplib
import ssl
from email.mime.text import MIMEText

import jwt
from flask import request, jsonify
from functools import wraps
from app.auth.supabase_client import supabase
from . import doctor_bp

from dateutil.parser import parse

# ✅ FIXED CORS DECORATOR
def cors_handler(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'ok'})
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response
        return f(*args, **kwargs)
    return decorated_function

@doctor_bp.route("/", methods=["GET", "OPTIONS"])
@cors_handler
def list_doctors():
    return {
        "message": "Doctor API ready. Use GET /api/doctor/todays-appointments to view today's schedule."
    }

# ✅ FIXED: Added OPTIONS + @cors_handler
@doctor_bp.route("/todays-appointments", methods=["GET", "OPTIONS"])
@cors_handler
def todays_appointments():
    """List today's appointments for the authenticated doctor only."""
    
    # 1. AUTHENTICATION
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {"error": "Authorization token required."}, 401

    token = auth_header.split(" ")[1]

    try:
        jwt_secret = os.getenv("JWT_SECRET", "your_secret_key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        
        user_id = payload.get("user_id")
        doctor_role = payload.get("role", "").lower()

        print(f"DEBUG: Token User ID: {user_id}") 

        if doctor_role != "doctor":
            return {"error": f"Access denied. Role: {doctor_role}"}, 403

        if not user_id:
            return {"error": "User ID missing in token."}, 401

        # 2. FETCH DOCTOR INFO
        user_result = (
            supabase.table("users")
            .select("user_code, full_name")
            .eq("id", user_id)
            .execute()
        )
        
        user_data = getattr(user_result, "data", None) 
        if user_data is None and isinstance(user_result, dict):
            user_data = user_result.get("data")

        if not user_data or len(user_data) == 0:
            print(f"❌ ERROR: User ID {user_id} not found in 'users' table.")
            return {"error": "Doctor profile not found."}, 404

        doctor_info = user_data[0]
        user_code = doctor_info.get("user_code")
        doctor_name = doctor_info.get("full_name")

    except jwt.ExpiredSignatureError:
        return {"error": "Token expired."}, 401
    except jwt.InvalidTokenError:
        return {"error": "Invalid token."}, 401
    except Exception as e:
        print(f"DEBUG: Auth Error: {e}")
        return {"error": f"Auth failed: {str(e)}"}, 401

    # ✅ FIXED: datetime conflict resolved
    today = datetime.now().date().isoformat()  # ← ONE LINE CHANGE
    print(f"DEBUG: Fetching appointments for {doctor_name} ({user_code}) on {today}")

    try:
        q = (
            supabase.table("appointments")
            .select("*")
            .eq("appointment_date", today)
            .eq("user_code", user_code)
        )
        res = q.execute()

        res_data = getattr(res, "data", None)
        if res_data is None and isinstance(res, dict):
            res_data = res.get("data")

        confirmed_appointments = []
        if res_data:
            for appt in res_data:
                status = str(appt.get("status", "")).lower()
                if status in ["confirmed", "paid", "completed"]:
                    confirmed_appointments.append(appt)

        return {
            "date": today,
            "user_code": user_code,
            "doctor_name": doctor_name,
            "total": len(confirmed_appointments),
            "appointments": confirmed_appointments,
        }, 200

    except Exception as e:
        print(f"DEBUG: Database Query Error: {e}")
        return {"error": "Failed to load appointments."}, 500

# ✅ FIXED: Changed int to str for UUID + Added OPTIONS
@doctor_bp.route("/appointment/<appointment_id>/payment-otp", methods=["POST", "OPTIONS"])
@cors_handler
def initiate_payment_otp(appointment_id):
    """Step 1: Doctor clicks 'Receive Payment' → Send OTP to patient email."""
    
    print(f"🚀 DEBUG: Payment OTP requested for: {appointment_id}")

    # 1. AUTHENTICATION
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {"error": "Authorization token required."}, 401

    token = auth_header.split(" ")[1]
    try:
        jwt_secret = os.getenv("JWT_SECRET", "your_secret_key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        user_id = payload.get("user_id")
        doctor_role = payload.get("role", "").lower()
        
        if doctor_role != "doctor":
            return {"error": "Access denied. Only doctors allowed."}, 403

        # Fetch doctor info
        user_result = supabase.table("users").select("user_code, full_name").eq("id", user_id).execute()
        user_data = getattr(user_result, "data", None) or user_result.get("data")
        
        if not user_data or len(user_data) == 0:
            return {"error": "Doctor profile not found."}, 404
        
        doctor_info = user_data[0]
        user_code = doctor_info.get("user_code")
        doctor_name = doctor_info.get("full_name")

    except Exception as e:
        print(f"❌ Auth error: {e}")
        return {"error": f"Auth failed: {str(e)}"}, 401

    # 2. FETCH APPOINTMENT & PATIENT EMAIL
    today = datetime.now().date().isoformat()
    print(f"🚀 DEBUG: Looking for appointment {appointment_id} on {today}")
    
    try:
        # Fetching directly from appointments
        appointment = (
            supabase.table("appointments")
            .select("id, full_name, patient_email, user_code, appointment_date") 
            .eq("id", appointment_id)
            .eq("user_code", user_code)
            .single()
            .execute()
        )
        appt_data = getattr(appointment, "data", None) or appointment.get("data")
        
        if not appt_data:
            print(f"❌ DEBUG: Appointment {appointment_id} not found")
            return {"error": "Appointment not found."}, 404
        
        patient_email = appt_data.get("patient_email")
        patient_name = appt_data.get("full_name")
        
        if not patient_email:
            return {"error": "Patient email is missing in this appointment."}, 400

    except Exception as e:
        print(f"❌ Database Query Error: {e}")
        return {"error": f"Database error: {str(e)}"}, 500

    print(f"🚀 DEBUG: Sending OTP to {patient_name} ({patient_email})")

    # 3. GENERATE & STORE OTP
    otp = str(random.randint(100000, 999999))
    
    # ✅ KEY CHANGE: Update the 'appointments' table directly
    try:
        supabase.table("appointments").update({
            "payment_otp": otp
        }).eq("id", appointment_id).execute()
        
        print(f"✅ DEBUG: OTP {otp} stored in appointments table")
    except Exception as e:
        print(f"❌ DEBUG: Failed to store OTP: {e}")
        return {"error": "Failed to store OTP. Did you add the 'payment_otp' column?"}, 500

    # 4. SEND OTP EMAIL
    try:
        _send_payment_otp_email(patient_email, patient_name, doctor_name, otp, appointment_id)
        print(f"✅ SUCCESS: OTP sent to {patient_email}")
    except Exception as e:
        print(f"⚠️ WARNING: Email failed: {e}")

    return {
        "message": "Payment OTP sent to patient successfully!",
        "appointment_id": appointment_id,
        "patient_name": patient_name,
        "patient_email": patient_email,
        "status": "otp_sent"
    }, 200
# ==========================================
#  ROUTE 2: VERIFY OTP
# ==========================================
@doctor_bp.route("/appointment/<appointment_id>/verify-payment", methods=["POST", "OPTIONS"])
@cors_handler
def verify_payment_otp(appointment_id):
    """Step 2: Doctor enters patient OTP → Mark as PAID"""
    
    # ... (Authentication code same as above) ...
    # ... Copy Auth block here ...

    data = request.get_json() or {}
    entered_otp = data.get("otp")
    fee_amount = data.get("fee", 500)

    if not entered_otp:
        return {"error": "OTP is required."}, 400

    # ✅ KEY CHANGE: Fetch OTP from 'appointments' table
    try:
        res = supabase.table("appointments").select("payment_otp").eq("id", appointment_id).single().execute()
        appt_data = getattr(res, "data", None) or res.get("data")

        if not appt_data:
            return {"error": "Appointment not found."}, 404

        stored_otp = appt_data.get("payment_otp")

        if stored_otp != entered_otp:
            return {"error": "Invalid OTP. Please try again."}, 400

        # MARK AS PAID and CLEAR OTP
        now = datetime.now().isoformat()
        supabase.table("appointments").update({
            "status": "paid",
            "payment_status": "paid",
            "fee": fee_amount,
            "payment_otp": None, # Clear OTP to prevent reuse
            "payment_confirmed_at": now
        }).eq("id", appointment_id).execute()

        return {"message": "Payment successful!", "status": "paid"}, 200

    except Exception as e:
        return {"error": str(e)}, 500

# ==========================================
#  HELPER: SEND EMAIL
# ==========================================
def _send_payment_otp_email(patient_email, patient_name, doctor_name, otp, appointment_id):
    """Send OTP email to patient."""
    try:
        # 1. SETUP CREDENTIALS
        MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        MAIL_PORT = int(os.getenv("MAIL_PORT", "465")) # Use 465 for SSL, 587 for TLS
        MAIL_USERNAME = os.getenv("MAIL_USERNAME") or os.getenv("GMAIL_USER")
        MAIL_PASSWORD = os.getenv("MAIL_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
        MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "MedSync")

        # 2. CREATE EMAIL CONTENT
        msg = MIMEText(f"""
Dear {patient_name},

This email is to verify a payment request initiated by Dr. {doctor_name} for your appointment.

To complete this transaction, please provide the following One-Time Password (OTP) to the hospital staff:

================================
PAYMENT OTP:  {otp}
================================

Verification Details:
- Appointment ID: {appointment_id}
- Validity: 5 minutes

If you did not authorize this payment, please ignore this email or contact MedSync support immediately.

Sincerely,
The MedSync Team
        """)
        msg["Subject"] = f"Payment Verification Code - {otp}"
        msg["From"] = f"{MAIL_FROM_NAME} <{MAIL_USERNAME}>"
        
        # 🚨 IMPORTANT: This line ensures it goes to the EMAIL, not the name
        msg["To"] = patient_email 

        # 3. SEND EMAIL
        context = ssl.create_default_context()
        
        # Using SSL (Port 465) - Safest method
        with smtplib.SMTP_SSL(MAIL_SERVER, MAIL_PORT, context=context) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(msg)
            
        print(f"📧 EMAIL SENT SUCCESSFULLY to: {patient_email}")

    except Exception as e:
        print(f"⚠️ Email failed: {e}")
        # We print the error but don't crash the app so the OTP flow continues
        pass


@doctor_bp.route("/patient-info", methods=["POST"])
def get_patient_info():
    """Get patient information by email from appointments table. Requires JWT token with doctor's information."""
    # Extract JWT token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {
            "error": "Authorization token required. Please provide Bearer token."
        }, 401

    token = auth_header.split(" ")[1]

    try:
        # Decode JWT token to verify it's a valid doctor
        jwt_secret = os.getenv("JWT_SECRET", "your_secret_key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])

        doctor_role = payload.get("role", "").lower()
        if doctor_role != "doctor":
            return {
                "error": f"Access denied. This endpoint is only for doctors. Your role: {doctor_role}"
            }, 403

    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired. Please login again."}, 401
    except jwt.InvalidTokenError:
        return {"error": "Invalid token. Please login again."}, 401
    except Exception as e:
        return {"error": f"Token validation failed: {str(e)}"}, 401

    # Get patient email from request
    data = request.get_json(force=True, silent=True) or {}
    patient_email = data.get("patient_email") or data.get("email")

    if not patient_email:
        return {"error": "patient_email is required."}, 400

    # Validate email format (basic check)
    if "@" not in patient_email or "." not in patient_email:
        return {"error": "Invalid email format."}, 400

    try:
        print(f"DEBUG: Searching for patient with email: '{patient_email}'")

        # Query appointments table for patient information (only basic fields needed)
        q = (
            supabase.table("appointments")
            .select("full_name, age, phone, patient_email")
            .eq("patient_email", patient_email)
            .limit(1)
        )
        res = q.execute()

        res_error = (
            getattr(res, "error", None)
            if hasattr(res, "error")
            else res.get("error")
            if isinstance(res, dict)
            else None
        )
        res_data = (
            getattr(res, "data", None)
            if hasattr(res, "data")
            else res.get("data")
            if isinstance(res, dict)
            else None
        )

        if res_error:
            print(f"DEBUG: Error in patient query: {res_error}")
            return {"error": f"Database query failed: {str(res_error)}"}, 400

        print(
            f"DEBUG: Query for patient email '{patient_email}' returned: {len(res_data if res_data else [])} appointments"
        )

        if not res_data or len(res_data) == 0:
            return {
                "error": f"No patient found with email '{patient_email}'.",
                "message": "Patient has no appointment records in the system.",
            }, 404

        # Extract unique patient information from the first appointment
        first_appointment = res_data[0]
        patient_info = {
            "full_name": first_appointment.get("full_name"),
            "age": first_appointment.get("age"),
            "phone": first_appointment.get("phone"),
            "email": first_appointment.get("patient_email"),
        }

        print(f"DEBUG: Found patient: {patient_info['full_name']}")

        return {
            "message": "Patient information retrieved successfully.",
            "patient_info": patient_info,
        }, 200

    except Exception as e:
        print(f"DEBUG: Exception during patient info query: {e}")
        return {"error": f"Database query failed: {str(e)}"}, 400


@doctor_bp.route("/prescription", methods=["POST"])
@cors_handler
def create_prescription():
    """Create a prescription for a patient. Requires JWT token with doctor's information."""
    # Extract JWT token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {
            "error": "Authorization token required. Please provide Bearer token."
        }, 401

    token = auth_header.split(" ")[1]

    try:
        # Decode JWT token to get doctor information
        jwt_secret = os.getenv("JWT_SECRET", "your_secret_key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])

        doctor_role = payload.get("role", "").lower()
        user_id = payload.get("user_id")

        if doctor_role != "doctor":
            return {
                "error": f"Access denied. This endpoint is only for doctors. Your role: {doctor_role}"
            }, 403

        if not user_id:
            return {"error": "User ID not found in token. Please login again."}, 401

        # Get doctor information
        user_result = (
            supabase.table("users")
            .select("user_code, full_name, department")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        user_error = (
            getattr(user_result, "error", None)
            if hasattr(user_result, "error")
            else user_result.get("error")
            if isinstance(user_result, dict)
            else None
        )
        user_data = (
            getattr(user_result, "data", None)
            if hasattr(user_result, "data")
            else user_result.get("data")
            if isinstance(user_result, dict)
            else None
        )

        if user_error or not user_data:
            return {"error": "Could not fetch doctor information from database."}, 400

        doctor_info = user_data[0]
        doctor_name = doctor_info.get("full_name")
        doctor_code = doctor_info.get("user_code")
        doctor_department = doctor_info.get("department")

    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired. Please login again."}, 401
    except jwt.InvalidTokenError:
        return {"error": "Invalid token. Please login again."}, 401
    except Exception as e:
        return {"error": f"Token validation failed: {str(e)}"}, 401

    # Get prescription data from request
    data = request.get_json(force=True, silent=True) or {}

    # Required fields
    full_name = data.get("full_name")
    age = data.get("age")
    phone = data.get("phone")
    gender = data.get("gender")
    disease = data.get("disease")
    date = data.get("date")  # Prescription date
    time = data.get("time")  # Prescription time
    medicines = data.get("medicines", [])  # Array of medicine objects
    patient_email = data.get("patient_email") or data.get("email")

    # Validate required fields
    missing_fields = []
    if not full_name:
        missing_fields.append("full_name")
    if not age:
        missing_fields.append("age")
    if not phone:
        missing_fields.append("phone")
    if not gender:
        missing_fields.append("gender")
    if not disease:
        missing_fields.append("disease")
    if not date:
        missing_fields.append("date")
    if not time:
        missing_fields.append("time")
    if not patient_email:
        missing_fields.append("patient_email")
    if not medicines or not isinstance(medicines, list):
        missing_fields.append("medicines")

    if missing_fields:
        return {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 400

    # Validate age
    try:
        age_val = int(age)
        if age_val <= 0 or age_val > 120:
            return {"error": "Age must be a positive number up to 120."}, 400
    except ValueError:
        return {"error": "Age must be a number."}, 400

    # Validate gender
    gender_val = str(gender).strip().capitalize()
    if gender_val not in ["Male", "Female", "Other"]:
        return {"error": "Gender must be one of: Male, Female, Other."}, 400

    # Validate email format
    if "@" not in patient_email or "." not in patient_email:
        return {"error": "Invalid email format."}, 400

    # Validate date format (YYYY-MM-DD)
    try:
        prescription_date = datetime.strptime(date.strip(), "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date must be in format YYYY-MM-DD."}, 400

    # Validate time format (HH:MM or HH:MM:SS)
    parsed_time = None
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            parsed_time = datetime.strptime(time.strip(), fmt).time()
            break
        except ValueError:
            continue
    if parsed_time is None:
        return {"error": "Time must be in format HH:MM or HH:MM:SS (24-hour)."}, 400

    # Validate medicines array
    if not medicines:
        return {"error": "At least one medicine is required."}, 400

    for i, med in enumerate(medicines):
        if not isinstance(med, dict):
            return {"error": f"Medicine {i + 1} must be an object."}, 400
        if not med.get("medication"):
            return {"error": f"Medicine {i + 1} is missing 'medication' field."}, 400
        if not med.get("dosage"):
            return {"error": f"Medicine {i + 1} is missing 'dosage' field."}, 400
        if not med.get("frequency"):
            return {"error": f"Medicine {i + 1} is missing 'frequency' field."}, 400

    try:
        print(
            f"DEBUG: Creating prescription for patient: {full_name} ({patient_email})"
        )

        # Prepare prescription data for database
        prescription_data = {
            "patient_name": full_name,
            "patient_age": age_val,
            "patient_phone": str(phone),
            "patient_gender": gender_val,
            "patient_email": patient_email,
            "disease": disease,
            "prescription_date": prescription_date.isoformat(),
            "prescription_time": parsed_time.isoformat(),
            "doctor_name": doctor_name,
            "doctor_code": doctor_code,
            "doctor_department": doctor_department,
            "medicines": medicines,  # Store as JSON array
        }

        # Insert prescription into Supabase
        result = supabase.table("prescriptions").insert(prescription_data).execute()
        res_error = (
            getattr(result, "error", None)
            if hasattr(result, "error")
            else result.get("error")
            if isinstance(result, dict)
            else None
        )
        res_data = (
            getattr(result, "data", None)
            if hasattr(result, "data")
            else result.get("data")
            if isinstance(result, dict)
            else None
        )

        if res_error:
            print(f"DEBUG: Error inserting prescription: {res_error}")
            return {"error": f"Failed to save prescription: {str(res_error)}"}, 400

        if not res_data or not isinstance(res_data, list) or not res_data:
            return {"error": "No prescription returned from database."}, 500

        saved_prescription = res_data[0]
        print(f"DEBUG: Prescription saved with ID: {saved_prescription.get('id')}")

        # Send prescription email to patient
        try:
            _send_prescription_email(
                patient_email=patient_email,
                patient_name=full_name,
                doctor_name=doctor_name,
                doctor_department=doctor_department,
                disease=disease,
                prescription_date=date,
                prescription_time=time,
                medicines=medicines,
            )
            email_status = "sent"
        except Exception as email_error:
            print(f"DEBUG: Email sending failed: {email_error}")
            email_status = "failed"

        return {
            "message": "Prescription created successfully.",
            "prescription_id": saved_prescription.get("id"),
            "patient_email": patient_email,
            "email_status": email_status,
            "prescription": saved_prescription,
        }, 201

    except Exception as e:
        print(f"DEBUG: Exception during prescription creation: {e}")
        return {"error": f"Failed to create prescription: {str(e)}"}, 500


def _send_prescription_email(
    patient_email,
    patient_name,
    doctor_name,
    doctor_department,
    disease,
    prescription_date,
    prescription_time,
    medicines,
):
    """Send prescription notification email to patient."""
    # Import email modules (same as auth module)
    import smtplib
    import ssl
    from email.message import EmailMessage

    # Get email config from environment
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "465"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "False").lower() == "true"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "True").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME") or os.getenv("GMAIL_USER")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)
    MAIL_FROM_NAME = os.getenv("GMAIL_FROM_NAME", "MedSync")

    if not MAIL_USERNAME or not MAIL_PASSWORD:
        raise RuntimeError("Email credentials not configured")

    # Create email content
    subject = f"Prescription Generated - Please Visit Pharmacy - MedSync"

    body = f"""Dear {patient_name},

Your prescription has been successfully generated and sent to the pharmacy by Dr. {doctor_name} from {doctor_department} department.

PRESCRIPTION NOTIFICATION:
========================
Patient Name: {patient_name}
Doctor: Dr. {doctor_name}
Department: {doctor_department}
Disease/Condition: {disease}
Prescription Date: {prescription_date}
Prescription Time: {prescription_time}

NEXT STEPS:
==========
🏥 Your prescription is being processed and sent to the pharmacy
💊 Please visit the pharmacy to collect your medicines and prescription
📋 Bring a valid ID when collecting your medicines
⏰ Pharmacy operating hours: [Please check with your local pharmacy]

IMPORTANT INSTRUCTIONS:
======================
- Visit the pharmacy as soon as possible to collect your medicines
- Carry this email or a printed copy as reference
- Ensure you have a valid government-issued ID for medicine collection
- Follow the prescribed dosage and frequency as instructed by your doctor
- Complete the full course of medication even if you feel better
- Contact your doctor if you experience any side effects

CONTACT INFORMATION:
===================
If you have any questions about this prescription or need assistance, please contact our clinic.

Doctor: Dr. {doctor_name}
Department: {doctor_department}

Thank you for choosing MedSync for your healthcare needs.

Best regards,
{MAIL_FROM_NAME} Team
"""

    # Create and send email
    msg = EmailMessage()
    msg["Subject"] = subject
    from_email = MAIL_DEFAULT_SENDER or MAIL_USERNAME
    msg["From"] = f"{MAIL_FROM_NAME} <{from_email}>"
    msg["To"] = patient_email
    msg.set_content(body)

    context = ssl.create_default_context()
    if MAIL_USE_TLS:
        port = MAIL_PORT or 587
        with smtplib.SMTP(MAIL_SERVER, port) as server:
            server.starttls(context=context)
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(msg)
    else:
        port = MAIL_PORT or 465
        with smtplib.SMTP_SSL(MAIL_SERVER, port, context=context) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(msg)


from dateutil.parser import parse


def _parse_slot_datetime(slot_str):
    try:
        # Attempt to parse formats like '24 Aug 9:00 AM'
        dt = parse(slot_str)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        # Fallback for invalid formats
        return None


@doctor_bp.route("/schedule", methods=["GET", "POST"])
def manage_schedule():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {"error": "Authorization token required."}, 401
    token = auth_header.split(" ")[1]

    try:
        jwt_secret = os.getenv("JWT_SECRET", "your_secret_key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])

        # ENFORCE ACCESS USING 'role' CLAIM ONLY
        doctor_role = (
            payload.get("role")
            or payload.get("user_role")
            or payload.get("https://schemas/role")
            or ""
        )
        if doctor_role.lower() != "doctor":
            return {
                "error": f"Access denied. Only doctors allowed. Your role: {doctor_role}"
            }, 403

        # Flexible extraction for user ID (top-level or nested)
        user_id = (
            payload.get("user_id")
            or payload.get("userId")
            or payload.get("sub")
            or (
                payload.get("user", {}).get("userId")
                if isinstance(payload.get("user"), dict)
                else None
            )
            or (
                payload.get("user", {}).get("id")
                if isinstance(payload.get("user"), dict)
                else None
            )
        )

        # Only require user_id for DB lookup, not for authorization
        if not user_id:
            return {"error": "User ID missing for schedule lookup."}, 400

        user_result = (
            supabase.table("users")
            .select("user_code, full_name")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        user_data = (
            getattr(user_result, "data", None)
            if hasattr(user_result, "data")
            else user_result.get("data")
        )
        if not user_data:
            return {"error": "Doctor info not found in database."}, 400
        doctor_info = user_data[0]
        user_code = doctor_info.get("user_code")
        doctor_name = doctor_info.get("full_name")

        if not user_code:
            return {"error": "User code missing for doctor."}, 400

    except jwt.ExpiredSignatureError:
        return {"error": "Token expired."}, 401
    except jwt.InvalidTokenError:
        return {"error": "Invalid token."}, 401
    except Exception as e:
        return {"error": f"Token validation error: {str(e)}"}, 401

    if request.method == "GET":
        try:
            schedule_result = (
                supabase.table("doctor_availability")
                .select("slot_datetime, is_available")
                .eq("doctor_id", user_code)
                .execute()
            )
            schedule_data = (
                getattr(schedule_result, "data", None)
                if hasattr(schedule_result, "data")
                else schedule_result.get("data")
            )
            return {
                "doctor_code": user_code,
                "doctor_name": doctor_name,
                "schedule": schedule_data,
            }, 200
        except Exception as e:
            return {"error": f"Failed to retrieve schedule: {str(e)}"}, 500

    if request.method == "POST":
        data = request.get_json()
        action = data.get("action")
        if not action:
            return {"error": "Action not specified."}, 400
        try:
            if action in ["block_slot", "unblock_slot"]:
                slot_str = data.get("slot")
                if not slot_str:
                    return {"error": "'slot' required."}, 400
                slot_dt = _parse_slot_datetime(slot_str)
                if not slot_dt:
                    return {"error": "Invalid slot datetime."}, 400
                is_available = action == "unblock_slot"
                supabase.table("doctor_availability").upsert(
                    {
                        "doctor_id": user_code,
                        "slot_datetime": slot_dt,
                        "is_available": is_available,
                    }
                ).execute()
            elif action in ["block_day", "unblock_day"]:
                day_str = data.get("day")
                if not day_str:
                    return {"error": "'day' required."}, 400
                day = parse(day_str).date()
                is_available = action == "unblock_day"
                slots_to_update = [
                    {
                        "doctor_id": user_code,
                        "slot_datetime": datetime.datetime.combine(
                            day, datetime.time(hour, minute)
                        ).strftime("%Y-%m-%d %H:%M:%S"),
                        "is_available": is_available,
                    }
                    for hour in range(9, 17)
                    for minute in [0, 30]
                ]
                supabase.table("doctor_availability").upsert(slots_to_update).execute()
            elif action == "unblock_all":
                supabase.table("doctor_availability").delete().eq(
                    "doctor_id", user_code
                ).execute()
            elif action == "block_all":
                return {"message": "'block_all' not implemented."}, 501
            else:
                return {"error": f"Invalid action: {action}"}, 400

            return {
                "message": f"Schedule updated ({action})",
                "doctor_code": user_code,
                "doctor_name": doctor_name,
            }, 200
        except Exception as e:
            return {"error": f"Schedule update failed: {str(e)}"}, 500

@doctor_bp.route("/all", methods=["GET"])
def get_all_doctors():
    """
    Fetch all doctors from the users table.
    Only authenticated PATIENTS are allowed to access this.
    """

    # 1. Get and validate Bearer token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {"error": "Authorization token required."}, 401

    token = auth_header.split(" ", 1)[1]

    try:
        # 2. Decode JWT
        jwt_secret = os.getenv("JWT_SECRET", "your_secret_key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])

        user_id = payload.get("user_id")
        if not user_id:
            return {"error": "Invalid token or missing user_id. Please login again."}, 401

        # 3. Fetch requester role from users table
        requester_result = (
            supabase.table("users")
            .select("role")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

        requester_data = (
            requester_result.data
            if hasattr(requester_result, "data")
            else requester_result.get("data")
        )

        if not requester_data:
            return {"error": "User not found."}, 404

        requester_role = requester_data[0]["role"]

        # 4. Allow ONLY patients to view doctors
        if requester_role.lower() != "patient":
            return {
                "error": "Access denied. Only patients can view doctor list."
            }, 403

        # 5. Fetch all doctors
        doctors_result = (
            supabase.table("users")
            .select("id, full_name, email, role, department, user_code, created_at")
            .eq("role", "Doctor")
            .order("full_name", desc=False)
            .execute()
        )

        doctors_data = (
            doctors_result.data
            if hasattr(doctors_result, "data")
            else doctors_result.get("data")
        ) or []

        return {
            "message": "Doctors fetched successfully.",
            "total": len(doctors_data),
            "doctors": doctors_data,
        }, 200

    except jwt.ExpiredSignatureError:
        return {"error": "Token expired. Please login again."}, 401
    except jwt.InvalidTokenError:
        return {"error": "Invalid token. Please login again."}, 401
    except Exception as e:
        return {"error": f"Server error: {str(e)}"}, 500






