Author Dashboard
================

How to Use
----------
This is an example of two dashboard elements powered by the Parse.ly API:

   1. a historical histogram of page views data for a particular author.
   1. a list of the author's top posts, sorted by page views.


What's included?
----------------
  * creds.js - this file contains a structure for providing apikey and secret.
  * fully_client_side.html - this file uses the apikey and secret to make requests to the analytics endpoint.
  * c3.js - a visualization library built on top of d3.js. 

Dependencies
------------
  * jQuery
  * moment.js
  * d3.js

Note: providing the secret to the browser is not a recommended approach unless it is acceptable for page views and other metrics data to be accessible to others.

License
-------
MIT.
