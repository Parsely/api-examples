DEBUG = True

NUMBER_OF_POSTS = 30  # default number of posts to show (if not provided)
CACHE_EXPIRY = 5*60  # cache expiry in seconds

NETWORK_NAME = ''

PARSELY = {
    'api_base_url': 'https://api.parsely.com/v2',
    'apikeys': [
        # tuples of (apikey, secret) e.g.
        # ('mysite.com', '09jqwdn09wqdnwq09dnionqwd09qwnd'),
    ]
}