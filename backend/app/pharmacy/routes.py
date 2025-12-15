import datetime
import os
import smtplib
import ssl
from email.message import EmailMessage

import jwt
from flask import request

from app.auth.supabase_client import supabase

from . import pharmacy_bp


@pharmacy_bp.route("/", methods=["GET"])
def list_pharmacy():
    return {
        "message": "Pharmacy API ready. Use GET /api/pharmacy/prescriptions to view all prescriptions."
    }


def _send_prescription_ready_email(prescription):
    """Send an email to the patient when their prescription is ready for pickup."""
    patient_email = prescription.get("patient_email")
    patient_name = prescription.get("patient_name")
    if not patient_email or not patient_name:
        return

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
        print("Email credentials not configured")
        return

    subject = f"Your Prescription is Ready for Pickup - MedSync"
    body = f"""Dear {patient_name},

Your prescription is ready for pickup at the pharmacy.

PRESCRIPTION DETAILS:
=====================
Doctor: {prescription.get("doctor_name")}
Department: {prescription.get("doctor_department")}
Date: {prescription.get("prescription_date")}

PICKUP INSTRUCTIONS:
====================
- Please bring a valid ID for verification.
- Pharmacy hours are 9:00 AM to 5:00 PM, Monday to Friday.

If you have any questions, please contact us.

Best regards,
{MAIL_FROM_NAME} Pharmacy Team
"""
    msg = EmailMessage()
    msg["Subject"] = subject
    from_email = MAIL_DEFAULT_SENDER or MAIL_USERNAME
    msg["From"] = f"{MAIL_FROM_NAME} <{from_email}>"
    msg["To"] = patient_email
    msg.set_content(body)

    context = ssl.create_default_context()
    try:
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
    except Exception as e:
        print(f"Failed to send email: {e}")


# ----------------- rest of your route as is below -----------------


@pharmacy_bp.route("/prescriptions", methods=["GET"])
def get_all_prescriptions():
    """Get all prescriptions for pharmacy. Supports filtering and pagination."""

    # Get query parameters for filtering and pagination
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    patient_email = request.args.get("patient_email", "").strip()
    patient_name = request.args.get("patient_name", "").strip()
    doctor_name = request.args.get("doctor_name", "").strip()
    doctor_code = request.args.get("doctor_code", "").strip()
    department = request.args.get("department", "").strip()
    disease = request.args.get("disease", "").strip()
    prescription_date = request.args.get("date", "").strip()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()
    sort_by = request.args.get("sort_by", "created_at").strip()
    sort_order = request.args.get("sort_order", "desc").strip().lower()

    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 20
    if sort_order not in ["asc", "desc"]:
        sort_order = "desc"

    valid_sort_fields = [
        "created_at",
        "prescription_date",
        "patient_name",
        "doctor_name",
        "patient_age",
        "disease",
        "doctor_department",
    ]
    if sort_by not in valid_sort_fields:
        sort_by = "created_at"

    try:
        print(
            f"DEBUG: Fetching prescriptions with filters - page: {page}, limit: {limit}"
        )

        query = supabase.table("prescriptions").select("*")

        # Apply filters
        if patient_email:
            query = query.ilike("patient_email", f"%{patient_email}%")
            print(f"DEBUG: Filtering by patient_email: {patient_email}")

        if patient_name:
            query = query.ilike("patient_name", f"%{patient_name}%")
            print(f"DEBUG: Filtering by patient_name: {patient_name}")

        if doctor_name:
            query = query.ilike("doctor_name", f"%{doctor_name}%")
            print(f"DEBUG: Filtering by doctor_name: {doctor_name}")

        if doctor_code:
            query = query.ilike("doctor_code", f"%{doctor_code}%")
            print(f"DEBUG: Filtering by doctor_code: {doctor_code}")

        if department:
            query = query.ilike("doctor_department", f"%{department}%")
            print(f"DEBUG: Filtering by department: {department}")

        if disease:
            query = query.ilike("disease", f"%{disease}%")
            print(f"DEBUG: Filtering by disease: {disease}")

        if prescription_date:
            try:
                datetime.datetime.strptime(prescription_date, "%Y-%m-%d")
                query = query.eq("prescription_date", prescription_date)
                print(f"DEBUG: Filtering by exact date: {prescription_date}")
            except ValueError:
                return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400

        if date_from:
            try:
                datetime.datetime.strptime(date_from, "%Y-%m-%d")
                query = query.gte("prescription_date", date_from)
                print(f"DEBUG: Filtering from date: {date_from}")
            except ValueError:
                return {"error": "Invalid date_from format. Use YYYY-MM-DD."}, 400

        if date_to:
            try:
                datetime.datetime.strptime(date_to, "%Y-%m-%d")
                query = query.lte("prescription_date", date_to)
                print(f"DEBUG: Filtering to date: {date_to}")
            except ValueError:
                return {"error": "Invalid date_to format. Use YYYY-MM-DD."}, 400

        if sort_order == "asc":
            query = query.order(sort_by)
        else:
            query = query.order(sort_by, desc=True)

        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        print(f"DEBUG: Executing query with offset: {offset}, limit: {limit}")

        result = query.execute()
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
            print(f"DEBUG: Error in prescriptions query: {res_error}")
            return {"error": f"Database query failed: {str(res_error)}"}, 400

        prescriptions = res_data or []
        print(f"DEBUG: Found {len(prescriptions)} prescriptions")

        # Send email to every prescription in the result
        for prescription in prescriptions:
            try:
                _send_prescription_ready_email(prescription)
            except Exception as e:
                print(
                    f"DEBUG: Failed to send email for prescription {prescription.get('id')}: {e}"
                )

        # Get total count for pagination (filtered)
        count_query = supabase.table("prescriptions").select("id", count="exact")
        if patient_email:
            count_query = count_query.ilike("patient_email", f"%{patient_email}%")
        if patient_name:
            count_query = count_query.ilike("patient_name", f"%{patient_name}%")
        if doctor_name:
            count_query = count_query.ilike("doctor_name", f"%{doctor_name}%")
        if doctor_code:
            count_query = count_query.ilike("doctor_code", f"%{doctor_code}%")
        if department:
            count_query = count_query.ilike("doctor_department", f"%{department}%")
        if disease:
            count_query = count_query.ilike("disease", f"%{disease}%")
        if prescription_date:
            count_query = count_query.eq("prescription_date", prescription_date)
        if date_from:
            count_query = count_query.gte("prescription_date", date_from)
        if date_to:
            count_query = count_query.lte("prescription_date", date_to)

        count_result = count_query.execute()
        total_count = (
            getattr(count_result, "count", 0) if hasattr(count_result, "count") else 0
        )

        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        has_next = page < total_pages
        has_prev = page > 1

        return {
            "message": "Prescriptions retrieved successfully. Emails sent to patients.",
            "prescriptions": prescriptions,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev,
            },
            "filters_applied": {
                "patient_email": patient_email or None,
                "patient_name": patient_name or None,
                "doctor_name": doctor_name or None,
                "doctor_code": doctor_code or None,
                "department": department or None,
                "disease": disease or None,
                "prescription_date": prescription_date or None,
                "date_from": date_from or None,
                "date_to": date_to or None,
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
        }, 200

    except Exception as e:
        print(f"DEBUG: Exception during prescriptions query: {e}")
        return {"error": f"Failed to fetch prescriptions: {str(e)}"}, 500


