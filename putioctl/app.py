from pathlib import Path
from prompt_toolkit import PromptSession
from prompt_toolkit.lexers import PygmentsLexer
from pygments.lexers.sql import SqlLexer
from putioctl.models import SessionState


__cache__ = {}


def initialize_session():
    session = __cache__.get('session')
    if not session:
        __cache__['session'] = PromptSession(lexer=PygmentsLexer(SqlLexer))

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
                text = self.session.prompt('> ')
            except KeyboardInterrupt:
                print('\n\rCONTROL-C')
                break
            except EOFError:
                break
            else:
                self.handle(text)

    def handle(self, text):
        if text == 'q':
            return self.quit()
        if text == 'ls':
            return self.list_files()
        if text.startswith('cd '):
            return self.change_parent(text)
        print('You entered:', text)

    def change_parent(self, text):
        self.parent_id = self.state.current_parent_id

        if not self.tree:
            self.refresh()
        name = text.split('cd ', 1)[-1]

        if name == '..':
            self.state.data['current_parent_id'] = self.stack.pop(-1)
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
                return

        print(f'the folder {name!r} does not exist in the current directory')

    def refresh(self):
        children = self.client.get_files(
            parent_id=self.state.current_parent_id
        )
        self.tree[self.state.current_parent_id] = children
        for child in children:
            if child.file_type == 'FOLDER':
                if child.id not in self.tree:
                    self.tree[child.id] = []
            else:
                self.files[child.id] = child

    def list_files(self):
        self.refresh()
        print(self.children.format_pretty_table())

    def quit(self):
        self.__should_run__ = False
        self.save_state()

    def save_state(self):
        self.state.update(dict(
            tree=self.tree,
            files=self.files
        ))
        with self.state_path.open('w') as fd:
            fd.write(self.state.to_json())

    @property
    def children(self):
        if self.state.current_parent_id not in self.tree:
            return []

        return self.tree[self.state.current_parent_id]
