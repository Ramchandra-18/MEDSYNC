"""
Debug script to test restock alert email functionality
Run this to troubleshoot email sending issues
"""
import os
import sys
sys.path.append('.')

from app.auth.supabase_client import supabase
import datetime

def test_email_config():
    """Test email configuration"""
    print("=== EMAIL CONFIGURATION TEST ===")
    
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '465'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME') or os.getenv('GMAIL_USER')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD') or os.getenv('GMAIL_APP_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', MAIL_USERNAME)
    MAIL_FROM_NAME = os.getenv('GMAIL_FROM_NAME', 'MedSync')
    
    print(f"Mail Server: {MAIL_SERVER}")
    print(f"Mail Port: {MAIL_PORT}")
    print(f"Use TLS: {MAIL_USE_TLS}")
    print(f"Use SSL: {MAIL_USE_SSL}")
    print(f"Username: {MAIL_USERNAME}")
    print(f"Password: {'*' * len(MAIL_PASSWORD) if MAIL_PASSWORD else 'NOT SET'}")
    print(f"From Name: {MAIL_FROM_NAME}")
    print(f"Default Sender: {MAIL_DEFAULT_SENDER}")
    
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print("❌ EMAIL CREDENTIALS NOT CONFIGURED!")
        return False
    else:
        print("✅ Email credentials are set")
        return True

def test_inventory_query():
    """Test inventory query for low stock"""
    print("\n=== INVENTORY QUERY TEST ===")
    
    try:
        # Query medicines with low stock (<=10)
        query = supabase.table('pharmacy_inventory').select('*').lte('quantity', 10).order('quantity')
        result = query.execute()
        
        res_error = getattr(result, 'error', None) if hasattr(result, 'error') else result.get('error') if isinstance(result, dict) else None
        res_data = getattr(result, 'data', None) if hasattr(result, 'data') else result.get('data') if isinstance(result, dict) else None
        
        if res_error:
            print(f"❌ Database query error: {res_error}")
            return []
        
        low_stock_medicines = res_data or []
        print(f"✅ Found {len(low_stock_medicines)} medicines with quantity ≤10")
        
        for med in low_stock_medicines:
            print(f"  - {med['medicine_name']}: {med['quantity']} units (Expires: {med['expiry_date']})")
        
        return low_stock_medicines
    
    except Exception as e:
        print(f"❌ Exception during inventory query: {e}")
        return []

def test_email_sending(low_stock_medicines):
    """Test email sending with mock data"""
    print("\n=== EMAIL SENDING TEST ===")
    
    if not low_stock_medicines:
        print("⚠️ No low stock medicines found, creating mock data for test")
        low_stock_medicines = [
            {
                'medicine_name': 'Test Medicine 1',
                'quantity': 10,
                'expiry_date': '2025-12-31'
            },
            {
                'medicine_name': 'Test Medicine 2', 
                'quantity': 5,
                'expiry_date': '2026-06-30'
            }
        ]
    
    # Import email function
    from app.pharmacy.routes import _send_restock_alert_email
    
    # Categorize medicines
    critical_stock = [m for m in low_stock_medicines if m.get('quantity', 0) <= 5]
    low_stock = [m for m in low_stock_medicines if m.get('quantity', 0) > 5]
    
    try:
        print(f"Attempting to send email for {len(low_stock_medicines)} medicines...")
        print(f"Critical stock: {len(critical_stock)} medicines")
        print(f"Low stock: {len(low_stock)} medicines")
        
        _send_restock_alert_email(
            low_stock_medicines=low_stock_medicines,
            critical_stock=critical_stock,
            low_stock=low_stock,
            threshold=10
        )
        
        print("✅ Email sent successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False

def main():
    print("MedSync Restock Alert Email Debug Tool")
    print("=" * 50)
    
    # Test email configuration
    email_config_ok = test_email_config()
    
    if not email_config_ok:
        print("\n❌ Cannot proceed without email configuration. Please check your .env file.")
        return
    
    # Test inventory query
    low_stock_medicines = test_inventory_query()
    
    # Test email sending
    email_sent = test_email_sending(low_stock_medicines)
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    print(f"Email Config: {'✅ OK' if email_config_ok else '❌ FAILED'}")
    print(f"Inventory Query: {'✅ OK' if low_stock_medicines else '❌ NO DATA'}")
    print(f"Email Sending: {'✅ OK' if email_sent else '❌ FAILED'}")
    
    if email_config_ok and email_sent:
        print("\n✅ All tests passed! Check work.medsync@gmail.com for the alert email.")
    else:
        print("\n❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()