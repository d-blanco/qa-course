from datetime import date

CODES = {
    "SAVE15": {"type": "percent", "value": 15, "expires": date(2030, 12, 31)},
    "FIVEOFF": {"type": "fixed", "value": 500, "expires": date(2030, 12, 31)},
    "SUMMER20": {"type": "percent", "value": 20, "expires": date(2025, 8, 31)},
}


class InvalidCodeError(ValueError):
    pass


class ExpiredCodeError(ValueError):
    pass


def calculate_discount(subtotal, code, today=None):
    """Return the discount in cents for a subtotal in cents."""
    if not code or not code.strip():
        return 0

    discount = CODES.get(code.strip().upper())
    if discount is None:
        raise InvalidCodeError("That code isn't valid.")

    today = today or date.today()
    if today > discount["expires"]:
        raise ExpiredCodeError("This code has expired.")

    if discount["type"] == "percent":
        amount = (subtotal * discount["value"] + 50) // 100
    else:
        amount = discount["value"]
    return min(amount, subtotal)
