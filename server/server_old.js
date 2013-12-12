var restify = require('restify');
var unirest = require('unirest');
var htmlparser = require('htmlparser');
var select = require('soupselect');

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.fullResponse());

// Needed this for OPTIONS preflight request: https://github.com/mcavage/node-restify/issues/284
function unknownMethodHandler(req, res) {
	if (req.method.toUpperCase() === 'OPTIONS') {
		console.log('Received an options method request from: ' + req.headers.origin);
		var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With', 'Authorization'];

		if (res.methods.indexOf('OPTIONS') === -1) {
			res.methods.push('OPTIONS');
		}

		res.header('Access-Control-Allow-Credentials', false);
		res.header('Access-Control-Expose-Headers', true);
		res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
		res.header('Access-Control-Allow-Methods', res.methods.join(', '));
		res.header('Access-Control-Allow-Origin', req.headers.origin);
		res.header('Access-Control-Max-Age', 1209600);

		return res.send(204);
	}
	else {
		return res.send(new restify.MethodNotAllowedError());
	}
}
server.on('MethodNotAllowed', unknownMethodHandler);

server.get('/search/:name/:type', searchGithub);

server.listen(8001, function() {
	console.log('%s listening at %s', server.name, server.url);
});

/**
* Search Github
*
*/
function searchGithub(req, res, next) {
	res.setHeader('content-type', 'text/html');

	var name = req.params.name || '';
	var filetype = req.params.type || '';

	unirest.get('https://github.com/search?l=' + filetype + '&q=' + name + '&ref=cmdform&type=Code')
		.end(function(resp) {
			var handler = new htmlparser.DefaultHandler(function(err, dom) {
				if (err) {
					sys.debug("Error: " + err);
				} else {
					var searchResults = select(dom, '#code_search_results');
					/*console.log(searchResults);
					searchResults.forEach(function(item) {
						console.log(item);
					}); */
				}

			});

			var rawHtml = "Xyz <script language= javascript>var foo = '<<bar>>';< /  script><!--<!-- Waah! -- -->";
			var parser = new htmlparser.Parser(handler);
			parser.parseComplete(rawHtml);
		});
}

