var exports = module.exports = {};

const puppeteer = require('puppeteer');
var session = require('express-session');
const chalk = require('chalk');
var fs = require('fs');
var rp = require('request-promise');
var tough = require('tough-cookie');
const cheerio = require('cheerio')

var tesseract = require('node-tesseract');
var Jimp = require("jimp");
var Q = require("q");

const log = console.log;


function rpr(options) {


}

/**
 * @description
 * @param {*} path of Image File
 * @returns Text data
 */

function getTextFromImage(path) {
	return new Promise(function (resolve, reject) {
		tesseract.process(path, function (err, data) {
			if (err !== null) return reject(err);
			resolve(data);
		});
	});
}

/**
 * 
 * @param {*} path of file
 * @returns JSON object
 */

function readCookieFile(path) {

	try{
		if (!fs.existsSync(path)) {
			throw new Error("No Cookie file found.");
		}
	}catch(error){
			return error;
	}
	
	var results_string = fs.readFileSync(path, "utf8");
	//Fix JSON string before PARSE to Object			
	results_string = results_string.replace(/name/g, "key");

	// console.log(results_string);

	//----- Check if Invalid JSON format in Cookie File, ReLogin if Fail and parse JSON ----
	try {
		return JSON.parse(results_string);
	} catch (error) {
    return error;
	}		

}



rpr.prototype.login = async function (options) {

	try {
		console.log(chalk.bgBlue('Begin login...'));
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		console.log(options);
		await page.goto(options.url);

		await page.setViewport({
			width: 1600,
			height: 1600
		});



		if (options.hasOwnProperty("captcha")) {
			imagesPath = __dirname + '/images/captcha_' + options.cookieFile + '.jpg';

			await page.screenshot({
				path: imagesPath,
				quality: 100,
				clip: {
					x: options.captcha.xPos,
					y: options.captcha.yPos,
					width: options.captcha.width,
					height: options.captcha.height
				},
				// fullPage: true,
			});

			if (options.captcha.mode == "normal") {
				Jimp.read(imagesPath).then(function (lenna) {
					lenna.scale(4) // resize
						.quality(100) // set JPEG quality
						.greyscale() // set greyscale
						.write(__dirname + '/images/captcha_dest' + options.cookieFile + '.jpg'); // save
				}).catch(function (err) {
					console.error(err);
				});
			}

			captchaValue = await getTextFromImage(__dirname + '/images/captcha_dest' + options.cookieFile + '.jpg')

			console.log(chalk.bgGreen("CAPTCHA VALUE: " + captchaValue));
			await page.type("input[name*='" + options.captcha.inputField + "']", captchaValue, {
				delay: 200
			});

		}

		await page.type("input[name*='" + options.usernameField + "']", options.username, {
			delay: 200
		});
		await page.type("input[name*='" + options.passwordField + "']", options.password, {
			delay: 200
		});

		if (options.hasOwnProperty("capture") && options.capture == true) {
			await page.screenshot({
				path: __dirname + '/images/capture_' + options.cookieFile + '.jpg',
				fullPage: true
			});
		}

		await page.click(options.btnLogin);
		await page.waitForNavigation();



		if (await page.$("input[name*='" + options.usernameField + "']") !== null) {
			throw new Error("Same page after Login! Check username and password if corrected!");

		}


		content = await page.content();
		cookies = await page.cookies();

		if (options.cookieUrl.length > 0) {
			cookies = await page.cookies(options.cookieUrl);
		}

		session.result = cookies; // Lưu cookie vào session
		fs.writeFileSync(options.cookieFile, JSON.stringify(cookies)) //Lưu cookie vào file
		console.log(chalk.bgGreen('Login success!'));

		// console.log(cookies);

		await browser.close();
		// return content;
		return {
			content: content,
			cookies: cookies
		};
	} catch (error) {
		console.log(chalk.bgRed('Error happend when Login. You should check:'));
		console.log(chalk.bgYellow("---- Login real site with username and password to check if corrected"));
		console.log(chalk.bgYellow("---- Request time out"));
		console.log(chalk.bgYellow("---- Inspect StatusCodeError in log may help..."));
		console.log(chalk.bgYellow("============= ERROR PRINT BELOW ================ "));
		console.log(chalk.bgRed(error));
		return error;
	}



}


