var http = require('http');
var url = require('url');
// var fs = require('fs');
// var uc = require('upper-case');
// var dt = require('./mymodule.js');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});	
  // var q = url.parse(req.url, true).query;
  // var txt = q.year + " " + q.month;
  // console.log(q);
  res.write("hehdksdsds ");
  res.end();
  
	// var rs = fs.readFile("demo1.htm",function(err,data){
		// if(err){
			// res.writeHead(404, {'Content-Type': 'text/html'});
			// return res.end(uc("404 Not Found that sao"));			
		// }else{
			// res.write(data);
			// res.end("<script>alert('bssss');</script>");			
		// }

	// })
	

  
  // res.end();
}).listen(8081);