@pharmacy_bp.route("/prescriptions/<int:prescription_id>", methods=["GET"])
def get_prescription_by_id(prescription_id):
    """Get a specific prescription by ID for pharmacy."""

    if prescription_id <= 0:
        return {"error": "Invalid prescription ID."}, 400

    try:
        print(f"DEBUG: Fetching prescription with ID: {prescription_id}")

        # Query specific prescription
        result = (
            supabase.table("prescriptions")
            .select("*")
            .eq("id", prescription_id)
            .limit(1)
            .execute()
        )
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
            print(f"DEBUG: Error in prescription query: {res_error}")
            return {"error": f"Database query failed: {str(res_error)}"}, 400

        if not res_data or len(res_data) == 0:
            return {"error": f"Prescription with ID {prescription_id} not found."}, 404

        prescription = res_data[0]
        print(
            f"DEBUG: Found prescription for patient: {prescription.get('patient_name')}"
        )

        return {
            "message": "Prescription retrieved successfully.",
            "prescription": prescription,
        }, 200

    except Exception as e:
        print(f"DEBUG: Exception during prescription fetch: {e}")
        return {"error": f"Failed to fetch prescription: {str(e)}"}, 500


@pharmacy_bp.route("/inventory", methods=["GET"])
def get_inventory():
    """Get all pharmacy inventory with filtering and pagination."""

    # Get query parameters for filtering and pagination
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 50, type=int)

    # Filtering parameters
    medicine_name = request.args.get("medicine_name", "").strip()
    expiry_from = request.args.get("expiry_from", "").strip()
    expiry_to = request.args.get("expiry_to", "").strip()
    low_stock = request.args.get(
        "low_stock", type=int
    )  # Show items with quantity <= this value
    expired = (
        request.args.get("expired", "").strip().lower()
    )  # 'true' to show expired items

    # Sorting parameters
    sort_by = request.args.get("sort_by", "medicine_name").strip()
    sort_order = request.args.get("sort_order", "asc").strip().lower()

    # Validate pagination
    if page < 1:
        page = 1
    if limit < 1 or limit > 200:
        limit = 50

    # Validate sort order
    if sort_order not in ["asc", "desc"]:
        sort_order = "asc"

    # Valid sort fields
    valid_sort_fields = [
        "medicine_name",
        "quantity",
        "expiry_date",
        "created_at",
        "updated_at",
    ]
    if sort_by not in valid_sort_fields:
        sort_by = "medicine_name"

    try:
        print(f"DEBUG: Fetching inventory with filters - page: {page}, limit: {limit}")

        # Build query with filters
        query = supabase.table("pharmacy_inventory").select("*")

        # Apply filters
        if medicine_name:
            query = query.ilike("medicine_name", f"%{medicine_name}%")
            print(f"DEBUG: Filtering by medicine_name: {medicine_name}")

        if expiry_from:
            try:
                datetime.datetime.strptime(expiry_from, "%Y-%m-%d")
                query = query.gte("expiry_date", expiry_from)
                print(f"DEBUG: Filtering expiry from date: {expiry_from}")
            except ValueError:
                return {"error": "Invalid expiry_from format. Use YYYY-MM-DD."}, 400

        if expiry_to:
            try:
                datetime.datetime.strptime(expiry_to, "%Y-%m-%d")
                query = query.lte("expiry_date", expiry_to)
                print(f"DEBUG: Filtering expiry to date: {expiry_to}")
            except ValueError:
                return {"error": "Invalid expiry_to format. Use YYYY-MM-DD."}, 400

        if low_stock is not None and low_stock >= 0:
            query = query.lte("quantity", low_stock)
            print(f"DEBUG: Filtering low stock <= {low_stock}")

        if expired == "true":
            today = datetime.date.today().isoformat()
            query = query.lt("expiry_date", today)
            print(f"DEBUG: Filtering expired medicines (before {today})")

        # Apply sorting
        if sort_order == "asc":
            query = query.order(sort_by)
        else:
            query = query.order(sort_by, desc=True)

        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        print(f"DEBUG: Executing inventory query with offset: {offset}, limit: {limit}")

        # Execute query
        result = query.execute()
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
            print(f"DEBUG: Error in inventory query: {res_error}")
            return {"error": f"Database query failed: {str(res_error)}"}, 400

        inventory = res_data or []
        print(f"DEBUG: Found {len(inventory)} inventory items")

        # Get total count for pagination
        count_query = supabase.table("pharmacy_inventory").select("id", count="exact")

        # Apply same filters for count
        if medicine_name:
            count_query = count_query.ilike("medicine_name", f"%{medicine_name}%")
        if expiry_from:
            count_query = count_query.gte("expiry_date", expiry_from)
        if expiry_to:
            count_query = count_query.lte("expiry_date", expiry_to)
        if low_stock is not None and low_stock >= 0:
            count_query = count_query.lte("quantity", low_stock)
        if expired == "true":
            today = datetime.date.today().isoformat()
            count_query = count_query.lt("expiry_date", today)

        count_result = count_query.execute()
        total_count = (
            getattr(count_result, "count", 0) if hasattr(count_result, "count") else 0
        )

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        has_next = page < total_pages
        has_prev = page > 1

        return {
            "message": "Inventory retrieved successfully.",
            "inventory": inventory,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev,
            },
            "filters_applied": {
                "medicine_name": medicine_name or None,
                "expiry_from": expiry_from or None,
                "expiry_to": expiry_to or None,
                "low_stock": low_stock,
                "expired": expired == "true",
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
        }, 200

    except Exception as e:
        print(f"DEBUG: Exception during inventory query: {e}")
        return {"error": f"Failed to fetch inventory: {str(e)}"}, 500


