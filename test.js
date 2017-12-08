var express = require('express');
var session = require('express-session');
const cheerio = require('cheerio');
var requestPrivate = require('./requestPrivate')
var tabletojson = require('tabletojson');


const log = console.log;


var app = express();

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}))


app.get('/login', function (req, res) {

	login().then(v => {

		req.session.result = v.cookies; // Lưu cookie vào session
		fs.writeFileSync("cookie_tough.json", JSON.stringify(v.cookies))	 //Lưu cookie vào file
		
		log(chalk.bgGreen('Login success '));  
		
		// console.log(v.cookies);   
		res.write(v.content); //write a response to the client
		res.end(); //end the response		  
	})	
	
})

app.get('/setsessioncookies', function (req, res) {
	req.session.result = {
		title: "11",
		year: "20002",
		poster: "movie.poster"
	};
	console.log(req.session.result);
	res.write("ttt"); //write a response to the client
	res.end(); //end the response		
})

app.get('/sessioncookies', function (req, res) {
	var result = req.session.result;
	console.log(result);
	res.write("yy"); //write a response to the client
	res.end(); //end the response		
})

app.get('/readfile', function (req, res) {
	var data =  fs.readFileSync('cookie.json', "utf8"); 
	// var json = JSON.stringify(data);
	
	var result = JSON.parse(data);
	
	console.log(result[0].name);
	res.write("tt");
	res.end();		

	
})


app.get('/thutuc', function (req, res) {
	
	(async () => {
	  const browser = await puppeteer.launch();
	  const page = await browser.newPage();
	  
	  	  
	  await page.goto('http://csdl.thutuchanhchinh.vn/Pages/Login.aspx?ReturnUrl=%2f_layouts%2f15%2fauthenticate.aspx%3fsource%3d%2ftw&source=/tw');
	  
		// await page.focus("input[name*='txtTK']");
		await page.type("input[name*='txtTK']","dng", {delay: 200});
		// await page.focus("input[name*='txtPass']");
		await page.type("input[name*='txtPass']","csdl@123", {delay: 200});  
		
		// const loginForm = await page.$("#aspnetForm");
		await page.evaluate(() => {
			document.querySelector(".btnLogin").click();
		});	
		
		await page.waitForNavigation();
		
	  await page.goto('http://csdl.thutuchanhchinh.vn/tinhthanh/Pages/chitiet-tthc.aspx?path=danh-sach-tthc&ItemID=489922');	
	  
	  // await page.waitForFunction('document.querySelector(".main_one").inner‌​Text.length > 0');

		await page.waitForSelector("#contain_tthcVanBanPLLQ #gridVanBanDaChonItem");
		await page.waitForSelector("#contain_Phi .gridView");
		await page.waitForSelector("#contain_LePhi .gridView");
		
	  // Get the "viewport" of the page, as reported by the page.
	  const dimensions = await page.evaluate(() => {
		return {
		  width: document.body.clientWidth,
		  height: document.body.clientHeight,
		  deviceScaleFactor: window.devicePixelRatio
		};
	  });
	  
	  const height = await page.evaluate(() => {
		  
			var body = document.body,
				html = document.documentElement;

			var height = Math.max( body.scrollHeight, body.offsetHeight, 
								   html.clientHeight, html.scrollHeight, html.offsetHeight );  
			  
		return height;
	  });
	  

		// await  page.setViewport({width: 1600, height: height});
	  
	  // await page.screenshot({path: 'example.png'});
	  // await page.pdf({path: 'page.pdf'});
	  
	  content = await page.content();

	  await browser.close();
	  
		res.write(content); //write a response to the client
		res.end(); //end the response		  
	  
	})();	
	
});


app.get('/egov', function (req, res) {

	let options = {
		
		loginOptions:{
			
			url:"https://dangnhap.danang.gov.vn/cas/login?service=",
			username:"linhtv@danang.gov.vn",
			password:"kh0ngaica",
			usernameField:"username",
			passwordField:"password",
			btnLogin:"#btnDangNhap",
			cookieFile:"cookie_egov.json",  
			cookieDomain:"https://dangnhap.danang.gov.vn",
			cookieUrl:"https://dangnhap.danang.gov.vn/cas/login?service=",
		},
		
		requestOptions:{
			uri: 'http://egov.danang.gov.vn/group/profile-6/lich-cong-tac?p_p_id=lichcongtacportlet_WAR_qlvbdhappportlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_lichcongtacportlet_WAR_qlvbdhappportlet_jspPage=%2Fhtml%2Fqlvbdh%2Flichcongtac%2FindexCoQuan.jsp&_lichcongtacportlet_WAR_qlvbdhappportlet_javax.portlet.action=viewLichCongTac&featureKey=LichCoQuan',
			
			existDOM: '',
			// If useCookieOnly is TRUE, no Login request will be sent if cannot get Cookie or Cookie expried. 
			// {cookieFile} and {cookieDomain} must be set to get get Cookie file. 
			// Other setting in loginOptions are ignored			
			useCookieOnly:false, 
			alwaysLogin:false,
			reLoginWhenFail:1
			
		}		 
	};
		
	(async function(){
		

		var data = await requestPrivate.getRequest(options);

		// console.log(data);

    if (data instanceof Error) {
			data = data.toString();
		}		
		
		const $ = cheerio.load(data);
		 
    $('.thungay-cell').remove();
    $('.buoi-cell').remove();
    
    $('#lct_grid > thead > tr > th:nth-child(2)').append('<th>Date</th>')
    $('.txt-input-cell').has("input[name='ngay']").each(function() {
      date =  $(this).find("input[name='ngay']").val();
      $(this).append('<td>'+date+'</td>') 
    });
    $('#lct_grid > thead > tr > th:nth-child(1)').remove();
    // $("a").attr("href",'http://csdl.thutuchanhchinh.vn'+$("a").attr("href") );
    
    var tablesAsJson = tabletojson.convert('<table>'+$('#lct_grid').html()+'</table>');
    var firstTableAsJson = tablesAsJson[0];    

    app.set('json spaces', 10);
    res.json(firstTableAsJson);
    
											
    // res.write(JSON.stringify(firstTableAsJson)); //write a response to the client	
    // res.write($('.lct-grid-ctn').html()); //write a response to the client	
		res.end(); //end the response				
	})();




})

