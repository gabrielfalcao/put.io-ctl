import re
import json
import pendulum
from datetime import datetime


def pretty_json(data, indent=2):
    """serializes the given data into JSON with indentation"""
    return json.dumps(data, indent=2, default=str)


def slugify(text: str, separator: str = "-"):
    return re.sub(
        fr"[{separator}]+", separator,
        re.sub(r"[^a-zA-Z0-9-]+", separator, text).strip(separator))


def ensure_datetime(value):
    if isinstance(value, str):
        return pendulum.parse(value)
    if isinstance(value, datetime):
        return pendulum.instance(value)
    if isinstance(value, pendulum.DateTime):
        return value

    return value
