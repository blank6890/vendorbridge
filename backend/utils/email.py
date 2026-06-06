"""
Email utility using Gmail SMTP (via smtplib).
Uses app password from .env for authentication.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from config import MAIL_EMAIL, MAIL_PASSWORD


def send_email(to, subject, body, attachment=None, attachment_filename="attachment.pdf"):
    """Send an email via Gmail SMTP.

    Args:
        to: Recipient email address (str or list of str).
        subject: Email subject line.
        body: Email body text (HTML supported).
        attachment: Optional file bytes to attach (e.g., PDF bytes).
        attachment_filename: Filename for the attachment.

    Returns:
        dict with 'success' bool and 'message' string.
    """
    if not MAIL_EMAIL or not MAIL_PASSWORD:
        return {"success": False, "message": "Email credentials not configured in .env"}

    try:
        msg = MIMEMultipart()
        msg["From"] = MAIL_EMAIL
        msg["To"] = to if isinstance(to, str) else ", ".join(to)
        msg["Subject"] = subject

        # Attach body as HTML
        msg.attach(MIMEText(body, "html"))

        # Attach file if provided
        if attachment:
            part = MIMEApplication(attachment, Name=attachment_filename)
            part["Content-Disposition"] = f'attachment; filename="{attachment_filename}"'
            msg.attach(part)

        # Send via Gmail SMTP
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(MAIL_EMAIL, MAIL_PASSWORD)
            recipients = [to] if isinstance(to, str) else to
            server.sendmail(MAIL_EMAIL, recipients, msg.as_string())

        return {"success": True, "message": f"Email sent to {to}"}

    except smtplib.SMTPAuthenticationError:
        return {"success": False, "message": "SMTP authentication failed. Check MAIL_EMAIL and MAIL_PASSWORD in .env"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send email: {str(e)}"}