app.get('/savefilecookie', function (req, res) {
	
let cookie = new tough.Cookie({
    key: "some_key",
    value: "some_value",
    domain: 'mydomain.com',
    httpOnly: true,
    maxAge: 31536000
});

// Put cookie in an jar which can be used across multiple requests
	
	var j = rp.jar()
	j.setCookie(cookie, 'https://mydomain.com');
	
	console.log(j);

	rp({url: 'http://www.github.com', jar: j}, function (error, response, body) {
		let url = "http://www.github.com";
	  var cookie_string = j.getCookieString(url); // "key1=value1; key2=value2; ..."
	  var cookies = j.getCookies(url);
	  console.log(cookie_string);
	  // [{key: 'key1', value: 'value1', domain: "www.google.com", ...}, ...]
	  	res.write(body); //write a response to the client	
		res.end(); //end the response	
	})	
})



app.get('/tthc', function (req, res) {

	let options = {
		
		loginOptions:{
			
			url:"http://csdl.thutuchanhchinh.vn/Pages/Login.aspx?ReturnUrl=%2f_layouts%2f15%2fauthenticate.aspx%3fsource%3d%2ftw&source=/tw",
			username:"dng",
			password:"csdl@123",
			usernameField:"txtTK",
			passwordField:"txtPass",
			btnLogin:".btnLogin",
			cookieFile:  './requestPrivateFile/cookie_tthc.json',  
			cookieDomain:"http://csdl.thutuchanhchinh.vn",
			cookieUrl:"",	
		},
		
		requestOptions:{
			uri: 'http://csdl.thutuchanhchinh.vn/TTHC_UserControls/thutuc/pFormViewTTHC.aspx?ItemID=489922',
			// uri: 'http://csdl.thutuchanhchinh.vn/tinhthanh/Pages/chitiet-tthc.aspx?path=danh-sach-tthc&ItemID=489922',
			
			existDOM: '',
			// If useCookieOnly is TRUE, no Login request will be sent if cannot get Cookie or Cookie expried. 
			// {cookieFile} and {cookieDomain} must be set to get get Cookie file. 
			// Other setting in loginOptions are ignored			
			useCookieOnly:false, 
			alwaysLogin:false,
			reLoginWhenFail:1
			
		}		 
	};
		
	(async function(){
		

		var data = await requestPrivate.getRequest(options);

		// console.log(data);

    if (data instanceof Error) {
			data = data.toString();
		}		
		
		const $ = cheerio.load(data);
		 
		$('#SelectVanBanTab').remove();
		$("a").attr("href",'http://csdl.thutuchanhchinh.vn'+$("a").attr("href") );
											
		res.write($.html()); //write a response to the client	
		res.end(); //end the response				
	})();
	


})

app.get('/normalpage', function (req, res) {
	
	var options={
		requestOptions:{
			uri: 'https://www.google.com',		
			existDOM: '#lga1',
		}		
	};	
	
	(async function(){
		try{
			var data = await getRequest(options);
			res.write(data); //write a response to the client				
		}catch(error){
			console.log(error);
			res.write(error.toString()); //write a response to the client		
		}
		res.end(); //end the response			
	})();
	
	
})


