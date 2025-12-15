from flask import request
from . import staff_bp
from app.auth.supabase_client import supabase
import os
import ssl
import smtplib
from email.message import EmailMessage
import datetime


# Mail config (reuses same envs as auth module)
MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.getenv('MAIL_PORT', '465'))
MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'
MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'True').lower() == 'true'
MAIL_USERNAME = os.getenv('MAIL_USERNAME') or os.getenv('GMAIL_USER')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD') or os.getenv('GMAIL_APP_PASSWORD')
MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', MAIL_USERNAME)
MAIL_FROM_NAME = os.getenv('GMAIL_FROM_NAME', 'MedSync')


def _send_generic_email(to_email: str, subject: str, body: str) -> None:
    if not to_email:
        return
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        return
    msg = EmailMessage()
    msg['Subject'] = subject
    from_email = MAIL_DEFAULT_SENDER or MAIL_USERNAME
    msg['From'] = f"{MAIL_FROM_NAME} <{from_email}>"
    msg['To'] = to_email
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


@staff_bp.route('/', methods=['GET'])
def list_staff():
    return {"message": "Staff API ready. Use the /appointments/* endpoints to manage appointments."}


@staff_bp.route('/appointments', methods=['GET'])
def list_appointments():
    """List appointments for staff dashboard with optional filters and pagination.

    Query params:
    - date: YYYY-MM-DD (exact date)
    - from_date, to_date: date range (YYYY-MM-DD)
    - status: Pending|Confirmed|Canceled|Rescheduled (if column exists)
    - doctor_name: substring match (case-insensitive)
    - department: exact match
    - patient_name: substring match on full_name (case-insensitive)
    - page: default 1
    - page_size: default 50, max 200
    - sort: date|created (default date)
    - dir: asc|desc (default asc)
    """
    args = request.args

    # Normalize helpers to ignore placeholders and meaningless values coming from UI controls
    def _norm(val, extra_placeholders=None):
        placeholders = {
            '', 'all', 'any', 'none', 'null', 'undefined',
            'select', 'choose', 'filter',
        }
        if extra_placeholders:
            placeholders.update({s.lower() for s in extra_placeholders})
        if val is None:
            return None
        s = str(val).strip()
        if s.lower() in placeholders:
            return None
        return s

    # Specific normalizer for status to treat "All" as unset and keep valid states
    def _norm_status(val):
        s = _norm(val)
        if s is None:
            return None
        # Common UI values that should behave like no filter
        if s.lower() in {'all', 'any'}:
            return None
        # Normalize case for typical statuses (doesn't enforce fixed set)
        return s.capitalize()

    date = _norm(args.get('date'), extra_placeholders={'dd-mm-yyyy'})
    from_date = _norm(args.get('from_date'), extra_placeholders={'dd-mm-yyyy'})
    to_date = _norm(args.get('to_date'), extra_placeholders={'dd-mm-yyyy'})
    status = _norm_status(args.get('status'))
    doctor_name = _norm(args.get('doctor_name'), extra_placeholders={'doctor', 'doctor (name)', 'doctor name'})
    department = _norm(args.get('department'), extra_placeholders={'department', 'all departments'})
    patient_name = _norm(args.get('patient_name'), extra_placeholders={'patient', 'patient name', 'patient substring'})
    try:
        page = max(1, int(args.get('page', '1')))
    except ValueError:
        page = 1
    try:
        page_size = min(200, max(1, int(args.get('page_size', '50'))))
    except ValueError:
        page_size = 50
    sort = (args.get('sort') or 'date').lower()
    direction = (args.get('dir') or 'asc').lower()
    desc = (direction == 'desc')

    # Build base query
    q = supabase.table('appointments').select('*')
    if date:
        q = q.eq('appointment_date', date)
    else:
        if from_date:
            q = q.gte('appointment_date', from_date)
        if to_date:
            q = q.lte('appointment_date', to_date)
    if doctor_name:
        try:
            q = q.ilike('doctor_name', f"%{doctor_name}%")
        except Exception:
            pass
    if department:
        q = q.eq('department', department)
    if patient_name:
        try:
            q = q.ilike('full_name', f"%{patient_name}%")
        except Exception:
            pass
    if status:
        q = q.eq('status', status)

    # Sorting
    try:
        if sort == 'created':
            q = q.order('created_at', desc=desc)
        else:
            q = q.order('appointment_date', desc=desc).order('appointment_time', desc=desc)
    except Exception:
        pass

    # Pagination via range if supported
    start = (page - 1) * page_size
    end = start + page_size - 1
    used_range = False
    try:
        q = q.range(start, end)
        used_range = True
    except Exception:
        used_range = False

    # Execute, retry without status filter if column missing
    res = q.execute()
    err = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    if err and status and 'column' in str(getattr(err, 'message', err)).lower():
        # Rebuild without status filter
        q2 = supabase.table('appointments').select('*')
        if date:
            q2 = q2.eq('appointment_date', date)
        else:
            if from_date:
                q2 = q2.gte('appointment_date', from_date)
            if to_date:
                q2 = q2.lte('appointment_date', to_date)
        if doctor_name:
            try:
                q2 = q2.ilike('doctor_name', f"%{doctor_name}%")
            except Exception:
                pass
        if department:
            q2 = q2.eq('department', department)
        if patient_name:
            try:
                q2 = q2.ilike('full_name', f"%{patient_name}%")
            except Exception:
                pass
        try:
            if sort == 'created':
                q2 = q2.order('created_at', desc=desc)
            else:
                q2 = q2.order('appointment_date', desc=desc).order('appointment_time', desc=desc)
        except Exception:
            pass
        try:
            q2 = q2.range(start, end)
            used_range = True
        except Exception:
            used_range = False
        res = q2.execute()
        err = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None

    if err:
        return {"error": getattr(err, 'message', str(err))}, 400

    data = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if data is None:
        data = []

    # If we couldn't use range(), slice locally as fallback
    if not used_range and isinstance(data, list):
        data = data[start:end+1]

    return {
        "items": data,
        "count": len(data) if isinstance(data, list) else None,
        "page": page,
        "page_size": page_size,
        "sort": sort,
        "dir": direction,
        "filters": {
            "date": date,
            "from_date": from_date,
            "to_date": to_date,
            "status": status,
            "doctor_name": doctor_name,
            "department": department,
            "patient_name": patient_name,
        }
    }, 200