@pharmacy_bp.route("/inventory", methods=["POST"])
def manage_inventory():
    """Add new medicine to inventory or restock existing medicine."""

    # Get inventory data from request
    data = request.get_json(force=True, silent=True) or {}

    # Required fields
    medicine_name = data.get("medicine_name", "").strip()
    quantity = data.get("quantity")
    expiry_date = data.get("expiry_date", "").strip()
    action = data.get("action", "add").strip().lower()  # 'add' or 'restock'

    # Validate required fields
    missing_fields = []
    if not medicine_name:
        missing_fields.append("medicine_name")
    if quantity is None:
        missing_fields.append("quantity")
    if not expiry_date:
        missing_fields.append("expiry_date")

    if missing_fields:
        return {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 400

    # Validate quantity
    try:
        quantity_val = int(quantity)
        if quantity_val < 0:
            return {"error": "Quantity cannot be negative."}, 400
    except ValueError:
        return {"error": "Quantity must be a number."}, 400

    # Validate expiry date format (YYYY-MM-DD)
    try:
        parsed_expiry_date = datetime.datetime.strptime(expiry_date, "%Y-%m-%d").date()
        # Check if expiry date is not in the past
        today = datetime.date.today()
        if parsed_expiry_date < today:
            return {"error": "Expiry date cannot be in the past."}, 400
    except ValueError:
        return {"error": "Expiry date must be in format YYYY-MM-DD."}, 400

    # Validate action
    if action not in ["add", "restock"]:
        action = "add"

    try:
        print(
            f"DEBUG: Managing inventory - medicine: {medicine_name}, quantity: {quantity_val}, action: {action}"
        )

        if action == "restock":
            # Check if medicine exists
            existing_result = (
                supabase.table("pharmacy_inventory")
                .select("*")
                .ilike("medicine_name", medicine_name)
                .limit(1)
                .execute()
            )
            existing_error = (
                getattr(existing_result, "error", None)
                if hasattr(existing_result, "error")
                else existing_result.get("error")
                if isinstance(existing_result, dict)
                else None
            )
            existing_data = (
                getattr(existing_result, "data", None)
                if hasattr(existing_result, "data")
                else existing_result.get("data")
                if isinstance(existing_result, dict)
                else None
            )

            if existing_error:
                print(f"DEBUG: Error checking existing medicine: {existing_error}")
                return {"error": f"Database query failed: {str(existing_error)}"}, 400

            if existing_data and len(existing_data) > 0:
                # Update existing medicine
                existing_medicine = existing_data[0]
                new_quantity = existing_medicine["quantity"] + quantity_val

                update_data = {
                    "quantity": new_quantity,
                    "expiry_date": parsed_expiry_date.isoformat(),
                }

                update_result = (
                    supabase.table("pharmacy_inventory")
                    .update(update_data)
                    .eq("id", existing_medicine["id"])
                    .execute()
                )
                update_error = (
                    getattr(update_result, "error", None)
                    if hasattr(update_result, "error")
                    else update_result.get("error")
                    if isinstance(update_result, dict)
                    else None
                )
                update_data_res = (
                    getattr(update_result, "data", None)
                    if hasattr(update_result, "data")
                    else update_result.get("data")
                    if isinstance(update_result, dict)
                    else None
                )

                if update_error:
                    print(f"DEBUG: Error updating medicine: {update_error}")
                    return {
                        "error": f"Failed to update inventory: {str(update_error)}"
                    }, 400

                if not update_data_res or not update_data_res:
                    return {"error": "No data returned from update operation."}, 500

                updated_medicine = update_data_res[0]
                print(
                    f"DEBUG: Restocked medicine: {medicine_name}, new quantity: {new_quantity}"
                )

                return {
                    "message": f"Medicine '{medicine_name}' restocked successfully.",
                    "action": "restocked",
                    "previous_quantity": existing_medicine["quantity"],
                    "added_quantity": quantity_val,
                    "new_quantity": new_quantity,
                    "medicine": updated_medicine,
                }, 200
            else:
                # Medicine doesn't exist, create new one
                action = "add"

        if action == "add":
            # Add new medicine to inventory
            inventory_data = {
                "medicine_name": medicine_name,
                "quantity": quantity_val,
                "expiry_date": parsed_expiry_date.isoformat(),
            }

            insert_result = (
                supabase.table("pharmacy_inventory").insert(inventory_data).execute()
            )
            insert_error = (
                getattr(insert_result, "error", None)
                if hasattr(insert_result, "error")
                else insert_result.get("error")
                if isinstance(insert_result, dict)
                else None
            )
            insert_data = (
                getattr(insert_result, "data", None)
                if hasattr(insert_result, "data")
                else insert_result.get("data")
                if isinstance(insert_result, dict)
                else None
            )

            if insert_error:
                print(f"DEBUG: Error inserting medicine: {insert_error}")
                # Check if it's a duplicate medicine error
                if (
                    "unique" in str(insert_error).lower()
                    or "duplicate" in str(insert_error).lower()
                ):
                    return {
                        "error": f"Medicine '{medicine_name}' already exists. Use action='restock' to add more quantity."
                    }, 409
                return {"error": f"Failed to add medicine: {str(insert_error)}"}, 400

            if not insert_data or not insert_data:
                return {"error": "No data returned from insert operation."}, 500

            saved_medicine = insert_data[0]
            print(
                f"DEBUG: Added new medicine: {medicine_name}, quantity: {quantity_val}"
            )

            return {
                "message": f"Medicine '{medicine_name}' added to inventory successfully.",
                "action": "added",
                "medicine": saved_medicine,
            }, 201

    except Exception as e:
        print(f"DEBUG: Exception during inventory management: {e}")
        return {"error": f"Failed to manage inventory: {str(e)}"}, 500


@pharmacy_bp.route("/restock-alert", methods=["GET"])
def check_restock_alerts():
    """Check for low stock medicines and send email alerts. Returns list of medicines needing restock."""

    # Get query parameters
    threshold = request.args.get("threshold", 10, type=int)  # Stock level threshold
    # Email sending is now ALWAYS automatic
    if threshold < 0:
        threshold = 10

    try:
        print(f"DEBUG: Checking for restock alerts with threshold: {threshold}")

        # Query medicines with low stock
        query = (
            supabase.table("pharmacy_inventory")
            .select("*")
            .lte("quantity", threshold)
            .order("quantity")
        )
        result = query.execute()

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
            print(f"DEBUG: Error in restock alert query: {res_error}")
            return {"error": f"Database query failed: {str(res_error)}"}, 400

        low_stock_medicines = res_data or []
        print(
            f"DEBUG: Found {len(low_stock_medicines)} medicines with low stock (<= {threshold})"
        )

        if not low_stock_medicines:
            return {
                "message": "No medicines require restocking at this time.",
                "alert_status": "all_good",
                "threshold": threshold,
                "low_stock_count": 0,
                "medicines": [],
                "email_sent": False,
            }, 200

        # Categorize medicines by urgency
        critical_stock = []  # quantity <= 5
        low_stock = []  # quantity 6-threshold (including threshold)

        for medicine in low_stock_medicines:
            qty = medicine.get("quantity", 0)
            if qty <= 5:
                critical_stock.append(medicine)
            else:
                low_stock.append(medicine)

        # Always send email alert if there are low stock items
        email_sent = False
        email_error = None
        if low_stock_medicines:
            try:
                print(
                    f"DEBUG: Attempting to send restock alert email for {len(low_stock_medicines)} medicines (automatic)"
                )
                _send_restock_alert_email(
                    low_stock_medicines=low_stock_medicines,
                    critical_stock=critical_stock,
                    low_stock=low_stock,
                    threshold=threshold,
                )
                email_sent = True
                print(
                    f"DEBUG: Restock alert email sent successfully to work.medsync@gmail.com"
                )
            except Exception as email_err:
                email_error = str(email_err)
                print(f"DEBUG: Failed to send restock alert email: {email_err}")

        # Determine alert level
        if critical_stock:
            alert_level = "critical"
            alert_message = f"CRITICAL: {len(critical_stock)} medicines are critically low (≤5 units). {len(low_stock)} medicines are running low."
        elif low_stock:
            alert_level = "warning"
            alert_message = f"WARNING: {len(low_stock_medicines)} medicines are running low (≤{threshold} units)."
        else:
            alert_level = "info"
            alert_message = (
                f"INFO: {len(low_stock_medicines)} medicines need attention."
            )

        return {
            "message": alert_message,
            "alert_status": alert_level,
            "threshold": threshold,
            "low_stock_count": len(low_stock_medicines),
            "critical_count": len(critical_stock),
            "warning_count": len(low_stock),
            "medicines": {
                "critical": critical_stock,
                "warning": low_stock,
                "all": low_stock_medicines,
            },
            "email_sent": email_sent,
            "email_error": email_error,
            "recommendations": _generate_restock_recommendations(low_stock_medicines),
            "email_note": "Emails are sent automatically when medicines reach threshold level. Query parameter 'send_email' is ignored.",
        }, 200 if not critical_stock else 206  # 206 Partial Content for critical alerts

    except Exception as e:
        print(f"DEBUG: Exception during restock alert check: {e}")
        return {"error": f"Failed to check restock alerts: {str(e)}"}, 500


def _send_restock_alert_email(
    low_stock_medicines, critical_stock, low_stock, threshold
):
    """Send restock alert email to pharmacy management."""
    # Import email modules
    import smtplib
    import ssl
    from email.message import EmailMessage

    print(
        f"DEBUG: Starting email send process for {len(low_stock_medicines)} medicines"
    )

    # Get email config from environment
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "465"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "False").lower() == "true"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "True").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME") or os.getenv("GMAIL_USER")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)
    MAIL_FROM_NAME = os.getenv("GMAIL_FROM_NAME", "MedSync")

    # Alert recipient email
    ALERT_EMAIL = "work.medsync@gmail.com"

    print(
        f"DEBUG: Email config - Server: {MAIL_SERVER}, Port: {MAIL_PORT}, TLS: {MAIL_USE_TLS}, SSL: {MAIL_USE_SSL}"
    )
    print(f"DEBUG: Sender: {MAIL_USERNAME}, Recipient: {ALERT_EMAIL}")

    if not MAIL_USERNAME or not MAIL_PASSWORD:
        raise RuntimeError("Email credentials not configured")

    # Determine urgency level
    if critical_stock:
        urgency = "🚨 CRITICAL ALERT"
        priority = "High"
    else:
        urgency = "⚠️ LOW STOCK WARNING"
        priority = "Normal"

    print(f"DEBUG: Alert urgency: {urgency}, Priority: {priority}")

    # Create email content
    subject = f"{urgency} - Pharmacy Restock Required - MedSync"

    # Build critical medicines list
    critical_text = ""
    if critical_stock:
        critical_text = "🚨 CRITICAL STOCK (≤5 units):\n"
        critical_text += "=" * 40 + "\n"
        for med in critical_stock:
            critical_text += f"• {med['medicine_name']}: {med['quantity']} units (Expires: {med['expiry_date']})\n"
        critical_text += "\n"

    # Build low stock medicines list
    low_stock_text = ""
    if low_stock:
        low_stock_text = f"⚠️ LOW STOCK (6-{threshold} units):\n"
        low_stock_text += "=" * 40 + "\n"
        for med in low_stock:
            low_stock_text += f"• {med['medicine_name']}: {med['quantity']} units (Expires: {med['expiry_date']})\n"
        low_stock_text += "\n"

    # If no critical or low stock but we have medicines, they must be exactly at threshold
    if not critical_text and not low_stock_text and low_stock_medicines:
        threshold_text = f"⚠️ THRESHOLD STOCK (={threshold} units):\n"
        threshold_text += "=" * 40 + "\n"
        for med in low_stock_medicines:
            threshold_text += f"• {med['medicine_name']}: {med['quantity']} units (Expires: {med['expiry_date']})\n"
        threshold_text += "\n"
        low_stock_text = threshold_text

    # Generate restock recommendations
    recommendations = _generate_restock_recommendations(low_stock_medicines)
    recommendations_text = ""
    if recommendations:
        recommendations_text = "📋 RESTOCK RECOMMENDATIONS:\n"
        recommendations_text += "=" * 40 + "\n"
        for rec in recommendations:
            recommendations_text += f"• {rec}\n"
        recommendations_text += "\n"

    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    body = f"""Dear Pharmacy Management Team,

This is an automated restock alert from MedSync Pharmacy Inventory System.

ALERT SUMMARY:
=============
Alert Level: {urgency}
Total Medicines: {len(low_stock_medicines)}
Critical Stock: {len(critical_stock)} medicines
Low Stock: {len(low_stock)} medicines
Stock Threshold: ≤{threshold} units
Alert Time: {current_time}

{critical_text}{low_stock_text}{recommendations_text}
IMMEDIATE ACTIONS REQUIRED:
==========================
1. Review all critical stock items immediately
2. Place urgent orders for medicines with ≤5 units
3. Contact suppliers for emergency restocking if needed
4. Update inventory after receiving new stock
5. Monitor expiry dates during restocking

SYSTEM INFORMATION:
==================
This alert was generated automatically by the MedSync system.
Restock alerts are triggered when medicine quantities fall to or below {threshold} units.

To manage inventory:
- Use the pharmacy inventory management system
- Update stock levels after receiving shipments
- Set up regular supplier orders for frequently used medicines

If you have any questions or need assistance, please contact the system administrator.

Best regards,
{MAIL_FROM_NAME} Automated Alert System

---
This is an automated message. Please do not reply to this email.
For system support, contact: admin@medsync.com
"""

    print(f"DEBUG: Email subject: {subject}")
    print(f"DEBUG: Email body length: {len(body)} characters")

    # Create and send email
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = (
        f"{MAIL_FROM_NAME} Alert System <{MAIL_DEFAULT_SENDER or MAIL_USERNAME}>"
    )
    msg["To"] = ALERT_EMAIL
    msg["X-Priority"] = (
        "1" if critical_stock else "3"
    )  # High priority for critical alerts
    msg.set_content(body)

    context = ssl.create_default_context()
    try:
        if MAIL_USE_TLS:
            port = MAIL_PORT or 587
            print(f"DEBUG: Connecting via TLS to {MAIL_SERVER}:{port}")
            with smtplib.SMTP(MAIL_SERVER, port) as server:
                server.starttls(context=context)
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.send_message(msg)
        else:
            port = MAIL_PORT or 465
            print(f"DEBUG: Connecting via SSL to {MAIL_SERVER}:{port}")
            with smtplib.SMTP_SSL(MAIL_SERVER, port, context=context) as server:
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.send_message(msg)

        print(f"DEBUG: Email sent successfully to {ALERT_EMAIL}")
    except Exception as smtp_error:
        print(f"DEBUG: SMTP Error: {smtp_error}")
        raise smtp_error