app.get('/cbcc', function (req, res) {

	let options = {
		
		loginOptions:{
			
			url:"http://49.156.54.87",
			username:"linhtv@danang.gov.vn",
			password:"kh0ngaica",
			usernameField:"username",
			passwordField:"password",
			btnLogin:".btn-primary",
			cookieFile:"cookie_cbcc.json",  
			cookieDomain:"http://49.156.54.87",
			cookieUrl:"",	
		},
		
		requestOptions:{
			uri: 'http://49.156.54.87/',
			
			existDOM: '#sidebar',
			// If useCookieOnly is TRUE, no Login request will be sent if cannot get Cookie or Cookie expried. 
			// {cookieFile} and {cookieDomain} must be set to get get Cookie file. 
			// Other setting in loginOptions are ignored			
			useCookieOnly:false, 
			alwaysLogin:false,
			reLoginWhenFail:1
			
		}		 
	};
		
	(async function(){
		

		var data = await requestPrivate.getRequest(options);

		// console.log(data);

    if (data instanceof Error) {
			data = data.toString();
		}		
		
		const $ = cheerio.load(data);
		 
		$('#SelectVanBanTab').remove();
		$("a").attr("href",'http://csdl.thutuchanhchinh.vn'+$("a").attr("href") );
											
		res.write($.html()); //write a response to the client	
		res.end(); //end the response				
	})();
	


})	
	


app.get('/lltp', function (req, res) {
	
	let options = {
		
		loginOptions:{
						
			url:"https://dangnhaplltp.moj.gov.vn/passportv3/login?appCode=QLLLTP&service=https%3A%2F%2Flltp.moj.gov.vn",
			username:"16dnvanbinh",
			password:"Y2kvl2ooo!",
			usernameField:"username",
			passwordField:"password",
			btnLogin:".btn-login",
			cookieFile:"cookie_lltp.json",  
			cookieDomain:"https://lltp.moj.gov.vn",
			capture: true,
			captcha:{
				Path:"#xxx",
				inputField:"captcha",		
				xPos: 1044,
				yPos: 384,
				width:100,
				height:22,
				mode:"normal"
			},
			cookieUrl:"https://lltp.moj.gov.vn",							
		},
		
		requestOptions:{
			uri: 'https://lltp.moj.gov.vn/listDeclaration!onInitGrid.do?q=*&start=0&count=10&startval=0',
			
			// existDOM: '#menu',
			// If useCookieOnly is TRUE, no Login request will be sent if cannot get Cookie or Cookie expried. 
			// {cookieFile} and {cookieDomain} must be set to get get Cookie file. 
			// Other setting in loginOptions are ignored			
			useCookieOnly:false, 	
			alwaysLogin:true,			
			headers: {
				'User-Agent': 'Mozilla/5.0 (Win.dows NT 10.0; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0'
			},			
			
		}		 
	};
		
	(async function(){
		
		try{
			var data = await requestPrivate.getRequest(options);
			
			if(!data){
				data = "<b>Login Fail, Please check log</b>"
			}
			
			const $ = cheerio.load(data);
			// console.log(data);
			
			// await login(options.loginOptions);

			
			 
			// $('#SelectVanBanTab').remove();
			// $("a").attr("href",'http://csdl.thutuchanhchinh.vn'+$("a").attr("href") );
												
			res.write($.html()); //write a response to the client	
			res.end(); //end the response						
			
		}catch(error){
			
			console.log(error);
		}
	
	})();

})

app.get('/thutuccookie', function (req, res) {

	(async () => {
	  const browser = await puppeteer.launch();
	  const page = await browser.newPage();

	  // var result = req.session.result; // Lấy Cookie từ Session do /Login lưu lại
	  
		var result =  JSON.parse(fs.readFileSync('cookie.json', "utf8")); //Lấy Cookie từ file 
	
	  console.log(result);
	  
	  await page.setCookie(...result);  
	  
	  await page.goto('http://csdl.thutuchanhchinh.vn/tinhthanh/Pages/chitiet-tthc.aspx?path=danh-sach-tthc&ItemID=489922');	
	  
	  // await page.waitForFunction('document.querySelector(".main_one").inner‌​Text.length > 0');

		await page.waitForSelector("#contain_tthcVanBanPLLQ #gridVanBanDaChonItem");
		await page.waitForSelector("#contain_Phi .gridView");
		await page.waitForSelector("#contain_LePhi .gridView");
		

	  
	  const height = await page.evaluate(() => {
		  
			var body = document.body,
				html = document.documentElement;

			var height = Math.max( body.scrollHeight, body.offsetHeight, 
								   html.clientHeight, html.scrollHeight, html.offsetHeight );  
			  
		return height; 
	  });
	  

		// await  page.setViewport({width: 1600, height: height});
	  
	  // await page.screenshot({path: 'example.png'});
	  // await page.pdf({path: 'page.pdf'});
	  
	  // content = await page.content();
	  
	  // Get HTML content
	  const content = await page.evaluate(() => {
		  
		  function stripScripts(s) {
			var div = document.createElement('div');
			div.innerHTML = s;
			var scripts = div.getElementsByTagName('script');
			var i = scripts.length;
			while (i--) {
			  scripts[i].parentNode.removeChild(scripts[i]);
			}
			return div.innerHTML;
		  }
		  
		  $(".searchbox").html("Tìm một chút");
		  
		  return stripScripts($("#formBienTapVanBan").html());
		  
		// return document.body.innerHTML

	  });	  

	  await browser.close();
	  
		res.send(content); //write a response to the client
		res.end(); //end the response	

		// process.exit();		//Thoát chương trình NODE
	  
	})();	

	
})


app.listen(8081, () => console.log('Example app listening on port 8081!'))
