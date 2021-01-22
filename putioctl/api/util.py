from putioctl.api.models import Transfer
from itertools import chain
from inquirer.shortcuts import confirm
from putioctl.util import terminal_log


def clean_transfers(client, transfers, yes=False, quiet=False):
    if transfers:
        terminal_log(transfers.format_pretty_table(), quiet=quiet)
    if transfers and (yes or confirm(
        f"Do you want to cancel all the transfers above ?", default=True
    )):
        canceled = Transfer.List(chain(*list(map(client.cancel_transfers, transfers))))
        if canceled:
            terminal_log(f"canceled {len(canceled)} transfers", quiet=quiet)

    completed = client.get_transfers().filter_by("status", "COMPLETED")
    if completed:
        terminal_log(completed.format_pretty_table(), quiet=quiet)
    if completed and (yes or confirm(
        f"Do you want to clean the completed transfers above ?", default=True
    )):
        cleaned = Transfer.List(chain(*list(map(client.clean_transfers, completed))))
        if cleaned:
            terminal_log(f"cleaned {len(cleaned)} transfers", quiet=quiet)
