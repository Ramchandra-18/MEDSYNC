from flask import Blueprint

pharmacy_bp = Blueprint('pharmacy', __name__)

from . import routes