@staff_bp.route('/appointments/confirm', methods=['POST'])
def confirm_appointment():
    data = request.get_json(force=True, silent=True) or {}
    appt_id = data.get('appointment_id')
    if not appt_id:
        return {"error": "appointment_id is required."}, 400
    # Fetch appointment
    res = supabase.table('appointments').select('*').eq('id', appt_id).limit(1).execute()
    err = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    rows = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if err:
        return {"error": getattr(err, 'message', str(err))}, 400
    if not rows:
        return {"error": "Appointment not found."}, 404
    appt = rows[0]

    update = {
        # Optional status fields if present in schema
        'status': 'Confirmed',
        'confirmed_at': datetime.datetime.utcnow().isoformat(),
        'updated_at': datetime.datetime.utcnow().isoformat(),
    }
    # Attempt update with status fields; on error about missing columns, retry minimal update
    try:
        u = supabase.table('appointments').update(update).eq('id', appt_id).execute()
        uerr = getattr(u, 'error', None) if hasattr(u, 'error') else u.get('error') if isinstance(u, dict) else None
        if uerr:
            msg = getattr(uerr, 'message', str(uerr))
            if 'column' in msg.lower():
                # Retry minimal update (no status columns)
                u = supabase.table('appointments').update({'updated_at': datetime.datetime.utcnow().isoformat()}).eq('id', appt_id).execute()
            else:
                return {"error": msg}, 400
    except Exception as e:
        # Retry minimal update
        supabase.table('appointments').update({'updated_at': datetime.datetime.utcnow().isoformat()}).eq('id', appt_id).execute()

    # Send email if patient_email available
    patient_email = appt.get('patient_email')
    try:
        date = appt.get('appointment_date')
        time = appt.get('appointment_time')
        subject = "Appointment Confirmation"
        body = (
            f"Dear {appt.get('full_name')},\n\n"
            f"Your appointment has been confirmed.\n"
            f"Doctor: {appt.get('doctor_name')}\n"
            f"Department: {appt.get('department')}\n"
            f"Date & Time: {date} {time}\n\n"
            f"Thank you,\n{MAIL_FROM_NAME}"
        )
        _send_generic_email(patient_email, subject, body)
    except Exception:
        pass

    return {"message": "Appointment confirmed."}, 200


