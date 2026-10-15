from pathlib import Path

from django.core.exceptions import ValidationError


MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def validate_product_image(upload):
    if upload.size > MAX_PRODUCT_IMAGE_SIZE:
        raise ValidationError("Product images must be 5 MB or smaller.")

    extension = Path(upload.name).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError("Upload a JPG, PNG, or WEBP image.")

    content_type = getattr(upload, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError("The uploaded file is not a supported image type.")

    upload.seek(0)
    header = upload.read(12)
    upload.seek(0)
    valid_signature = (
        (extension in {".jpg", ".jpeg"} and header.startswith(b"\xff\xd8\xff"))
        or (extension == ".png" and header.startswith(b"\x89PNG\r\n\x1a\n"))
        or (extension == ".webp" and header.startswith(b"RIFF") and header[8:12] == b"WEBP")
    )
    if not valid_signature:
        raise ValidationError("The uploaded file does not contain a valid image.")
