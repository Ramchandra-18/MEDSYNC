from flask import request
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


@patient_bp.route('/appointments', methods=['GET', 'POST'])
def appointments():
    if request.method == 'GET':
        return {
            "message": "POST to create an appointment.",
            "required": [
                "Full_Name", "Age", "Phone", "Gender", "department", "Doctor_name", "Date", "Time"
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
    # patient_email is forced from token, ignore any provided value
    patient_email = token_email
    gender = _get_first(data, ["Gender", "gender"]) or ""
    department = _get_first(data, ["department", "Department"]) or ""
    doctor_name = _get_first(data, ["Doctor_name", "doctor_name", "doctor", "DoctorName"]) or ""
    date_str = _get_first(data, ["Date", "date"]) or ""
    time_str = _get_first(data, ["Time", "time"]) or ""

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

    # Parse date (YYYY-MM-DD) and time (HH:MM)
    try:
        appt_date = datetime.datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date must be in format YYYY-MM-DD."}, 400

    # Allow HH:MM or HH:MM:SS
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
        
        # Query doctors with case-insensitive name matching
        doctor_result = supabase.table('users').select('user_code, full_name, department').eq('role', 'Doctor').execute()
        doctor_error = getattr(doctor_result, 'error', None) if hasattr(doctor_result, 'error') else doctor_result.get('error') if isinstance(doctor_result, dict) else None
        doctor_data = getattr(doctor_result, 'data', None) if hasattr(doctor_result, 'data') else doctor_result.get('data') if isinstance(doctor_result, dict) else None
        
        if doctor_error:
            return {"error": f"Failed to fetch doctor information: {str(doctor_error)}"}, 400
        
        # Find matching doctor (case-insensitive)
        doctor_user_code = None
        matched_doctor_name = None
        matched_department = None
        
        if doctor_data:
            doctor_name_lower = doctor_name.strip().lower()
            for doc in doctor_data:
                doc_name = (doc.get('full_name') or '').strip()
                if doc_name.lower() == doctor_name_lower:
                    doctor_user_code = doc.get('user_code')
                    matched_doctor_name = doc_name  # Use exact name from database
                    matched_department = doc.get('department')
                    print(f"DEBUG: Found matching doctor: user_code='{doctor_user_code}', name='{matched_doctor_name}', department='{matched_department}'")
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
        "department": matched_department or department,  # Use doctor's department if available
        "doctor_name": matched_doctor_name,  # Use exact doctor name from database
        "appointment_date": appt_date.isoformat(),  # let Supabase cast to date
        "appointment_time": parsed_time.isoformat(),  # let Supabase cast to time
        "patient_email": patient_email or None,
        "user_code": doctor_user_code,  # Store doctor's user_code
        "patient_id": token_user_id or None,  # Store patient's user_id from token
    }

    try:
        result = supabase.table('appointments').insert(insert_data).execute()
        error = getattr(result, 'error', None) if hasattr(result, 'error') else result.get('error') if isinstance(result, dict) else None
        data_out = getattr(result, 'data', None) if hasattr(result, 'data') else result.get('data') if isinstance(result, dict) else None
        if error:
            msg = getattr(error, 'message', str(error))
            # Table or column missing guidance
            if 'appointments' in msg or 'column' in msg.lower():
                # If patient_id column missing, retry without it
                if 'patient_id' in msg:
                    try:
                        insert_data_no_pid = dict(insert_data)
                        insert_data_no_pid.pop('patient_id', None)
                        retry = supabase.table('appointments').insert(insert_data_no_pid).execute()
                        rerr = getattr(retry, 'error', None) if hasattr(retry, 'error') else retry.get('error') if isinstance(retry, dict) else None
                        data_out = getattr(retry, 'data', None) if hasattr(retry, 'data') else retry.get('data') if isinstance(retry, dict) else None
                        if rerr:
                            return {"error": getattr(rerr, 'message', str(rerr))}, 400
                    except Exception as ie:
                        return {"error": str(ie)}, 500
                # If user_code column missing, retry without it
                elif 'user_code' in msg:
                    try:
                        insert_data_no_code = dict(insert_data)
                        insert_data_no_code.pop('user_code', None)
                        retry = supabase.table('appointments').insert(insert_data_no_code).execute()
                        rerr = getattr(retry, 'error', None) if hasattr(retry, 'error') else retry.get('error') if isinstance(retry, dict) else None
                        data_out = getattr(retry, 'data', None) if hasattr(retry, 'data') else retry.get('data') if isinstance(retry, dict) else None
                        if rerr:
                            return {"error": getattr(rerr, 'message', str(rerr))}, 400
                        print(f"WARNING: user_code column not found in appointments table. Doctor code '{doctor_user_code}' was not saved.")
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
    """Collect doctors from users, appointments from appointments, and store joined details in doctor_appointments table."""
    try:
        # 1) Fetch doctors
        dres = supabase.table('users').select('id, full_name, department').eq('role', 'Doctor').execute()
        derr = getattr(dres, 'error', None) if hasattr(dres, 'error') else dres.get('error') if isinstance(dres, dict) else None
        ddata = getattr(dres, 'data', None) if hasattr(dres, 'data') else dres.get('data') if isinstance(dres, dict) else None
        if derr:
            return {"error": getattr(derr, 'message', str(derr))}, 400
        doctor_map = {}
        if isinstance(ddata, list):
            for doc in ddata:
                name_key = (doc.get('full_name') or '').strip().lower()
                if name_key:
                    doctor_map[name_key] = {
                        'id': doc.get('id'),
                        'department': doc.get('department')
                    }

        # 2) Fetch appointments
        ares = supabase.table('appointments').select('*').execute()
        aerr = getattr(ares, 'error', None) if hasattr(ares, 'error') else ares.get('error') if isinstance(ares, dict) else None
        adata = getattr(ares, 'data', None) if hasattr(ares, 'data') else ares.get('data') if isinstance(ares, dict) else None
        if aerr:
            msg = getattr(aerr, 'message', str(aerr))
            if 'appointments' in msg or 'relation' in msg.lower():
                return {
                    "error": "Appointments table is missing.",
                    "details": msg,
                    "hint": "Create the appointments table using the provided SQL."
                }, 500
            return {"error": msg}, 400

        if not isinstance(adata, list):
            adata = []

        # 3) Prepare rows for doctor_appointments
        rows = []
        matched = 0
        dept_counts: Dict[str, int] = {}
        doctor_counts: Dict[str, int] = {}
        for appt in adata:
            doc_name = (appt.get('doctor_name') or '').strip()
            key = doc_name.lower()
            doc_info = doctor_map.get(key)
            if doc_info:
                matched += 1
            row = {
                'appointment_id': appt.get('id'),
                'doctor_id': doc_info.get('id') if doc_info else None,
                'doctor_name': doc_name,
                'department': appt.get('department') or (doc_info.get('department') if doc_info else None),
                'patient_name': appt.get('full_name'),
                'patient_phone': appt.get('phone'),
                'appointment_date': appt.get('appointment_date'),
                'appointment_time': appt.get('appointment_time'),
            }
            rows.append(row)

            # Aggregate counts (department-wise and doctor-wise)
            dept_key = row['department'] or 'Unknown'
            doctor_key = row['doctor_name'] or 'Unknown'
            dept_counts[dept_key] = dept_counts.get(dept_key, 0) + 1
            doctor_counts[doctor_key] = doctor_counts.get(doctor_key, 0) + 1

        if not rows:
            return {"message": "No appointments found to process.", "processed": 0, "matched": 0}, 200

        # 4) Upsert into doctor_appointments on appointment_id to avoid duplicates
        try:
            up = supabase.table('doctor_appointments').upsert(rows, on_conflict='appointment_id').execute()
        except Exception as ue:
            # Likely table missing or upsert not supported
            return {
                "error": "doctor_appointments table missing or upsert not supported by client.",
                "details": str(ue),
                "hint": "Create the table using the SQL I can provide; if upsert unsupported, create a UNIQUE index on appointment_id."
            }, 500

        uerr = getattr(up, 'error', None) if hasattr(up, 'error') else up.get('error') if isinstance(up, dict) else None
        udata = getattr(up, 'data', None) if hasattr(up, 'data') else up.get('data') if isinstance(up, dict) else None
        if uerr:
            msg = getattr(uerr, 'message', str(uerr))
            if 'doctor_appointments' in msg or 'relation' in msg.lower():
                return {
                    "error": "doctor_appointments table is missing.",
                    "details": msg,
                    "hint": "Create the doctor_appointments table using the provided SQL."
                }, 500
            return {"error": msg}, 400

        upserted = len(udata) if isinstance(udata, list) else None

        # Build summaries sorted by count desc
        department_summary = [
            {"department": k, "count": v} for k, v in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        doctor_summary = [
            {"doctor_name": k, "count": v} for k, v in sorted(doctor_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        return {
            "message": "Appointments sorted by doctor and stored.",
            "processed": len(rows),
            "matched_doctors": matched,
            "upserted": upserted,
            "department_counts": department_summary,
            "doctor_counts": doctor_summary
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


