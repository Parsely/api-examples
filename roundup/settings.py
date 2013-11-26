DEBUG = True

NUMBER_OF_POSTS = 30  # default number of posts to show (if not provided)
CACHE_EXPIRY = 5*60  # cache expiry in seconds

NETWORK_NAME = ''

PARSELY = {
    'api_base_url': 'https://api.parsely.com/v2',
    'apikeys': {
        # key is the API key itself which maps to a config object which contains
        # 'secret' (Parse.ly API key secret, required) and 'logo_url'
        # (16x16 px image url, not required) example:
        # 'mysite.com': {
        #   'secret': '1912biu2be1928n2d',
        #   'logo_url': 'http://somestaticserver.com/logo-mysite.com'}
    }
}