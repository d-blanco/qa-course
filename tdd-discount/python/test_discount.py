from datetime import date

import pytest

from discount import ExpiredCodeError, InvalidCodeError, calculate_discount

TODAY = date(2026, 1, 15)


def test_no_code_gives_no_discount():
    assert calculate_discount(7998, "", TODAY) == 0


def test_tc_3_1_percent_code_takes_percentage_off():
    assert calculate_discount(7998, "SAVE15", TODAY) == 1200


def test_tc_3_1_percent_code_rounds_half_cent_up():
    assert calculate_discount(2990, "SAVE15", TODAY) == 449


def test_tc_3_1_fixed_code_takes_amount_off():
    assert calculate_discount(7998, "FIVEOFF", TODAY) == 500


@pytest.mark.parametrize("code", ["save15", "Save15", " SAVE15 "])
def test_tc_3_2_code_ignores_case_and_spaces(code):
    assert calculate_discount(7998, code, TODAY) == 1200


def test_tc_3_3_unknown_code_is_rejected():
    with pytest.raises(InvalidCodeError, match="That code isn't valid."):
        calculate_discount(7998, "BOGUS", TODAY)


def test_tc_3_3_code_is_valid_on_its_expiry_date():
    assert calculate_discount(1000, "SUMMER20", date(2025, 8, 31)) == 200


def test_tc_3_3_code_is_rejected_after_its_expiry_date():
    with pytest.raises(ExpiredCodeError, match="This code has expired."):
        calculate_discount(1000, "SUMMER20", date(2025, 9, 1))


@pytest.mark.parametrize("subtotal, expected", [(300, 300), (500, 500), (501, 500)])
def test_tc_3_5_discount_never_exceeds_subtotal(subtotal, expected):
    assert calculate_discount(subtotal, "FIVEOFF", TODAY) == expected
