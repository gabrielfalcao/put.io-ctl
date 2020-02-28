from pygments.lexer import RegexLexer
from pygments.token import String, Keyword, Operator, Error, Number


class PutioLexer(RegexLexer):
    name = 'Putio'
    aliases = ['putio']
    filenames = ['*.putio']

    tokens = {
        'root': [
            (r'^(cd|ls) ', Keyword),
            (r'^(q|quit)$', Operator),
            (r'^(slugify)$', Keyword),
            (r'\d+', Number),
            (r'.*[.]\w+$', String),
        ],
    }