def _generate_restock_recommendations(low_stock_medicines):
    """Generate intelligent restock recommendations based on stock levels and expiry dates."""
    recommendations = []

    if not low_stock_medicines:
        return recommendations

    # Group by urgency
    critical_count = len([m for m in low_stock_medicines if m.get("quantity", 0) <= 5])

    if critical_count > 0:
        recommendations.append(
            f"URGENT: Order {critical_count} critical medicines immediately"
        )

    # Check for expired or expiring soon medicines
    today = datetime.date.today()
    expiring_soon = []

    for med in low_stock_medicines:
        try:
            expiry_date = datetime.datetime.strptime(
                med.get("expiry_date", ""), "%Y-%m-%d"
            ).date()
            days_to_expiry = (expiry_date - today).days

            if days_to_expiry < 0:
                recommendations.append(
                    f"EXPIRED: Remove '{med['medicine_name']}' (expired {abs(days_to_expiry)} days ago)"
                )
            elif days_to_expiry <= 30:
                expiring_soon.append(med["medicine_name"])
        except:
            continue

    if expiring_soon:
        recommendations.append(
            f"Check expiry: {len(expiring_soon)} medicines expire within 30 days"
        )

    # Stock level recommendations
    total_low = len(low_stock_medicines)
    if total_low >= 10:
        recommendations.append(
            "Consider increasing minimum stock levels for frequently used medicines"
        )

    recommendations.append(f"Review and update stock levels for {total_low} medicines")
    recommendations.append(
        "Set up automatic reorder points to prevent future shortages"
    )

    return recommendations


