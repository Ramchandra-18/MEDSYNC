from flask import request, jsonify
from . import patient_bp
from app.auth.supabase_client import supabase
import datetime
from typing import Dict
import os
import jwt

JWT_SECRET = os.getenv('JWT_SECRET', 'changeme')


def _get_first(data, keys, default=None):
    for k in keys:
        if k in data and data[k] not in (None, ""):
            return data[k]
    return default


@patient_bp.route('/appointments', methods=['GET', 'POST', 'OPTIONS'])
def appointments():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return {}, 200

    if request.method == 'GET':
        return {
            "message": "POST to create an appointment.",
            "required": [
                "Full_Name", "Age", "Phone", "Gender",
                "department", "Doctor_name", "Date", "Time"
            ],
            "note": "Keys are case-insensitive; email OTP verification handled under /api/auth."
        }

    # Require JWT and derive patient email/id from it
    auth_header = request.headers.get('Authorization') or request.headers.get('authorization') or ''
    if not auth_header.startswith('Bearer '):
        return {"error": "Missing or invalid Authorization header. Provide Bearer token."}, 401
    token = auth_header.split(' ', 1)[1].strip()
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        token_email = claims.get('email')
        token_user_id = claims.get('user_id')
        if not token_email or not token_user_id:
            return {"error": "Invalid token: missing email or user_id."}, 401
    except Exception as e:
        return {"error": "Invalid token.", "details": str(e)}, 401

    data = request.get_json(force=True, silent=True) or {}

    full_name = _get_first(data, ["Full_Name", "full_name", "name", "FullName"]) or ""
    age = _get_first(data, ["Age", "age"]) or ""
    phone = _get_first(data, ["Phone", "phone", "mobile"]) or ""
    # patient_email is forced from token
    patient_email = token_email
    gender = _get_first(data, ["Gender", "gender"]) or ""
    department = _get_first(data, ["department", "Department"]) or ""
    doctor_name = _get_first(data, ["Doctor_name", "doctor_name", "doctor", "DoctorName"]) or ""
    date_str = _get_first(data, ["Date", "date"]) or ""
    time_str = _get_first(data, ["Time", "time"]) or ""
    symptoms = _get_first(data, ["symptoms", "Symptoms"]) or ""

    missing = [k for k, v in {
        "Full_Name": full_name,
        "Age": age,
        "Phone": phone,
        "Gender": gender,
        "department": department,
        "Doctor_name": doctor_name,
        "Date": date_str,
        "Time": time_str,
    }.items() if not v]
    if missing:
        return {"error": f"Missing fields: {', '.join(missing)}"}, 400

    # Basic validations
    try:
        age_val = int(age)
        if age_val <= 0 or age_val > 120:
            return {"error": "Age must be a positive number up to 120."}, 400
    except ValueError:
        return {"error": "Age must be a number."}, 400

    gender_val = str(gender).strip().capitalize()
    if gender_val not in ["Male", "Female", "Other"]:
        return {"error": "Gender must be one of: Male, Female, Other."}, 400

    # Parse date (YYYY-MM-DD) and time (HH:MM / HH:MM:SS)
    try:
        appt_date = datetime.datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date must be in format YYYY-MM-DD."}, 400

    parsed_time = None
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            parsed_time = datetime.datetime.strptime(time_str.strip(), fmt).time()
            break
        except ValueError:
            continue
    if parsed_time is None:
        return {"error": "Time must be in format HH:MM or HH:MM:SS (24-hour)."}, 400

    # Fetch doctor's user_code from users table (case-insensitive search)
    try:
        print(f"DEBUG: Searching for doctor with name: '{doctor_name}'")

        doctor_result = supabase.table('users') \
            .select('user_code, full_name, department') \
            .eq('role', 'Doctor') \
            .execute()
        doctor_error = getattr(doctor_result, 'error', None) if hasattr(doctor_result, 'error') \
            else doctor_result.get('error') if isinstance(doctor_result, dict) else None
        doctor_data = getattr(doctor_result, 'data', None) if hasattr(doctor_result, 'data') \
            else doctor_result.get('data') if isinstance(doctor_result, dict) else None

        if doctor_error:
            return {"error": f"Failed to fetch doctor information: {str(doctor_error)}"}, 400

        doctor_user_code = None
        matched_doctor_name = None
        matched_department = None

        if doctor_data:
            doctor_name_lower = doctor_name.strip().lower()
            for doc in doctor_data:
                doc_name = (doc.get('full_name') or '').strip()
                if doc_name.lower() == doctor_name_lower:
                    doctor_user_code = doc.get('user_code')
                    matched_doctor_name = doc_name
                    matched_department = doc.get('department')
                    print(
                        f"DEBUG: Found matching doctor: user_code='{doctor_user_code}', "
                        f"name='{matched_doctor_name}', department='{matched_department}'"
                    )
                    break

        if not doctor_user_code:
            return {
                "error": f"Doctor '{doctor_name}' not found. Please check the doctor name and try again.",
                "hint": "Make sure the doctor name matches exactly with registered doctors."
            }, 404

    except Exception as e:
        print(f"DEBUG: Error fetching doctor info: {e}")
        return {"error": f"Database error while searching for doctor: {str(e)}"}, 500

    insert_data = {
        "full_name": full_name,
        "age": age_val,
        "phone": str(phone),
        "gender": gender_val,
        "department": matched_department or department,
        "doctor_name": matched_doctor_name,
        "appointment_date": appt_date.isoformat(),
        "appointment_time": parsed_time.isoformat(),
        "patient_email": patient_email or None,
        "user_code": doctor_user_code,      # doctor's code
        "patient_id": token_user_id or None,
        "symptoms": symptoms or None,
    }

    try:
        result = supabase.table('appointments').insert(insert_data).execute()
        error = getattr(result, 'error', None) if hasattr(result, 'error') \
            else result.get('error') if isinstance(result, dict) else None
        data_out = getattr(result, 'data', None) if hasattr(result, 'data') \
            else result.get('data') if isinstance(result, dict) else None
        if error:
            msg = getattr(error, 'message', str(error))
            if 'appointments' in msg or 'column' in msg.lower():
                if 'patient_id' in msg:
                    try:
                        insert_data_no_pid = dict(insert_data)
                        insert_data_no_pid.pop('patient_id', None)
                        retry = supabase.table('appointments').insert(insert_data_no_pid).execute()
                        rerr = getattr(retry, 'error', None) if hasattr(retry, 'error') \
                            else retry.get('error') if isinstance(retry, dict) else None
                        data_out = getattr(retry, 'data', None) if hasattr(retry, 'data') \
                            else retry.get('data') if isinstance(retry, dict) else None
                        if rerr:
                            return {"error": getattr(rerr, 'message', str(rerr))}, 400
                    except Exception as ie:
                        return {"error": str(ie)}, 500
                elif 'user_code' in msg:
                    try:
                        insert_data_no_code = dict(insert_data)
                        insert_data_no_code.pop('user_code', None)
                        retry = supabase.table('appointments').insert(insert_data_no_code).execute()
                        rerr = getattr(retry, 'error', None) if hasattr(retry, 'error') \
                            else retry.get('error') if isinstance(retry, dict) else None
                        data_out = getattr(retry, 'data', None) if hasattr(retry, 'data') \
                            else retry.get('data') if isinstance(retry, dict) else None
                        if rerr:
                            return {"error": getattr(rerr, 'message', str(rerr))}, 400
                        print(
                            f"WARNING: user_code column not found in appointments table. "
                            f"Doctor code '{doctor_user_code}' was not saved."
                        )
                    except Exception as ie:
                        return {"error": str(ie)}, 500
                else:
                    return {
                        "error": "Database schema is missing for appointments.",
                        "details": msg,
                        "hint": "Create the appointments table using the SQL I can provide."
                    }, 500
            return {"error": msg}, 400
        if not data_out or not isinstance(data_out, list) or not data_out:
            return {"error": "No appointment returned from Supabase."}, 500

        appointment_data = data_out[0]
        return {
            "message": "Appointment booked successfully.",
            "appointment": appointment_data,
            "doctor_info": {
                "user_code": doctor_user_code,
                "name": matched_doctor_name,
                "department": matched_department
            }
        }, 201
    except Exception as e:
        return {"error": str(e)}, 500


