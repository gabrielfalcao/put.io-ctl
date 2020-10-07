import re
import json
import logging
import pendulum

from datetime import datetime

logger = logging.getLogger(__name__)

def pretty_json(data, indent=2):
    """serializes the given data into JSON with indentation"""
    return json.dumps(data, indent=2, default=str)


def slugify(text: str, separator: str = "-"):
    return re.sub(
        fr"[{separator}]+", separator,
        re.sub(r"[^a-zA-Z0-9-]+", separator, text).strip(separator))


def ensure_datetime(value):
    try:
        if isinstance(value, str):
            return pendulum.parse(value, strict=False)
        if isinstance(value, datetime):
            return pendulum.instance(value)
        if isinstance(value, pendulum.DateTime):
            return value
    except Exception as e:
        logger.debug(f'failed to parse datetime from {value!r}: {e}')
    return value
