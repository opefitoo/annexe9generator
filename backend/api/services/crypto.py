"""
Cryptographic utilities for secure signature storage.

Uses Fernet symmetric encryption (AES-128-CBC with HMAC).
"""

import base64
import os
from typing import Optional

from cryptography.fernet import Fernet
from django.conf import settings


def get_encryption_key() -> bytes:
    """
    Get or generate the encryption key for signatures.

    The key should be stored securely in environment variables.
    """
    key = getattr(settings, 'SIGNATURE_ENCRYPTION_KEY', None)

    if not key:
        # Try environment variable
        key = os.environ.get('SIGNATURE_ENCRYPTION_KEY')

    if not key:
        # Generate a key for development (NOT for production!)
        # In production, this should be set in environment
        import warnings
        warnings.warn(
            "SIGNATURE_ENCRYPTION_KEY not set! Using generated key. "
            "This is insecure for production.",
            RuntimeWarning
        )
        key = Fernet.generate_key().decode()

    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()

    return key


def encrypt_signature(data: bytes) -> bytes:
    """
    Encrypt signature data using Fernet encryption.

    Args:
        data: Raw signature data (typically PNG image bytes)

    Returns:
        Encrypted data
    """
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(data)


def decrypt_signature(encrypted_data: bytes) -> bytes:
    """
    Decrypt signature data.

    Args:
        encrypted_data: Encrypted signature data

    Returns:
        Decrypted raw data
    """
    key = get_encryption_key()
    f = Fernet(key)
    return f.decrypt(encrypted_data)


def encode_base64_to_bytes(base64_data: str) -> bytes:
    """
    Convert base64 data URL to raw bytes.

    Args:
        base64_data: Data URL string (e.g., "data:image/png;base64,...")

    Returns:
        Raw bytes
    """
    # Remove data URL prefix if present
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]

    return base64.b64decode(base64_data)


def bytes_to_base64_data_url(data: bytes, mime_type: str = 'image/png') -> str:
    """
    Convert raw bytes to base64 data URL.

    Args:
        data: Raw bytes
        mime_type: MIME type of the data

    Returns:
        Data URL string
    """
    base64_str = base64.b64encode(data).decode('utf-8')
    return f"data:{mime_type};base64,{base64_str}"
