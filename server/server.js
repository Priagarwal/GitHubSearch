var restify = require('restify');
var unirest = require('unirest');
var cheerio = require('cheerio');

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

server.get('/search/:query/:filetype', searchGithub);

server.listen(8000, function() {
	console.log('%s listening at %s', server.name, server.url);
});

/**
 * Search Github
 *
 */
function searchGithub(req, res, next) {
	res.setHeader('content-type', 'application/json');
	
	var query = req.params.query || '';
	var filetype = req.params.filetype || '';
	console.log('Got request for searching "' + query + '" in language "' + filetype + '"');
	
	searchGithubJson(query, filetype, function(jsonResponse) {
		res.send(jsonResponse);
	});
	

}

function searchGithubJson(query, filetype, callback) {
	unirest.get('https://github.com/search?l=' + filetype + '&q=' + query + '&ref=cmdform&type=Code')
	.end(function(resp) {
		var $ = cheerio.load(resp.body);
		
		var results = [];
		
		
		
		$('.code-list-item', '#code_search_results').find('.title').find('a').each(function(i, elem) {
			if(results[Math.floor(i/2)] === undefined || results[i/2] === null) {
				results[Math.floor(i/2)] = {
					repo: null,
					file: null,
					code: null
				};
			}
			if(i%2 === 0) {
				results[Math.floor(i/2)].repo = 'https://www.github.com' + $(this).attr('href');
			} else {
				results[Math.floor(i/2)].file = 'https://www.github.com' + $(this).attr('href');
			}
		});
		
		$('.code-list-item', '#code_search_results').find('.bubble').find('.file-code').each(function(i, elem) {
			results[i].code = $(this).text();
		});
		
		callback.call(this, results);
	});
}

function searchGithubHtml(query, filetype, callback) {
var styles = '<link href="https://github.global.ssl.fastly.net/assets/github-e0292731f704355302d725e675128e0981343934.css" type="text/css"><link href="https://github.global.ssl.fastly.net/assets/github2-a49dd0a6fb9b5dda3191bea7f56860948ad57255.css" media="all" rel="stylesheet" type="text/css">';
}


