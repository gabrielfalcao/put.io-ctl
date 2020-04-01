# -*- coding: utf-8 -*-
from typing import Any, Dict
from uiclasses import Model


class SessionState(Model):
    """contains the application state of a putioctl session"""

    tree: Dict[str, Any]
    files: Dict[str, Any]
    current_parent_id: int
