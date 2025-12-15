import datetime
import os

import jwt
from flask import request

from app.auth.supabase_client import supabase

from . import doctor_bp


@doctor_bp.route("/", methods=["GET"])
def list_doctors():
    return {
        "message": "Doctor API ready. Use GET /api/doctor/todays-appointments to view today's schedule."
    }


@doctor_bp.route("/todays-appointments", methods=["GET"])
def todays_appointments():
    """List today's appointments for the authenticated doctor only. Requires JWT token with doctor's information."""
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

        # Debug: Log token details (first/last 10 chars for security)
        print(
            f"DEBUG: Token received: {token[:10]}...{token[-10:] if len(token) > 20 else token}"
        )
        print(
            f"DEBUG: JWT_SECRET from env: {jwt_secret[:10]}...{jwt_secret[-10:] if len(jwt_secret) > 20 else jwt_secret}"
        )

        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        print(f"DEBUG: Decoded payload: {payload}")

        # Extract user information from token
        user_id = payload.get("user_id")
        doctor_email = payload.get("email")
        doctor_role = payload.get("role", "").lower()

        print(
            f"DEBUG: Extracted user_id='{user_id}', email='{doctor_email}', role='{doctor_role}'"
        )

        # Verify this is actually a doctor
        if doctor_role != "doctor":
            return {
                "error": f"Access denied. This endpoint is only for doctors. Your role: {doctor_role}"
            }, 403

        # Get the doctor's user_code from the database using user_id
        if not user_id:
            return {"error": "User ID not found in token. Please login again."}, 401

        # Fetch the doctor's user_code from users table
        try:
            user_result = (
                supabase.table("users")
                .select("user_code, full_name")
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
                return {
                    "error": "Could not fetch doctor information from database."
                }, 400

            doctor_info = user_data[0]
            user_code = doctor_info.get("user_code")
            doctor_name = doctor_info.get("full_name")

            if not user_code:
                return {
                    "error": "User code not found for this doctor. Please contact admin."
                }, 400

            print(
                f"DEBUG: Found doctor user_code='{user_code}', full_name='{doctor_name}'"
            )

        except Exception as e:
            print(f"DEBUG: Error fetching doctor info: {e}")
            return {
                "error": f"Database error while fetching doctor info: {str(e)}"
            }, 400

    except jwt.ExpiredSignatureError as e:
        print(f"DEBUG: Token expired: {e}")
        return {"error": "Token has expired. Please login again."}, 401
    except jwt.InvalidTokenError as e:
        print(f"DEBUG: Invalid token: {e}")
        return {"error": f"Invalid token: {str(e)}. Please login again."}, 401
    except Exception as e:
        print(f"DEBUG: Token validation exception: {e}")
        return {"error": f"Token validation failed: {str(e)}"}, 401

    today = datetime.date.today().isoformat()

    # Query appointments for this specific doctor using user_code directly
    print(f"DEBUG: Querying appointments for user_code='{user_code}' on date='{today}'")

    try:
        # First, let's check if there are ANY appointments for this doctor (any date)
        q_all = supabase.table("appointments").select("*").eq("user_code", user_code)
        res_all = q_all.execute()
        all_data = (
            getattr(res_all, "data", None)
            if hasattr(res_all, "data")
            else res_all.get("data")
            if isinstance(res_all, dict)
            else None
        )
        print(
            f"DEBUG: Total appointments for user_code '{user_code}' (any date): {len(all_data if all_data else [])}"
        )

        if all_data:
            print("DEBUG: All appointments for this doctor:")
            for appt in all_data:
                print(
                    f"  - ID: {appt.get('id')}, Date: {appt.get('appointment_date')}, Status: {appt.get('status')}"
                )

        # Now query for today's appointments specifically
        q = (
            supabase.table("appointments")
            .select("*")
            .eq("appointment_date", today)
            .eq("user_code", user_code)
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
            print(f"DEBUG: Error in appointments query: {res_error}")
            return {"error": f"Database query failed: {str(res_error)}"}, 400

        print(
            f"DEBUG: Query by user_code for TODAY ({today}) returned: {len(res_data if res_data else [])} appointments"
        )

        if res_data:
            print(f"DEBUG: Today's appointments found: {len(res_data)}")
            for appt in res_data:
                print(
                    f"DEBUG: Appointment ID {appt.get('id')}: user_code='{appt.get('user_code')}', doctor_name='{appt.get('doctor_name')}', status='{appt.get('status')}', date='{appt.get('appointment_date')}'"
                )

            # Filter for confirmed appointments (case-insensitive)
            confirmed_appointments = []
            for appt in res_data:
                status = appt.get("status", "").lower() if appt.get("status") else ""
                print(
                    f"DEBUG: Appointment {appt.get('id')} has status: '{appt.get('status')}' (normalized: '{status}')"
                )
                if status == "confirmed":
                    confirmed_appointments.append(appt)

            print(
                f"DEBUG: Found {len(confirmed_appointments)} confirmed appointments for TODAY"
            )
            final_data = confirmed_appointments
        else:
            print(
                f"DEBUG: No appointments found for user_code '{user_code}' on TODAY ({today})"
            )
            final_data = []

    except Exception as e:
        print(f"DEBUG: Exception during query: {e}")
        return {"error": f"Database query failed: {str(e)}"}, 400

    print(
        f"DEBUG: Final result: {len(final_data)} confirmed appointments for user_code '{user_code}' on TODAY ({today})"
    )

    # Return appointments for this doctor only (no grouping needed since it's one doctor)
    return {
        "date": today,
        "user_code": user_code,
        "doctor_name": doctor_name,
        "total": len(final_data or []),
        "appointments": final_data or [],
    }, 200


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
        prescription_date = datetime.datetime.strptime(date.strip(), "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date must be in format YYYY-MM-DD."}, 400

    # Validate time format (HH:MM or HH:MM:SS)
    parsed_time = None
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            parsed_time = datetime.datetime.strptime(time.strip(), fmt).time()
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
