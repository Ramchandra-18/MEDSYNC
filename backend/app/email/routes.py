from . import email_bp

@email_bp.route('/send', methods=['POST'])
def send_email():
    return {"message": "Email send endpoint"}