import ast
import datetime
import hashlib
import io
import os
import smtplib
import ssl
from email.message import EmailMessage

from dotenv import load_dotenv
from flask import request
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from web3 import Web3

# === Blockchain Initialization ===

load_dotenv()

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

# === Helpers ===


def clean_date(val):
    if not val or str(val).strip() in ["", "null", "None"]:
        return None
    try:
        return str(datetime.datetime.strptime(str(val)[:10], "%Y-%m-%d").date())
    except Exception:
        return None


def generate_unique_receipt_no(prescription_id):
    now = datetime.datetime.now()
    return f"BILL-{prescription_id}-{now.strftime('%Y%m%d%H%M%S')}"


def parse_medicines_field(meds):
    if isinstance(meds, list):
        return [str(m).strip() for m in meds if str(m).strip()]
    if isinstance(meds, dict):
        return [f"{k}: {v}" for k, v in meds.items()]
    if isinstance(meds, str):
        try:
            v = ast.literal_eval(meds)
            if isinstance(v, list):
                return [str(m).strip() for m in v if str(m).strip()]
            elif isinstance(v, str):
                return [v]
        except Exception:
            return [m.strip() for m in meds.split(",") if m.strip()]
    return []


# === Blockchain functions ===
def hash_prescription_record(prescription):
    fields = [
        prescription.get("id"),
        prescription.get("patient_name"),
        prescription.get("patient_age"),
        prescription.get("doctor_name"),
        prescription.get("doctor_code"),
        prescription.get("doctor_department"),
        str(prescription.get("prescription_date")),
        str(prescription.get("medicines", "")),
    ]
    canonical = "|".join([str(f) for f in fields])
    return hashlib.sha256(canonical.encode()).hexdigest()


