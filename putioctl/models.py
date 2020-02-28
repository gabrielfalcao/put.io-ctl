# -*- coding: utf-8 -*-

from putioctl.libmodels import Model


class SessionState(Model):
    """contains the application state of a putioctl session"""

    __visible_atttributes__ = [
        "tree",
        "files",
        "current_parent_id",
    ]

    @property
    def tree(self):
        return self.get('tree') or {}

    @property
    def files(self):
        return self.get('files') or {}

    @property
    def current_parent_id(self):
        return self.get('current_parent_id')
