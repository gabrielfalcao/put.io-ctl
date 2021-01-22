# -*- coding: utf-8 -*-
import sys
import os
import click
import logging
from fnmatch import fnmatch
from pathlib import Path
from inquirer.shortcuts import confirm
from putioctl import version
from putioctl.util import slugify
# from putioctl.logs import set_debug_mode
from putioctl.api.client import PutIOClient, ClientError
from putioctl.logs import set_log_level_by_name
from putioctl.logs import install
from putioctl.app import initialize_session, Application
from putioctl.api.models import Transfer
from putioctl.api.util import clean_transfers
logger = logging.getLogger("putio-ctl")


level_choices = click.Choice(
    ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], case_sensitive=False
)

ENV_VAR_TOKEN = "PUTIO_CTL_TOKEN"
TOKEN = os.getenv(ENV_VAR_TOKEN)

if not TOKEN:
    logger.error("missing PUTIO_CTL_TOKEN environment variable")
    raise SystemExit(1)


def entrypoint():
    try:
        return main()
    except ClientError as e:
        print(e)
        raise SystemExit(1)


@click.group()
@click.option("--loglevel", default="INFO", type=level_choices)
@click.option("--token", default=TOKEN, help=f'defaults to the value of environment variable {ENV_VAR_TOKEN}')
@click.pass_context
def main(ctx, loglevel, token):
    "putio-ctl command-line manager"
    install(loglevel)
    set_log_level_by_name(loglevel)

    if not token:
        raise RuntimeError(
            f"please set the env var {ENV_VAR_TOKEN} or pass a --token option with a valid put.io access token"
        )
    ctx.obj = PutIOClient(token)


@main.command(name="version")
def print_version():
    "prints the version to the STDOUT"
    print(f"putio-ctl {version} / {sys.platform}")


def only_unavailable(transfer) -> bool:
    # WARNING don't allow WAITING because the availability might be uncertain
    status = transfer.status.upper()
    availability = transfer.availability
    if status == "ERROR":
        return True
    return any([
        all((status == "DOWNLOADING", availability < 100)),
        all((status == "SEEDING", availability < 100)),
        # all((status == "WAITING", availability < 100)),
    ])


@main.command("clean")
@click.option('-q', '--quiet', help='disable verbosity', is_flag=True)
@click.option('-y', '--yes', help='answer yes to all questions', is_flag=True)
@click.option('--nofilter', help='remove all transfers', is_flag=True)
@click.pass_context
def clean(ctx, yes, nofilter, quiet):
    "clean unavailable transfers"

    all_transfers = ctx.obj.get_transfers()

    if nofilter:
        transfers = all_transfers
    else:
        transfers = all_transfers.filter(only_unavailable)

    clean_transfers(ctx.obj, transfers, yes=yes, quiet=quiet)

    remaining_transfers = all_transfers.filter(lambda t: t.status.upper() not in ('SEEDING', 'DOWNLOADING')).format_pretty_table()
    if not quiet:
        print(remaining_transfers)


def validate_filters(filters) -> list:
    result = []
    for part in filters:
        if part.count("="):
            key, value = part.split("=", 1)
            result.append(lambda i: fnmatch(str(i[key] or '').lower(), value.lower()))
        elif part.count("<"):
            key, value = part.split("<", 1)
            result.append(lambda i: int(getattr(i, key)) < int(value))
        elif part.count(">"):
            key, value = part.split(">", 1)
            result.append(lambda i: int(getattr(i, key)) > int(value))
        else:
            raise RuntimeError(f"invalid filter {part!r}")

    return result

def validate_sorts(sorts, Model) -> list:
    kwargs_list = []
    for part in sorts:
        reverse = part.startswith('-')
        attr = reverse and part[1:] or part
        if not hasattr(Model, attr):
            raise RuntimeError(f"invalid attribute {Model.__name__}.{attr!r}")

        kwargs_list.append({
            'key': lambda x: getattr(x, attr),
            'reverse': reverse
        })
    return kwargs_list


@main.command("transfers")
@click.option("-f", "--filter-by", multiple=True)
@click.option("-s", "--sort-by", multiple=True)
@click.pass_context
def transfers(ctx, filter_by, sort_by):
    "list transfers"

    transfers = ctx.obj.get_transfers()

    filters = validate_filters(filter_by)
    for func in filters:
        transfers = transfers.filter(func)

    sorts = validate_sorts(sort_by, Transfer)
    for kwargs in sorts:
        transfers = transfers.sorted(**kwargs)

    print(transfers.format_pretty_table())
    # if transfers:
    #     print(transfers[0].to_json(indent=4))


@main.command("files")
@click.argument("parent_id", default=None)
@click.option("-f", "--filter-by", multiple=True)
@click.option("-s", "--sort-by", multiple=True)
@click.option("--only", default=None)
@click.option('--delete', help='delete matching files', is_flag=True)
@click.pass_context
def files(ctx, parent_id, filter_by, sort_by, only, delete):
    "list files"

    if parent_id == "all":
        parent_id = -1
    files = ctx.obj.get_files(parent_id=parent_id)

    filters = validate_filters(filter_by)
    for func in filters:
        files = files.filter(func)

    sorts = validate_sorts(sort_by)
    for kwargs in sorts:
        files = files.sorted(**kwargs)

    if delete:
        for file in files:
            ctx.obj.delete_files([file.id])
            print(f'Deleted {file.human_size}: {file.name}')

    elif only:
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
@click.option("-y", '--yes', is_flag=True)
@click.pass_context
def cancel(ctx, transfer_id, yes):
    "clean unavailable transfers"

    transfers = ctx.obj.get_transfers()

    if transfer_id != "all":
        transfers = transfers.filter_by("id", int(transfer_id))

    if transfers:
        print(transfers.format_pretty_table())

    clean_transfers(ctx, transfers, yes=yes)


@main.command("delete")
@click.argument("file_ids", type=int, nargs=-1)
@click.pass_context
def delete(ctx, file_ids):
    "delete files"

    deleted = list(map(ctx.obj.delete_files, file_ids))
    print(deleted)


@main.command("upload")
@click.argument("filename")
@click.option("-p", "--parent-id", default="691629620", type=int)
@click.pass_context
def upload(ctx, filename, parent_id):
    "upload a file"

    path = Path(filename)
    if not path.exists():
        raise IOError(f'{path} does not exist')

    if not path.is_file():
        raise IOError(f'{path} is not a valid file')

    transfer = ctx.obj.upload_file(
        parent_id=parent_id,
        name=path.name,
        file=path.open('rb')
    )
    print(transfer.format_robust_table())


@main.command("slugify")
@click.argument("parent_id", type=int)
@click.option('-y', '--yes', help='answer yes to all questions', is_flag=True)
@click.pass_context
def slugify_files_from_parent(ctx, parent_id, yes):
    "slugify all files from a parent"

    children = ctx.obj.get_files(parent_id=parent_id)
    for child in children:
        if child.file_type == 'FOLDER':
            print(f'skipping folder {child.name} ({child.id})')
            continue

        name, extension = os.path.splitext(child.name)
        new_name = slugify(name).lower()
        if new_name == name:
            continue

        new_name = f'{new_name}{extension}'

        if yes or confirm(f'rename file {child.id} to {new_name!r} ?'):
            ctx.obj.rename_file(
                file_id=child.id,
                name=new_name,
            )
            print(f'renamed {child.id} to {new_name!r}')


@main.command("repl")
@click.pass_context
def launch_repl(ctx):
    "runs a REPL"

    session = initialize_session()
    app = Application(session, ctx.obj)
    app.run()