def anchor_to_blockchain(prescription):
    record_hash = hash_prescription_record(prescription)
    txn = {
        "from": account.address,
        "to": account.address,
        "value": 0,
        "gas": 50000,
        "gasPrice": w3.to_wei("1", "gwei"),
        "data": "0x" + record_hash,
        "nonce": w3.eth.get_transaction_count(account.address),
    }
    signed = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    attr = "rawTransaction" if hasattr(signed, "rawTransaction") else "raw_transaction"
    raw_tx = getattr(signed, attr)
    tx_hash = w3.eth.send_raw_transaction(raw_tx)
    return record_hash, w3.to_hex(tx_hash)


# === PDF Generation ===


def generate_prescription_pdf_page(c, prescription):
    width, height = A4
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor("#1296ab"))
    c.drawString(30, height - 60, prescription.get("clinic_name", "MEDSYNC"))
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#222222"))
    c.drawString(
        30, height - 75, prescription.get("clinic_subtext", "Powered By Blockchain")
    )
    c.setStrokeColor(HexColor("#1296ab"))
    c.line(30, height - 80, width - 30, height - 80)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(HexColor("#1296ab"))
    c.drawString(width - 200, height - 60, prescription.get("doctor_name", "Doctor"))
    c.setFont("Helvetica", 10)
    c.drawString(
        width - 200, height - 75, prescription.get("doctor_department", "Department")
    )
    doc_id = prescription.get("doctor_code") or prescription.get("doctor_id") or ""
    c.drawString(width - 200, height - 90, f"ID No: {doc_id}")

    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(HexColor("#000000"))
    c.drawCentredString(width / 2, height - 135, "MEDICAL PRESCRIPTION FORM")

    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, height - 160, "S. No:")
    c.setFont("Helvetica", 10)
    c.drawString(
        80,
        height - 160,
        str(prescription.get("serial_no") or prescription.get("id") or "001"),
    )
    c.setFont("Helvetica-Bold", 10)
    c.drawString(130, height - 160, "Date:")
    c.setFont("Helvetica", 10)
    c.drawString(165, height - 160, str(prescription.get("prescription_date", "")))

    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, height - 180, "Patient's Name:")
    c.setFont("Helvetica", 10)
    c.drawString(130, height - 180, prescription.get("patient_name", ""))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, height - 200, "Date of birth:")
    c.setFont("Helvetica", 10)
    c.drawString(115, height - 200, str(prescription.get("dob", "")))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(200, height - 200, "Age:")
    c.setFont("Helvetica", 10)
    c.drawString(225, height - 200, str(prescription.get("patient_age", "")))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(300, height - 200, "Gender:")
    c.setFont("Helvetica", 10)
    c.drawString(345, height - 200, prescription.get("patient_gender", ""))

    c.setFont("Helvetica-Bold", 13)
    c.drawString(40, height - 230, "Rx:")
    c.setFont("Helvetica", 11)
    y = height - 250
    meds = parse_medicines_field(prescription.get("medicines"))
    if not meds:
        meds = [
            "Aspirin 75mg, once daily for 30 days",
            "Atorvastatin 20mg, once daily for 30 days",
        ]
    for med in meds:
        c.drawString(70, y, str(med))
        y -= 18

    c.line(width - 210, height - 300, width - 50, height - 300)
    c.setFont("Helvetica", 10)
    c.drawString(width - 190, height - 315, "Doctor's Signature")
    c.setStrokeColor(HexColor("#1296ab"))
    c.line(30, 65, width - 30, 65)
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#1296ab"))
    c.drawString(
        30,
        50,
        prescription.get(
            "clinic_footer",
            "Phone: 0123456789 | Email: clinicname@email.com | www.yourwebsite.com | Address: Lorem Ipsum Street, Dolor, Sit Amet 12345",
        ),
    )


