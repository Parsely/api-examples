# Roundup

Roundup is a small web application that demonstrates the top N articles from
across multiple Parse.ly API keys.

![Screenshot](https://s3.amazonaws.com/parsely_static/roundup/screenshot.png)

The app is written in Python and uses the [Flask](http://flask.pocoo.org/)
framework.

## Getting Started

1. Clone the api-examples repo and cd into the ``roundup`` directory.
2. Modify the ``settings.py`` file specifically the ``NETWORK_NAME`` and ``PARSELY['apikeys']`` variables.
3. Run ``pip install -r requirements.txt``.
4. Run ``python server.py``

## Production Usage

Roundup isn't ready for usage in a production environment at first.  Two key
changes should be made before thinking of using roundup in production.

1. Modify the ``cache`` in ``server.py`` to use a distributed cache like [Memcached](http://memcached.org/) or [Redis](http://redis.io/).
2. Set ``DEBUG = False`` in ``settings.py``.
2. Decide on a [deployment option](http://flask.pocoo.org/docs/deploying/) for the Flask app.