@patient_bp.route('/', methods=['GET'])
def list_patients():
    return {"message": "Patient API ready. Use POST /api/patient/appointments to book an appointment."}


@patient_bp.route('/appointments/sort-by-doctor', methods=['POST'])
def sort_appointments_by_doctor():
    # unchanged...
    ...
    # (keep your existing implementation here)
    ...


@patient_bp.route('/records', methods=['GET'])
def get_patient_records():
    """
    Return patient records for the staff dashboard.
    Uses appointments table + maps fields to frontend shape.
    """
    try:
        res = supabase.table('appointments').select('*').execute()
        err = getattr(res, 'error', None) if hasattr(res, 'error') \
            else res.get('error') if isinstance(res, dict) else None
        data = getattr(res, 'data', None) if hasattr(res, 'data') \
            else res.get('data') if isinstance(res, dict) else None

        if err:
            msg = getattr(err, 'message', str(err))
            return {"error": msg}, 400

        if not isinstance(data, list):
            data = []

        patients = []
        for row in data:
            patients.append({
                "id": row.get("id"),
                "name": row.get("full_name"),
                "lastVisit": row.get("appointment_date"),
                "status": row.get("status") or "Active",
                "riskLevel": row.get("risk_level") or "Low",
                "age": row.get("age"),
                "phone": row.get("phone"),
                "email": row.get("patient_email"),
            })

        return {"patients": patients}, 200

    except Exception as e:
        return {"error": str(e)}, 500


@patient_bp.route('/appointments/recent', methods=['GET', 'OPTIONS'])
def recent_appointments():
    """
    Return recent appointments for the logged-in patient (or all, if you prefer).
    Used by the front-end Appointments page to show recent bookings.
    """
    if request.method == 'OPTIONS':
        return {}, 200

    try:
        # Decode JWT to filter by this patient (optional, but recommended)
        auth_header = request.headers.get('Authorization') or request.headers.get('authorization') or ''
        token_user_id = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
            try:
                claims = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                token_user_id = claims.get('user_id')
            except Exception:
                pass

        query = supabase.table('appointments').select('*')

        if token_user_id:
            query = query.eq('patient_id', token_user_id)

        res = query.order('appointment_date', desc=True).limit(5).execute()

        err = getattr(res, 'error', None) if hasattr(res, 'error') \
            else res.get('error') if isinstance(res, dict) else None
        data = getattr(res, 'data', None) if hasattr(res, 'data') \
            else res.get('data') if isinstance(res, dict) else None

        if err:
            msg = getattr(err, 'message', str(err))
            return {"error": msg}, 400

        if not isinstance(data, list):
            data = []

        return {"appointments": data}, 200
    except Exception as e:
        return {"error": str(e)}, 500