def generate_prescription_pdf(prescription):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    generate_prescription_pdf_page(c, prescription)
    c.save()
    buffer.seek(0)
    return buffer


def generate_bill_and_prescription_pdf(prescription, bill):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 18)
    c.setFillColorRGB(0.1, 0.6, 0.8)
    c.drawString(40, height - 60, bill.get("hospital_name", "MEDSYNC"))
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.0, 0.3, 0.8)
    c.drawString(
        40, height - 80, bill.get("hospital_certification", "ISO 9001:2015 Certified")
    )
    c.setFont("Helvetica-Bold", 13)
    c.setFillColorRGB(0, 0, 0)
    c.drawCentredString(width / 2, height - 120, "Investigation Payment Receipt")

    left_labels = [
        ("Receipt No", bill.get("receipt_no", "")),
        ("UHID", bill.get("uhid", "")),
        ("Name", bill.get("patient_name", "")),
        ("Age/DOB", f"{bill.get('age', '')} {bill.get('dob', '')}"),
        ("Gen/Mobile No.", f"{bill.get('gender', '')} / {bill.get('mobile', '')}"),
        ("Address", bill.get("address", "")),
    ]
    y_left = height - 160
    for label, value in left_labels:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(40, y_left, f"{label}:")
        c.setFont("Helvetica", 10)
        c.drawString(140, y_left, value)
        y_left -= 18

    right_labels = [
        ("Date & Time", bill.get("receipt_date", "")),
        ("Department", bill.get("department", "")),
        ("Doctor", bill.get("doctor_name", "")),
    ]
    y_right = height - 160
    x_right = width // 2 + 30
    for label, value in right_labels:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_right, y_right, f"{label}:")
        c.setFont("Helvetica", 10)
        c.drawString(x_right + 90, y_right, value)
        y_right -= 18

    y_table = min(y_left, y_right) - 10
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, y_table, "S.No.")
    c.drawString(80, y_table, "Code")
    c.drawString(130, y_table, "Particular")
    c.drawString(340, y_table, "Rate (Rs)")
    c.drawString(400, y_table, "Unit")
    c.drawString(440, y_table, "Amount (Rs)")

    y = y_table - 15
    items = bill.get("items", [])
    for idx, item in enumerate(items, start=1):
        c.setFont("Helvetica", 10)
        c.drawString(40, y, str(idx))
        c.drawString(80, y, str(item.get("code", "")))
        c.drawString(130, y, str(item.get("particular", "")))
        c.drawString(340, y, str(item.get("rate", "")))
        c.drawString(400, y, str(item.get("unit", "")))
        c.drawString(440, y, str(item.get("amount", "")))
        y -= 15

    y_totals = y - 20
    c.setFont("Helvetica-Bold", 11)
    c.drawString(40, y_totals, "Total Bill Amount (Rs):")
    c.setFont("Helvetica", 11)
    c.drawRightString(200, y_totals, f"{bill.get('total_amount', '0.00'):,.2f}")
    y_totals -= 18
    c.setFont("Helvetica-Bold", 11)
    c.drawString(40, y_totals, "Amount Paid:")
    c.setFont("Helvetica", 11)
    c.drawRightString(200, y_totals, f"{bill.get('amount_paid', '0.00'):,.2f}")
    y_totals -= 18
    c.setFont("Helvetica-Bold", 11)
    c.drawString(40, y_totals, "Balance Amount (Rs):")
    c.setFont("Helvetica", 11)
    c.drawRightString(200, y_totals, f"{bill.get('balance_amount', '0.00'):,.2f}")
    y_totals -= 18
    c.setFont("Helvetica", 11)
    c.drawString(40, y_totals, f"Amount in words: {bill.get('amount_in_words', '')}")

    c.setFont("Helvetica", 9)
    c.setFillColorRGB(0.0, 0.3, 0.8)
    c.drawString(width - 180, 70, "Authorized Signature")
    c.drawString(
        40,
        50,
        bill.get(
            "hospital_address",
            "Address: IT Tower, H-91, Sector-63, Noida-201301 Uttar Pradesh",
        ),
    )
    c.showPage()

    generate_prescription_pdf_page(c, prescription)
    c.save()
    buffer.seek(0)
    return buffer


