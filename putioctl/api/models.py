# -*- coding: utf-8 -*-
import pendulum
from humanfriendly import format_size

from putioctl.libmodels import Model, ensure_datetime


class Transfer(Model):
    """wraps the responses of putio v2 API"""

    __visible_atttributes__ = [
        "id",
        "status",
        "availability",
        "human_size",
        "human_downloaded",
        "title",
        "started_at",
        "finished_at",
        "created_at",
    ]

    @property
    def created_at(self):
        return ensure_datetime(self.get("created_at")).diff_for_humans()

    @property
    def started_at(self):
        return ensure_datetime(self.get("started_at")).diff_for_humans()

    @property
    def finished_at(self):
        return ensure_datetime(self.get("finished_at")).diff_for_humans()

    @property
    def relative_creation_date(self):
        diff = pendulum.now() - self.created_at
        return f"{diff.in_words()} ago"

    @property
    def status(self) -> str:
        return self.get("status") or "UNKNOWN"

    @property
    def id(self) -> str:
        return self.get("id")

    @property
    def downloaded(self) -> int:
        return int(self.get("downloaded") or -1)

    @property
    def human_downloaded(self) -> int:
        return format_size(self.downloaded)

    @property
    def name(self) -> str:
        return self.get("name") or ""

    @property
    def title(self) -> str:
        return self.name[:60]

    @property
    def availability(self) -> int:
        return int(self.get("availability") or -1)

    @property
    def size(self) -> int:
        return int(self.get("size") or -1)

    @property
    def human_size(self) -> int:
        return format_size(self.size)


class File(Model):
    """wraps the responses of putio v2 API"""

    __visible_atttributes__ = [
        "id",
        "name",
        "human_size",
        "parent_id",
        "created_at_human",
        "updated_at_human",
        "file_type",
        # "is_mp4_available",
        # "is_shared",
        # "is_hidden",
    ]

    @property
    def created_at(self):
        return ensure_datetime(self.get("created_at"))

    @property
    def updated_at(self):
        return ensure_datetime(self.get("updated_at"))

    @property
    def created_at_human(self):
        return self.created_at.diff_for_humans()

    @property
    def updated_at_human(self):
        return self.updated_at.diff_for_humans()

    @property
    def id(self) -> str:
        return self.get("id")

    @property
    def downloaded(self) -> str:
        return self.get("downloaded")

    @property
    def name(self) -> str:
        return self.get("name") or ""

    @property
    def extension(self) -> str:
        return self.get("extension") or ""

    @property
    def screenshot(self) -> str:
        return self.get("screenshot") or ""

    @property
    def crc32(self) -> str:
        return self.get("crc32") or ""

    @property
    def is_mp4_available(self) -> bool:
        return self.getbool("is_mp4_available")

    @property
    def is_shared(self) -> bool:
        return self.getbool("is_shared")

    @property
    def is_hidden(self) -> bool:
        return self.getbool("is_hidden")

    @property
    def title(self) -> str:
        return self.name[:60]

    @property
    def size(self) -> int:
        return int(self.get("size") or -1)

    @property
    def human_size(self) -> int:
        return format_size(self.size)

    @property
    def file_type(self) -> str:
        return self.get("file_type") or ""