rpr.prototype.getCookie = async function (options) {

	console.log(chalk.bgBlue("Begin Process to get cookie..."));
	var cookieError = false;
	var loginOptions = options.loginOptions;
	var requestOptions = options.requestOptions;
	var cookiejar = rp.jar();

	try{
		//--------- If {alwaysLogin = TRUE} --- Run Login Request
		if (requestOptions.alwaysLogin === true) {
			
			console.log(chalk.bgYellow("{alwaysLogin} = TRUE. Login Request will be called, current cookie ignored!"));
			var loginData = await rpr.prototype.login(loginOptions);

			if (loginData instanceof Error) {
				throw new Error(loginData.toString() +". {alwaysLogin} = TRUE. LOGIN FAIL! No valid Cookie File, Request Cancel!");
			} else {
				results = readCookieFile(loginOptions.cookieFile);
			}

		}else{ // If {alwaysLogin = FALSE} --- begin read Cookie File Process

			results = readCookieFile(loginOptions.cookieFile);
			
			if (requestOptions.useCookieOnly) {
				console.log(chalk.bgYellow("{UseCookieOnly = TRUE}. Process will read cookie only."));
				if (results instanceof Error) {
					throw new Error(results.toString() +". Read Cookie Error! No Login Request will be called!")
				}
			} else {
				console.log(chalk.bgYellow("{UseCookieOnly = FALSE}. If read cookie file fail, Login Request will be called!"));
				if (results instanceof Error) {

					console.log(chalk.bgYellow(results.toString() +". {Use Cookie Only = FALSE}. Login Request will be called!"));
					var loginData = await rpr.prototype.login(loginOptions);

					if (loginData instanceof Error) {
						throw new Error(loginData.toString() +". LOGIN FAIL! No valid Cookie File, Request Cancel!");
					} else {
						results = readCookieFile(loginOptions.cookieFile);
					}

				}

			}
		}

		results.forEach(function (currentItem) { // Remove "expires" property (causing error with Request)
			delete currentItem["expires"];
		});

		console.log(results);

		results.forEach(function (result, index) { //Loop through for each {cookie} JSON in File

			let cookie = new tough.Cookie(result);
			console.log(chalk.bgGreen("Cookie Parse successfully! "));
			console.log(cookie);

			// Put cookie in an jar which can be used across cookieDomain	
			cookiejar.setCookie(cookie, loginOptions.cookieDomain);
		});

	}catch(error){
		return error
  }
  
  return cookiejar;

}



rpr.prototype.getRequest = async function (options) {


	var loginOptions = options.loginOptions;
	var requestOptions = options.requestOptions;

	console.log(chalk.bgCyan('== Begin sending request. Notice console "jar" will be printed out if useCookieOnly=true or loginOptions existed =='));

	cookiejar = await rpr.prototype.getCookie(options); //Get Cookie Jar


	try {

    if (cookiejar instanceof Error) {
      throw new Error(cookiejar.toString());
    }
  
    let jarOption = {
      jar: cookiejar
    }; //!IMPORTANT: jar value must be included in requestOptions for rp
    requestOptions = Object.assign(requestOptions, jarOption);
    
  
    console.log(chalk.bgGreen("Request Option before sent. Note: Add jar property"));
    console.log(requestOptions);

		let data = await rp(requestOptions);
		const $ = cheerio.load(data);

    //If Login field appear, request need to force login again
		if ($("input[name*='" + loginOptions.usernameField + "']").length) {
      options.requestOptions.reLoginWhenFail = requestOptions.reLoginWhenFail + 1;
      throw new Error("Login page found. Resend request with force Login");
		}

		//If use {existDOM} to check request Page right or not

		if (requestOptions.existDOM.length >= 1) { 
			
			if ($(requestOptions.existDOM).length) {
				console.log(chalk.bgGreen("Succesful get Requested page. DOM " + requestOptions.existDOM + " found"));
				return data;
			} else {
				throw new Error("Could not find DOM " + requestOptions.existDOM + " . Wrong page!"); 
			}
		} else { // No {existDOM} property

			console.log(chalk.bgGreen("Succesful get Requested page. No DOM check required!"));
			return data;

		}



	} catch (error) {
		console.log(chalk.bgRed("Site return Error code when reaching Request [rp(requestOptions)]. What may cause:"));
		console.log(chalk.bgYellow("---- Expired cookie if used (existed loginOptions or useCookieOnly=true"));
		console.log(chalk.bgYellow("---- Request time out"));
		console.log(chalk.bgYellow("---- Inspect StatusCodeError in log may help..."));
		console.log(chalk.bgYellow("========= ERROR PRINT BELOW =================== "));
		console.log(chalk.bgRed(error));

		if (requestOptions.reLoginWhenFail > 0) {
			console.log(chalk.bgBlue("{reLoginWhenFail} = "+requestOptions.reLoginWhenFail+". Send Login Request and then resend Page request!"));

			options.requestOptions.alwaysLogin = true;
			options.requestOptions.reLoginWhenFail = requestOptions.reLoginWhenFail - 1;
			return await rpr.prototype.getRequest(options);
		} else {
			return error;
		}


	}


}

// Exports

var requestPrivate = new rpr();
module.exports = requestPrivate