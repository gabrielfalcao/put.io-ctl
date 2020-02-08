# -*- coding: utf-8 -*-
import sys
import os
import click
import logging
from inquirer.shortcuts import confirm
from itertools import chain
from putioctl import version
from fnmatch import fnmatch

# from putioctl.logs import set_debug_mode
from putioctl.api.client import PutIOClient
from putioctl.api.models import Transfer, File
from putioctl.logs import set_log_level_by_name
from putioctl.logs import install

logger = logging.getLogger("putio-ctl")


level_choices = click.Choice(
    ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], case_sensitive=False
)

TOKEN = os.getenv("PUTIOCTL_TOKEN")


@click.group()
@click.option("--loglevel", default="INFO", type=level_choices)
@click.option("--token", default=TOKEN)
@click.pass_context
def main(ctx, loglevel, token):
    "putio-ctl command-line manager"
    install(loglevel)
    set_log_level_by_name(loglevel)

    if not token:
        raise RuntimeError(
            'please pass a --token argument with a valid put.io access token'
        )
    ctx.obj = PutIOClient(token)


@main.command(name="version")
def print_version():
    "prints the version to the STDOUT"
    print(f"putio-ctl {version} / {sys.platform}")


def only_unavailable(transfer) -> bool:
    status = transfer.status.upper()
    availability = transfer.availability
    return all((status == "DOWNLOADING", availability < 100)) or all(
        (status == "SEEDING", availability < 100)
    )


@main.command("clean")
@click.pass_context
def clean(ctx):
    "clean unavailable transfers"

    transfers = ctx.obj.get_transfers().filter(only_unavailable)
    clean_transfers(ctx, transfers)


def clean_transfers(ctx, transfers):
    if transfers:
        print(transfers.format_pretty_table())
    if transfers and confirm(
        f"Do you want to cancel all the transfers above ?", default=True
    ):
        canceled = Transfer.List(chain(*list(map(ctx.obj.cancel_transfers, transfers))))
        if canceled:
            print(f"canceled {len(canceled)} transfers")

    completed = ctx.obj.get_transfers().filter_by("status", "COMPLETED")
    if completed:
        print(completed.format_pretty_table())
    if completed and confirm(
        f"Do you want to clean the completed transfers above ?", default=True
    ):
        cleaned = Transfer.List(chain(*list(map(ctx.obj.clean_transfers, completed))))
        if cleaned:
            print(f"cleaned {len(cleaned)} transfers")


def validate_filters(filters) -> list:
    result = []
    for part in filters:
        if part.count("="):
            key, value = part.split("=", 1)
            result.append(lambda i: i.attribute_matches_glob(key, value))
        elif part.count("<"):
            key, value = part.split("<", 1)
            result.append(lambda i: int(getattr(i, key)) < int(value))
        elif part.count(">"):
            key, value = part.split(">", 1)
            result.append(lambda i: int(getattr(i, key)) > int(value))
        else:
            raise RuntimeError(f"invalid filter {part!r}")

    return result


@main.command("transfers")
@click.option("-f", "--filter-by", multiple=True)
@click.pass_context
def transfers(ctx, filter_by):
    "list transfers"

    transfers = ctx.obj.get_transfers()

    filters = validate_filters(filter_by)
    for func in filters:
        transfers = transfers.filter(func)

    print(transfers.format_pretty_table())
    # if transfers:
    #     print(transfers[0].to_json(indent=4))


@main.command("files")
@click.argument("parent_id", default=None)
@click.option("-f", "--filter-by", multiple=True)
@click.option("--only", default=None)
@click.pass_context
def files(ctx, parent_id, filter_by, only):
    "list files"

    if parent_id == "all":
        parent_id = -1
    files = ctx.obj.get_files(parent_id=parent_id)

    filters = validate_filters(filter_by)
    for func in filters:
        files = files.filter(func)

    if only:
        [print(getattr(i, only)) for i in files]
    else:
        print(files.sorted_by("size").format_pretty_table())


@main.command("download")
@click.argument("file_ids", type=int, nargs=-1)
@click.pass_context
def download(ctx, file_ids):
    "list files"

    print(ctx.obj.get_download_url(*file_ids))

    raise SystemExit(1)


@main.command("cancel")
@click.argument("transfer_id")
@click.pass_context
def cancel(ctx, transfer_id):
    "clean unavailable transfers"

    transfers = ctx.obj.get_transfers()

    if transfer_id != "all":
        transfers = transfers.filter_by("id", int(transfer_id))

    if transfers:
        print(transfers.format_pretty_table())

    clean_transfers(ctx, transfers)


@main.command("delete")
@click.argument("file_ids", type=int, nargs=-1)
@click.pass_context
def delete(ctx, file_ids):
    "delete files"

    deleted = list(map(ctx.obj.delete_files, file_ids))
    print(deleted)
