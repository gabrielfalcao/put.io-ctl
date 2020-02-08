"""
contains generic implementations used across the codebase. Mainly data-models
"""
import re
import json
import pendulum
import itertools
import logging

from datetime import datetime
from typing import List, Callable
from fnmatch import fnmatch
from functools import reduce

from humanfriendly.tables import format_robust_table, format_pretty_table
from .meta import (
    is_builtin_class_except,
    metaclass_declaration_contains_required_attribute,
)


ITERABLES = (list, tuple, itertools.chain, set, map)

logger = logging.getLogger(__name__)


def traverse_dict_children(data, *keys, fallback=None):
    """attempts to retrieve the config value under the given nested keys
    """
    value = reduce(lambda d, l: d.get(l, None) or {}, keys, data)
    return value or fallback


def pretty_json(data, indent=2):
    """serializes the given data into JSON with indentation"""
    return json.dumps(data, indent=2, default=str)


def repr_attributes(attributes: dict, separator: str = " "):
    """used for pretty-printing the attributes of a model
    :param attributes: a dict

    :returns: a string
    """
    return separator.join([f"{k}={v!r}" for k, v in attributes.items()])


def object_is_user_friendly(obj: object) -> bool:
    """check if the given object is user-friendly to be printed on the UI"""
    if isinstance(obj, UserFriendlyObject):
        return True

    if isinstance(obj, (list, tuple, set, bool, str, bytes, int)):
        return True

    return False


class UserFriendlyObject(object):
    def __ui_attributes__(self):
        return dict(
            [
                (key, value)
                for key, value in self.__dict__.items()
                if object_is_user_friendly(value)
            ]
        )

    def __ui_name__(self):
        return self.__class__.__name__

    def __repr__(self):
        attributes = repr_attributes(self.__ui_attributes__())
        return f"<{self.__ui_name__()} {attributes}>"

    def __str__(self):
        attributes = repr_attributes(self.__ui_attributes__(), ", ")
        return f"{self.__ui_name__()}({attributes})"


class DataBag(UserFriendlyObject):
    """base-class for config containers"""

    def __init__(self, data: dict = None, *args, **kw):
        data = data or {}
        if not isinstance(data, dict):
            raise TypeError(
                f"{self.__class__.__name__}() requires a dict object, "
                f"but instead got '{data} {type(data)}'."
            )

        self.__data__ = data

    def __bool__(self):
        return bool(self.__data__)

    @property
    def data(self):
        return self.__data__

    def update(self, other: dict):
        self.data.update(other or {})

    def traverse(self, *keys, fallback=None):
        """attempts to retrieve the config value under the given nested keys
        """
        value = traverse_dict_children(self.data, *keys, fallback=fallback)
        if isinstance(value, dict):
            return DataBagSection(value, *keys)

        return value

    def __ui_attributes__(self):
        """converts self.__data__ to dict to prevent recursion error
        """
        return dict(self.__data__)

    # very basic dict compatibility:

    def __iter__(self):
        return iter(self.__data__)

    def __getitem__(self, item):
        return self.__data__[item]

    def __setitem__(self, item, value):
        self.__data__[item] = value

    def keys(self):
        return self.__data__.keys()

    def items(self):
        return self.data.items()

    def values(self):
        return self.data.values()

    def get(self, *args, **kw):
        return self.data.get(*args, **kw)

    # other handy methods:

    def getbool(self, *args, **kw):
        """same as .get() but parses the string value into boolean: `yes` or
        `true`"""
        value = self.get(*args, **kw)
        if not isinstance(value, str):
            return bool(value)

        value = value.lower().strip()
        return value in ("yes", "true")


class DataBagSection(DataBag):
    def __init__(self, data, *location):
        self.location = location
        self.attr = ".".join(location)
        super().__init__(data)

    def __ui_attributes__(self):
        """converts self.__data__ to dict to prevent recursion error
        """
        return dict(self.__data__)

    def __ui_name__(self):
        return f"DataBagSection {self.attr!r} of "


def try_json(string: str) -> dict:
    try:
        return json.loads(string)
    except Exception:
        logger.exception(f"failed to parse json string {string!r}")


def slugify(text: str, separator: str = "-"):
    return re.sub(r"[^a-zA-Z0-9-]+", separator, text).strip(separator)


def ensure_datetime(value):
    if isinstance(value, str):
        return pendulum.parse(value)
    if isinstance(value, datetime):
        return pendulum.instance(value)
    if isinstance(value, pendulum.DateTime):
        return value

    return value


def is_builtin_model(target: type) -> bool:
    """returns ``True`` if the given type is a model subclass"""

    return is_builtin_class_except(target, ["MetaModel", "Model", "DataBag"])


def validate_model_declaration(cls, name, attrs):
    """validates model class definitions"""
    target = f"{cls}.__visible_atttributes__"

    if not is_builtin_model(cls):
        return

    visible_atttributes = metaclass_declaration_contains_required_attribute(
        cls, name, attrs, "visible_atttributes", str
    )

    if not isinstance(visible_atttributes, (tuple, list)):
        raise TypeError(f"{target} must be a list of strings")

    for index, field in enumerate(visible_atttributes):
        if isinstance(field, str):
            continue

        raise TypeError(
            f"{target}[{index}] should be a string, "
            f"but is {field!r} ({type(field)})"
        )