def _send_prescription_pdf_email(prescription, pdf_stream, filename="Prescription.pdf"):
    patient_email = prescription.get("patient_email")
    patient_name = prescription.get("patient_name")
    if not patient_email or not patient_name:
        print("Missing patient email or name!")
        return

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "465"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "False").lower() == "true"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "True").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME") or os.getenv("GMAIL_USER")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)
    MAIL_FROM_NAME = os.getenv("GMAIL_FROM_NAME", "MedSync")

    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print("Email credentials missing!")
        return

    subject = f"Your {filename.split('.')[0].replace('_', ' ')} - MedSync"
    body = f"""Dear {patient_name},

Please find attached your medical {filename.split(".")[0].replace("_", " ").lower()}.

Regards,
{MAIL_FROM_NAME} Pharmacy Team
"""
    msg = EmailMessage()
    msg["Subject"] = subject
    from_email = MAIL_DEFAULT_SENDER or MAIL_USERNAME
    msg["From"] = f"{MAIL_FROM_NAME} <{from_email}>"
    msg["To"] = patient_email
    msg.set_content(body)
    msg.add_attachment(
        pdf_stream.read(),
        maintype="application",
        subtype="pdf",
        filename=filename,
    )

    context = ssl.create_default_context()
    try:
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
    except Exception as e:
        print(f"Failed to send email: {e}")


# ---- ROUTES -----


@pharmacy_bp.route("/prescriptions/<int:prescription_id>/send_pdf", methods=["POST"])
def send_prescription_pdf_email_route(prescription_id):
    try:
        result = (
            supabase.table("prescriptions")
            .select("*")
            .eq("id", prescription_id)
            .limit(1)
            .execute()
        )
        res_data = (
            getattr(result, "data", None)
            if hasattr(result, "data")
            else result.get("data")
            if isinstance(result, dict)
            else None
        )
        if not res_data:
            return {"error": f"Prescription with ID {prescription_id} not found."}, 404
        prescription = res_data[0]
        prescription["dob"] = clean_date(prescription.get("dob"))
        prescription["prescription_date"] = clean_date(
            prescription.get("prescription_date")
        )

        # Blockchain anchor!
        record_hash, tx = anchor_to_blockchain(prescription)

        pdf_buffer = generate_prescription_pdf(prescription)
        _send_prescription_pdf_email(prescription, pdf_buffer)
        return {
            "message": "Prescription PDF sent to patient's email and blockchain hash anchored.",
            "blockchain": {"hash": record_hash, "tx": tx},
        }, 200
    except Exception as e:
        print(f"Exception during PDF email send: {e}")
        return {"error": f"Failed to send PDF email: {str(e)}"}, 500


@pharmacy_bp.route(
    "/prescriptions/<int:prescription_id>/send_pdf_bill", methods=["POST"]
)
def send_prescription_bill_pdf_email_route(prescription_id):
    try:
        pres_result = (
            supabase.table("prescriptions")
            .select("*")
            .eq("id", prescription_id)
            .limit(1)
            .execute()
        )
        pres_data = (
            getattr(pres_result, "data", None)
            if hasattr(pres_result, "data")
            else pres_result.get("data")
            if isinstance(pres_result, dict)
            else None
        )
        if not pres_data:
            return {"error": f"Prescription with ID {prescription_id} not found."}, 404
        prescription = pres_data[0]
        bill_data = request.json if request.is_json else None
        if not bill_data:
            return {"error": "Bill data required in body"}, 400
        bill_data["prescription_id"] = prescription_id
        bill_data["dob"] = clean_date(bill_data.get("dob"))
        bill_data["receipt_date"] = clean_date(bill_data.get("receipt_date"))
        if not bill_data.get("receipt_no") or bill_data.get("receipt_no") in [
            "AUTO-GEN",
            "AUTO",
            "",
        ]:
            bill_data["receipt_no"] = generate_unique_receipt_no(prescription_id)
        bill_insert = supabase.table("bills").insert([bill_data]).execute()
        bill_err = (
            getattr(bill_insert, "error", None)
            if hasattr(bill_insert, "error")
            else bill_insert.get("error")
            if isinstance(bill_insert, dict)
            else None
        )
        if bill_err:
            return {"error": f"Failed to store bill: {bill_err}"}, 500

        # Blockchain anchor!
        record_hash, tx = anchor_to_blockchain(prescription)

        pdf_buffer = generate_bill_and_prescription_pdf(prescription, bill_data)
        _send_prescription_pdf_email(prescription, pdf_buffer, "Prescription_Bill.pdf")
        return {
            "message": "Prescription and bill PDF emailed, bill stored, and blockchain hash anchored!",
            "blockchain": {"hash": record_hash, "tx": tx},
        }, 200
    except Exception as e:
        print(f"Exception during PDF+bill email send: {e}")
        return {"error": f"Failed to process: {str(e)}"}, 500
