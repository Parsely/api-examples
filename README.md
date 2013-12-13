api-examples
============

Examples of commonly requested integrations with the Parsely API.

Running examples locally
-----
Any of the code samples can be run locally if you have a web server installed.  In case you need one, a simple node.js static server is included.  To install node.js, visit http://nodejs.org/download/.

1. `git clone git@github.com:Parsely/api-examples.git`
1. cd api-examples
1. Install dependencies using npm: `npm install`
1. Start the static file server: `node server.js`
1. Configure your apikey & secret in `config/default.json` to use restricted endpoints, such as `/analytics`.
1. Visit `http://localhost:8080/` to get started.
