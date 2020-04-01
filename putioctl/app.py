import os
import re
from pathlib import Path
from prompt_toolkit import PromptSession
from prompt_toolkit.lexers import PygmentsLexer

from putioctl.models import SessionState
from putioctl.util import slugify
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.styles import Style
from putioctl.api.util import clean_transfers
from .pyglexer import PutioLexer

__cache__ = {}

style = Style.from_dict(
    {
        "completion-menu.completion": "bg:#008888 #ffffff",
        "completion-menu.completion.current": "bg:#00aaaa #000000",
        "scrollbar.background": "bg:#88aaaa",
        "scrollbar.button": "bg:#222222",
    }
)

COMMANDS = ['ls', 'cd', 'q', 'quit', 'slugify', 't', 'transfers', 'clean']


def initialize_session():
    session = __cache__.get('session')
    if not session:
        __cache__['session'] = PromptSession(
            lexer=PygmentsLexer(PutioLexer),
            completer=WordCompleter(COMMANDS),
            style=style,
        )

    return __cache__['session']


class Application(object):

    state = None
    def __init__(self, session, client):
        self.session = session
        self.client = client
        self.__should_run__ = True
        self.state_path = Path('.state.json')
        self.files = {}
        self.tree = {}
        self.stack = [0]
        if self.state_path.is_file():
            with self.state_path.open('rb') as fd:
                raw = fd.read()
                if raw:
                    self.state = SessionState.from_json(raw)

        if not self.state:
            self.state = SessionState({
                'current_parent_id': 0,
                'tree': {},
            })

    def run(self):
        while self.__should_run__:
            try:
                text = self.session.prompt('$ ')
            except KeyboardInterrupt:
                print('\n\rCONTROL-C')
                break
            except EOFError:
                break
            else:
                self.handle(text)

    def handle(self, text):
        if not text:
            return
        for regex, callback in self.routes:
            match = re.search(regex, text)
            if match:
                return callback(**match.groupdict())

        return self.handle_unknown(text)

    @property
    def routes(self):
        return {
            r'^(q|quit)': self.quit,
            r'^(slugify)': self.slugify_files,
            r'^cd\s+(?P<name>[^/]+)': self.change_parent,
            r'^cd$': self.cd_home,
            r'^ls': self.list_files,
            r'^(t|transfers)': self.list_transfers,
            r'^(clean)': self.clean_transfers,
        }.items()

    def cd_home(self):
        self.stack.append(0)
        self.state.data['current_parent_id'] = 0
        return self.refresh()

    def handle_unknown(self, text):
        print('unrecognized command:', text)

    def change_parent(self, name):
        if '/' in name:
            raise NotImplementedError("don't support changing by path for now")

        if not self.tree:
            self.refresh()

        if name == '..':
            self.state.data['current_parent_id'] = self.stack.pop(-1)
            self.refresh()
            return

        for child in self.children:
            if child.name != name:
                continue
            elif not child.file_type == 'FOLDER':
                print('not a folder:\n{child.format_robust_table()}')
                return
            else:
                self.state.data['current_parent_id'] = child.id
                self.stack.append(child.id)
                self.refresh()
                return

        print(f'the folder {name!r} does not exist in the current directory')

    def refresh(self):
        children = self.client.get_files(
            parent_id=self.state.current_parent_id
        )
        self.tree[self.state.current_parent_id] = children
        completion = []
        for child in children:
            completion.append(child.name)
            if child.file_type == 'FOLDER':

                if child.id not in self.tree:
                    self.tree[child.id] = []
            else:
                self.files[child.id] = child

        self.session.completer.words = COMMANDS + completion

    def list_files(self):
        self.refresh()
        print(self.children.format_pretty_table())

    def list_transfers(self):
        self.refresh()
        transfers = self.client.get_transfers()
        if transfers:
            print(transfers.format_pretty_table())

    def clean_transfers(self):
        self.refresh()
        transfers = self.client.get_transfers()
        clean_transfers(self.client, transfers)  #, yes=True)

    def slugify_files(self):
        self.refresh()
        for child in self.children:
            name, extension = os.path.splitext(child.name)
            new_name = slugify(name).lower()
            if new_name == name:
                continue

            new_name = f'{new_name}{extension}'
            self.client.rename_file(
                file_id=child.id,
                name=new_name,
            )
            print(f'renamed {child.id} to {new_name!r}')

        self.list_files()

    def quit(self):
        self.__should_run__ = False
        self.save_state()

    def save_state(self):
        self.state.update(dict(
            tree=self.tree,
            files=self.files,
            current_parent_id=0,
        ))
        with self.state_path.open('w') as fd:
            fd.write(self.state.to_json())

    @property
    def children(self):
        if self.state.current_parent_id not in self.tree:
            return []

        return self.tree[self.state.current_parent_id]
