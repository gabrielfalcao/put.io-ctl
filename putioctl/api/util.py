from putioctl.api.models import Transfer


def clean_transfers(client, transfers, yes=False):
    if transfers:
        print(transfers.format_pretty_table())
    if transfers and (yes or confirm(
        f"Do you want to cancel all the transfers above ?", default=True
    )):
        canceled = Transfer.List(chain(*list(map(client.cancel_transfers, transfers))))
        if canceled:
            print(f"canceled {len(canceled)} transfers")

    completed = client.get_transfers().filter_by("status", "COMPLETED")
    if completed:
        print(completed.format_pretty_table())
    if completed and (yes or confirm(
        f"Do you want to clean the completed transfers above ?", default=True
    )):
        cleaned = Transfer.List(chain(*list(map(client.clean_transfers, completed))))
        if cleaned:
            print(f"cleaned {len(cleaned)} transfers")
