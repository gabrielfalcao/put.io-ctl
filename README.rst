putio-ctl
#########

.. code:: man

   Usage: putio-ctl [OPTIONS] COMMAND [ARGS]...

     putio-ctl command-line manager

   Options:
     --loglevel [DEBUG|INFO|WARNING|ERROR|CRITICAL]
     --token TEXT
     --help                          Show this message and exit.

   Commands:
     cancel     clean unavailable transfers
     clean      clean unavailable transfers
     delete     delete files
     download   list files
     files      list files
     transfers  list transfers
     version    prints the version to the STDOUT


Authentication
==============


.. code:: bash

   # export for as environment variable
   export PUTIO_CTL_TOKEN="YOUR_API_TOKEN"

   # or pass option every time
   putio-ctl --token='YOURTOKEN' <command>


Commands
========


List Transfers
--------------

.. code:: bash

   putio-ctl transfers


Filter by field
...............

.. code:: bash

   putio-ctl transfers -f 'status=DOWNLOADING'


Clean transfers without 100% availability
-----------------------------------------

.. code:: bash

   putio-ctl clean


List Files
----------

Requires parent id to be passed, use ``0`` for root and ``all`` for all files matching filters (if any)

.. code:: bash

   putio-ctl files 0

   putio-ctl files -1  # all files

   putio-ctl files -f 'file_type=VIDEO' -1  # all files


Get download links
------------------

Accepts multiple ids

.. code:: bash

   putio-ctl download 1122333 55233432 43258855

Delete files
------------

all files containing "XXX" in the name

putio-ctl delete $(putio-ctl files all -f file_type=VIDEO -f 'name=*XXX*' --only=id)

Cancel specific transfers
-------------------------

.. code:: bash

   putio-ctl cancel 11222233 99887766  55446663


Cancel all transfers
--------------------

.. code:: bash

   putio-ctl cancel all
