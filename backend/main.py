from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env before importing blueprints (which may read env at import time)
load_dotenv()

from app.auth import auth_bp
from app.email import email_bp
from app.staff import staff_bp
from app.doctor import doctor_bp
from app.pharmacy import pharmacy_bp
from app.patient import patient_bp


def create_app():
    app = Flask(__name__)
    
    # Enhanced CORS configuration to handle preflight OPTIONS requests
    CORS(app, 
         origins=["*"],  # Allow all origins in development
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)

    # Register blueprints with prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(email_bp, url_prefix='/api/email')
    app.register_blueprint(staff_bp, url_prefix='/api/staff')
    app.register_blueprint(doctor_bp, url_prefix='/api/doctor')
    app.register_blueprint(pharmacy_bp, url_prefix='/api/pharmacy')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')

    @app.route('/')
    def index():
        return {"message": "MedSync API running"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True,host="0.0.0.0")
