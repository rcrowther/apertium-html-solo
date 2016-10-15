Apertium Html-solo
==================
Version of apertium-html-tools for one pair only.

More of a slash than a hack, the code could be re-localised to another language, but that will need hack on hack.

The changes (that I remember): Header and footer entirely removed, new user-informative footer. Localisation slashed down to English (makes no sense here), buttons removed. Persistence removed (hurrah!). All apertium modes removed, leaving only translation. Spurious language choice buttons removed. Instant translation disabled, show-translation-errors locked off, controls removed. File upload feature removed. A block on over-large submissions. Minor checks on JS code that baulks on language lists of one.

New: reduction to blocked words at 7000 chars. Keep the translate button, even on small devices (and it ought to have reroute fallback to a config option).

Otherwise, it compiles and looks like the original.

More information on the original is available on the [Apertium Wiki](http://wiki.apertium.org/wiki/Apertium-html-tools).



Prerequisites
----------------
* Python 3
* curl

Setup
-------
1. Copy `config.conf.example` to `config.conf` and edit it.
2. Then type `make`.

