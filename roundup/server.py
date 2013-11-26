try:
    import simplejson as json
except ImportError:
    import json

from flask import Flask, Response, render_template, request
from werkzeug.contrib.cache import SimpleCache
import requests


app = Flask('roundup')
app.config.from_object('settings')
# TODO: In a production environment, you would never use an in-memory cache like
# this.  You should instead use something like Redis or Memcached.
cache = SimpleCache()


def get_top_posts(*args, **kwargs):
    kwargs['time'] = kwargs.get('time') or '6h'

    url = '{}/realtime/posts'.format(app.config['PARSELY']['api_base_url'])
    posts = []

    for apikey, config in app.config['PARSELY']['apikeys'].iteritems():
        kwargs['apikey'] = apikey
        kwargs['secret'] = config['secret']
        apikey_posts = requests.get(url, params=kwargs).json()['data']
        for post in apikey_posts:
            post['apikey'] = apikey
            post['logo_url'] = config.get('logo_url')

        posts.extend(apikey_posts)

    posts = sorted(posts, key=lambda x: x['_hits'], reverse=True)
    return posts[:kwargs['limit']]


@app.route('/top_posts')
def top_posts():
    limit = request.args.get('limit', default=app.config['NUMBER_OF_POSTS'],
                             type=int)
    if limit <= 0:
        limit = app.config['NUMBER_OF_POSTS']

    posts = cache.get('top_posts')
    if posts is None:
        posts = get_top_posts(limit=limit)
        cache.set('top_posts', posts, timeout=app.config['CACHE_EXPIRY'])

    return Response(json.dumps(posts), content_type='application/json')


@app.route('/')
def home():
    return render_template('home.jinja2.html')


if __name__ == '__main__':
    app.run()
