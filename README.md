api-examples
============

Demonstrations of what can be built with the Parse.ly API.

Our API docs can be found here: http://www.parsely.com/docs/

The following endpoints are supported:

1. `/related`
1. `/analytics`

There is also a demonstration of the dynamic pixel tracking integration option.

Install
-----

1. Install node.js: http://nodejs.org/download/.
1. Clone this repo: `git clone git@github.com:Parsely/api-examples.git`
1. Change to the directory: `cd api-examples`
1. Install dependencies using npm: `npm install`
1. Configure your apikey & secret in `config/default.json` to use restricted endpoints, such as `/analytics`.
1. Start the static file server: `node server.js`
1. Visit `http://localhost:8080/` to get started.

License
-------
MIT.
