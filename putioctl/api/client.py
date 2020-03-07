# -*- coding: utf-8 -*-
import requests
import logging
from typing import List, IO
from putioctl.util import slugify, pretty_json
from putioctl.api.models import File, Transfer

logger = logging.getLogger(__name__)


class ClientError(Exception):
    def __init__(self, response: requests.Response):
        self.response = response
        msg = '\n'.join([
            f'failed {response.request.method} {response.request.url}',
            f'{response.request.body}',
            f'{pretty_json(dict(response.request.headers))}',
            f'failed with response {response.status_code}:',
            f'{pretty_json(dict(response.headers))}',
            f'{pretty_json(response.json())}',
        ])
        super().__init__(msg)


class PutIOClient(object):
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Accept": "application/json",
            "Authorization": f"token {token}",
        }
        self.http = requests.Session()
        self.http.headers.update(self.headers)

    def url(self, *path):
        parts = ["https://api.put.io/v2"]
        parts.extend(path)
        url = "/".join([p.strip("/") for p in parts])
        logger.debug(f"url: {url!r}")
        return url

    def get_transfers(self) -> List[Transfer]:
        response = self.http.get(self.url("/transfers/list"))
        data = response.json()
        transfers = data.get("transfers")
        return Transfer.List(transfers).sorted_by("status")

    def cancel_transfers(self, *transfers: List[Transfer]):
        response = self.http.post(
            self.url("/transfers/cancel"),
            data={"transfer_ids": [t.id for t in transfers]},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code == 200:
            return Transfer.List(transfers)

        raise ClientError(response)

    def clean_transfers(self, *transfers: List[Transfer]):
        response = self.http.post(
            self.url("/transfers/clean"),
            data={"transfer_ids": [t.id for t in transfers]},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code == 200:
            return Transfer.List(transfers)

        raise ClientError(response)

    def get_files(
        self, parent_id: str = None, file_type: str = None, per_page: int = 1000
    ) -> List[File]:
        params = {"per_page": per_page}
        if parent_id:
            params["parent_id"] = parent_id
        if file_type:
            params["file_type"] = file_type

        response = self.http.get(self.url(f"/files/list"), params=params)
        data = response.json()
        result = files = data.get("files") or []
        cursor = data["cursor"]
        while cursor:
            response = self.http.post(
                self.url(f"/files/list/continue"),
                data={"cursor": cursor, "per_page": per_page},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if response.status_code != 200:
                raise ClientError(response)

            data = response.json()
            files = data.get("files") or []
            result.extend(files)
            cursor = data["cursor"]

        return File.List(result).sorted_by("updated_at")

    def get_download_url(self, file_id: int) -> str:
        if not isinstance(file_id, int):
            raise RuntimeError(f"{file_id!r} is not an integer")

        response = self.http.get(self.url(f"/files/{file_id}/url"))
        if response.status_code == 200:
            data = response.json()
            return data["url"]

        raise ClientError(response)

    def delete_files(self, file_ids: List[int]) -> List[File]:
        if not isinstance(file_ids, (int, list)):
            raise RuntimeError(f"{file_ids!r} is not an integer")

        response = self.http.post(
            self.url("/files/delete"),
            data={"file_ids": file_ids},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code == 200:
            return file_ids

        raise ClientError(response)

    def rename_file(self, file_id: int, name: str) -> int:
        if not isinstance(file_id, int):
            raise RuntimeError(f"{file_id!r} is not an integer")

        response = self.http.post(
            self.url("/files/rename"),
            data={"file_id": file_id, "name": name},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code == 200:
            return file_id

        raise ClientError(response)

    def upload_file(self, parent_id: int, name: str, file: IO) -> Transfer:
        if not isinstance(parent_id, int):
            raise RuntimeError(f"{parent_id!r} is not an integer")

        filename = slugify(name)
        response = self.http.post(
            self.url("/files/upload"),
            data={"parent_id": parent_id, "filename": filename},
            files={"file": file},
        )

        if response.status_code == 200:
            return Transfer(response.json())

        raise ClientError(response)