class MetaModel(type):
    """metaclass for data models
    """

    def __init__(cls, name, bases, attrs):
        if is_builtin_model(cls):
            return

        if not is_builtin_model(cls):
            validate_model_declaration(cls, name, attrs)

        super().__init__(name, bases, attrs)


class Model(DataBag, metaclass=MetaModel):
    """Base model for data in all domains, from boto3 responses to
    command-line output of kubernetes tools such as kubectl, kubectx.
    """

    __visible_atttributes__: List[str] = []

    def __init__(self, data: dict = None, *args, **kw):
        if isinstance(data, UserFriendlyObject):
            data = data.serialize()

        self.__data__ = data or {}
        self.initialize(*args, **kw)

    def __eq__(self, other):
        if not isinstance(other, type(self)):
            return False

        return other.__ui_attributes__() == self.__ui_attributes__()

    def __nonzero__(self):
        return any(list(self.__data__.values()))

    def initialize(self, *args, **kw):
        pass

    def update(self, data: dict):
        self.__data__.update(data)

    def serialize(self):
        return self.__data__.copy()

    def to_dict(self):
        return self.serialize()

    @classmethod
    def from_json(cls, json_string: str) -> "libmodels.core.Model":
        data = try_json(json_string)
        return cls(data)

    def to_json(self, *args, **kw):
        kw["default"] = kw.pop("default", str)
        return json.dumps(self.to_dict(), *args, **kw)

    def __getitem__(self, key):
        return self.__data__.get(key, None)

    def get(self, *args, **kw):
        return self.__data__.get(*args, **kw)

    def __ui_attributes__(self):
        return dict(
            [
                (name, getattr(self, name, self.get(name)))
                for name in self.__visible_atttributes__
            ]
        )

    def attribute_matches_glob(self, attribute_name: str, fnmatch_pattern: str) -> bool:
        """helper method to filter models by an attribute. This allows for
        :py:class:`~libmodels.core.ModelList` to
        :py:meth:`~libmodels.core.ModelList.filter_by`.
        """
        try:
            value = getattr(self, attribute_name, self.get(attribute_name))
        except AttributeError as e:
            raise RuntimeError(
                f"{self} does not have a {attribute_name!r} attribute: {e}"
            )

        if isinstance(fnmatch_pattern, str):
            return fnmatch(value or "", fnmatch_pattern or "")
        else:
            return value == fnmatch_pattern

    @classmethod
    def List(cls, *items):
        return ModelList(cls, *items)

    def get_table_columns(self):
        return self.__class__.__visible_atttributes__

    def get_table_rows(self):
        return [list(self.__ui_attributes__().values())]

    def get_table_colums_and_rows(self):
        columns = self.get_table_columns()
        rows = self.get_table_rows()
        return columns, rows

    def format_robust_table(self):
        columns, rows = self.get_table_colums_and_rows()
        return format_robust_table(rows, columns)

    def format_pretty_table(self):
        columns, rows = self.get_table_colums_and_rows()
        return format_pretty_table(rows, columns)


class ModelList(list):
    """Special list subclass that only supports
    :py:class:`~libmodels.core.Model` as children and
    supports filtering by instance attributes by calling
    :py:meth:`~libmodels.core.Model.attribute_matches_glob`.
    """

    def __init__(self, model_class: type, children: List[Model]):
        if not isinstance(model_class, type) or not issubclass(model_class, Model):
            raise TypeError(
                f"ModelList requires the 'model_class' attribute to be "
                "a Model subclass, got {model_class!r} instead"
            )

        self.model_class = model_class
        if not isinstance(children, ITERABLES):
            raise TypeError(
                f"ModelList requires the 'children' attribute to be "
                f"a list, got {children!r} {type(children)} instead"
            )

        super().__init__(map(model_class, children))

    def sorted(self, **kw):
        try:
            items = sorted(self, **kw)
        except TypeError as error:
            raise TypeError(
                f"when sorting a list of {self.model_class} objects with {kw}: {error}"
            )
        return self.model_class.List(items)

    def sorted_by(self, attribute: str, **kw):
        return self.sorted(
            key=lambda model: getattr(model, attribute, model.get(attribute)) or "",
            **kw,
        )

    def filter_by(self, attribute_name: str, fnmatch_pattern: str) -> List[Model]:
        return self.filter(
            lambda model: model.attribute_matches_glob(attribute_name, fnmatch_pattern)
        )

    def filter(self, check: Callable[[Model], bool]) -> List[Model]:
        results = []
        for index, model in enumerate(self):
            if not isinstance(model, self.model_class):
                raise ValueError(
                    f"{self}[{index}] is not an instance of {self.model_class}"
                )
            if check(model):
                results.append(model)

        return self.model_class.List(results)

    def get_table_columns(self):
        return self.model_class.__visible_atttributes__

    def get_table_rows(self):
        return [model.__ui_attributes__().values() for model in self]

    def get_table_colums_and_rows(self):
        columns = self.get_table_columns()
        rows = self.get_table_rows()
        return columns, rows

    def format_robust_table(self):
        columns, rows = self.get_table_colums_and_rows()
        return format_robust_table(rows, columns)

    def format_pretty_table(self):
        columns, rows = self.get_table_colums_and_rows()
        return format_pretty_table(rows, columns)