@staff_bp.route('/appointments/cancel', methods=['POST'])
def cancel_appointment():
    data = request.get_json(force=True, silent=True) or {}
    appt_id = data.get('appointment_id')
    reason = data.get('reason')
    if not appt_id:
        return {"error": "appointment_id is required."}, 400

    res = supabase.table('appointments').select('*').eq('id', appt_id).limit(1).execute()
    err = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    rows = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if err:
        return {"error": getattr(err, 'message', str(err))}, 400
    if not rows:
        return {"error": "Appointment not found."}, 404
    appt = rows[0]

    update = {
        'status': 'Canceled',
        'canceled_at': datetime.datetime.utcnow().isoformat(),
        'status_reason': reason,
        'updated_at': datetime.datetime.utcnow().isoformat(),
    }
    try:
        u = supabase.table('appointments').update(update).eq('id', appt_id).execute()
        uerr = getattr(u, 'error', None) if hasattr(u, 'error') else u.get('error') if isinstance(u, dict) else None
        if uerr:
            msg = getattr(uerr, 'message', str(uerr))
            if 'column' in msg.lower():
                u = supabase.table('appointments').update({'updated_at': datetime.datetime.utcnow().isoformat()}).eq('id', appt_id).execute()
            else:
                return {"error": msg}, 400
    except Exception:
        supabase.table('appointments').update({'updated_at': datetime.datetime.utcnow().isoformat()}).eq('id', appt_id).execute()

    patient_email = appt.get('patient_email')
    try:
        subject = "Appointment Cancellation"
        body = (
            f"Dear {appt.get('full_name')},\n\n"
            f"Your appointment has been canceled."
            + (f" Reason: {reason}." if reason else "")
            + f"\nDoctor: {appt.get('doctor_name')}\nDepartment: {appt.get('department')}\nDate & Time: {appt.get('appointment_date')} {appt.get('appointment_time')}\n\n"
            f"If this was a mistake, please reschedule.\n\n"
            f"Regards,\n{MAIL_FROM_NAME}"
        )
        _send_generic_email(patient_email, subject, body)
    except Exception:
        pass

    return {"message": "Appointment canceled."}, 200


@staff_bp.route('/appointments/reschedule', methods=['POST'])
def reschedule_appointment():
    data = request.get_json(force=True, silent=True) or {}
    appt_id = data.get('appointment_id')
    new_date = data.get('Date') or data.get('date')
    new_time = data.get('Time') or data.get('time')
    if not appt_id or not new_date or not new_time:
        return {"error": "appointment_id, Date, and Time are required."}, 400

    res = supabase.table('appointments').select('*').eq('id', appt_id).limit(1).execute()
    err = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    rows = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if err:
        return {"error": getattr(err, 'message', str(err))}, 400
    if not rows:
        return {"error": "Appointment not found."}, 404
    appt = rows[0]

    update = {
        'appointment_date': new_date,
        'appointment_time': new_time,
        'status': 'Rescheduled',
        'rescheduled_at': datetime.datetime.utcnow().isoformat(),
        'updated_at': datetime.datetime.utcnow().isoformat(),
    }
    try:
        u = supabase.table('appointments').update(update).eq('id', appt_id).execute()
        uerr = getattr(u, 'error', None) if hasattr(u, 'error') else u.get('error') if isinstance(u, dict) else None
        if uerr:
            msg = getattr(uerr, 'message', str(uerr))
            if 'column' in msg.lower():
                u = supabase.table('appointments').update({
                    'appointment_date': new_date,
                    'appointment_time': new_time,
                    'updated_at': datetime.datetime.utcnow().isoformat(),
                }).eq('id', appt_id).execute()
            else:
                return {"error": msg}, 400
    except Exception:
        supabase.table('appointments').update({
            'appointment_date': new_date,
            'appointment_time': new_time,
            'updated_at': datetime.datetime.utcnow().isoformat(),
        }).eq('id', appt_id).execute()

    patient_email = appt.get('patient_email')
    try:
        subject = "Appointment Rescheduled"
        body = (
            f"Dear {appt.get('full_name')},\n\n"
            f"Your appointment has been rescheduled.\n"
            f"Doctor: {appt.get('doctor_name')}\n"
            f"Department: {appt.get('department')}\n"
            f"New Date & Time: {new_date} {new_time}\n\n"
            f"Regards,\n{MAIL_FROM_NAME}"
        )
        _send_generic_email(patient_email, subject, body)
    except Exception:
        pass

    return {"message": "Appointment rescheduled."}, 200
