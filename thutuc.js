var express = require('express');
var session = require('express-session');
const cheerio = require('cheerio');
var requestPrivate = require('./requestPrivate');
var tabletojson = require('tabletojson');
var rp = require('request-promise');
const chalk = require('chalk');
var nodemailer = require("nodemailer");
var fs = require('fs');

// var mysql = require('mysql');
var Db = require('mysql-activerecord');
var moment = require('moment');


const log = console.log;
var app = express();

eval(fs.readFileSync('config.js')+'');


var loginOptions = {
  
  url:"http://csdl.thutuchanhchinh.vn/Pages/Login.aspx?ReturnUrl=%2f_layouts%2f15%2fauthenticate.aspx%3fsource%3d%2ftw&source=/tw",
  username:"dng",
  password:"csdl@123",  
  usernameField:"txtTK",
  passwordField:"txtPass",
  btnLogin:".btnLogin",
  cookieFile:  './requestPrivateFile/cookie_tthc.json',  
  cookieDomain:"http://csdl.thutuchanhchinh.vn",
  cookieUrl:"",	
};

async function compareData(id_thutuc) {
  
    console.log(chalk.bgBlue("!!!!!!!=============== COMPARE DATA ===========!!!!"));
  
    try{ 
  
      var options = {
        
        loginOptions,		
        requestOptions:{
          uri: 'http://csdl.thutuchanhchinh.vn/TTHC_UserControls/thutuc/pFormViewTTHC.aspx?ItemID='+id_thutuc,
          
          existDOM: '',
          // If useCookieOnly is TRUE, no Login request will be sent if cannot get Cookie or Cookie expried. 
          // {cookieFile} and {cookieDomain} must be set to get get Cookie file. 
          // Other setting in loginOptions are ignored			
          useCookieOnly:false, 
          alwaysLogin:false,
          reLoginWhenFail:1
          
        }		 
      };
            
    
      var data = await requestPrivate.getRequest(options);    
      // console.log(data);
      if (data instanceof Error) {
        throw data;
      }		
  
      const $ = cheerio.load(data,{ decodeEntities: false });
      
      noidung = '<table>'+$('.tab-detail').html()+'</table>'; // Toàn bộ Table chứa dữ liệu 

      let noidung_origin = await new Promise((resolve,reject)=>{
        db.select('noidung').where(' id_thutuc = "'+ id_thutuc + '" ')
        .get('cchc_thutuc', function(err, results) {
          
          return void err ? reject(err) : resolve(results[0].noidung);
        })   
        
      }); 

      // log(noidung_origin);

      emailContent = '<table border="1px"><tr><td>Nội dung lưu</td><td>Nội dung mới lấy</td><tr><td>'+noidung_origin+'</td><td>'+noidung+'</td></tr></table>';
      var mailOptions = {
        from: 'pmis@danang.gov.vn', 
        to: 'linhtranvu@gmail.com',
        html: emailContent, 
      }      
      
      if(noidung_origin === noidung){ 
        mailOptions.subject = 'MẪU CHƯA THAY ĐỔI '+moment().format('DD/MM');
      }else{
        mailOptions.subject = 'ERROR! MẪU ĐÃ THAY ĐỔI !!!'+moment().format('DD/MM');
      }
      mailTransport.sendMail(mailOptions,function(error,info){
        log(info)
      });

    }catch(e){
      
      log(e); 
  
      var mailOptions = {
        from: 'pmis@danang.gov.vn', 
        to: 'linhtranvu@gmail.com,thaoptd@danang.gov.vn',
        subject: 'Đồng bộ không thành công '+moment().format('DD/MM'),
        html: e.toString() + '<p><p><p>' + JSON.stringify(thutuc,null, "\t"), 
      };  
  
      mailTransport.sendMail(mailOptions,function(error,info){
        // if(error) throw error;
        console.log('Fail! Email sent: ' + e.toString());
      console.log(error);
        
      }); 
  
      if(e.name === 'missingField'){
      return e;
        // return e.toString() + '. Đánh dấu đã đồng bộ Log';
      }else{
        return e;
      }
  
    }
  }

async function saveThutuc(id_thutuc) {

  console.log(chalk.bgBlue("!!!!!!!=============== SAVE thu tuc===========!!!!"));

  try{ 

    var options = {
      
      loginOptions,		
      requestOptions:{
        uri: 'http://csdl.thutuchanhchinh.vn/TTHC_UserControls/thutuc/pFormViewTTHC.aspx?ItemID='+id_thutuc,
        
        existDOM: '#thutucItemForm',
        // If useCookieOnly is TRUE, no Login request will be sent if cannot get Cookie or Cookie expried. 
        // {cookieFile} and {cookieDomain} must be set to get get Cookie file. 
        // Other setting in loginOptions are ignored			
        useCookieOnly:false, 
        alwaysLogin:false,
        reLoginWhenFail:1
        
      }		 
    };
          
  
    var data = await requestPrivate.getRequest(options);
  
    // console.log(data);
  
    if (data instanceof Error) {
      throw data;
    }		

    const $ = cheerio.load(data,{ decodeEntities: false });
	
	var noidung = '<table>'+$('.tab-detail').html()+'</table>'; // Toàn bộ Table chứa dữ liệu 
        
    $('#SelectVanBanTab').remove();
    $('a').each(function() {
      var href = $(this).attr('href');
      $(this).attr("href",'http://csdl.thutuchanhchinh.vn'+href );

    });
	$('#tblDVC').remove();
  
    //Nếu có Mẫu đơn, Tờ khai cũ thì xuất hiện thêm Dòng Mẫu đơn, dẫn đến vị trí DOM thay đổi
    if($('.tab-detail > tbody > tr:nth-child(10) > td.label').html().trim() == "Mẫu đơn, tờ khai" ){
    
        $thoihan_field = 15; 
        $doituong_field = 16;
        $donvi_field = 17;
        $donviquyetdinh_field = 18;
        $diachi_field = 19;
        $donviphoihop_field = 20; //Chưa dùng
        $donviuyquyen_field = 21; //Chưa dùng
        $ketqua_field = 22;
        $yeucau_field = 23;
    
    }else{
        // maudon = "";	//Làm sạch field mẫu đơn (**TODO Nghiên cứu kỹ trước khi dùng)	
        $thoihan_field = 14;
        $doituong_field = 15;
        $donvi_field = 16;
        $donviquyetdinh_field = 17;
        $diachi_field = 18;
    
        $ketqua_field = 21;
        $yeucau_field = 22;			
    }		
    
    
    //=============	Lấy thông tin các thông tin bị ajax ngoài như lệ phí, pháp lý, thủ tục liên quan ==
    
    // Danh sách các input chứa value để chạy Ajax (nếu thực hiện)
    
    tthcVanBanPLLQ = $('#tthcVanBanPLLQ').val();				
    tthcVbQDTTHCKhac = $('#tthcVbQDTTHCKhac').val();		
    tthcLienQuan = $('#tthcLienQuan').val();			
    tthcLienThong = $('#tthcLienThong').val();	
  
    var phiID = $.html().match(/(ltsLP=)(.*?)(?=", "#contain_Phi")/g);  
    phi = await rp("http://csdl.thutuchanhchinh.vn//TTHC_UserControls/thutuc/BienTap/Phi/viewlephi.aspx?ltsLP="+phiID[0].replace("ltsLP=", ""));
  
    var lephiID = $.html().match(/(ltsLP=)(.*?)(?=", "#contain_LePhi")/g);  
    lephi = await rp("http://csdl.thutuchanhchinh.vn//TTHC_UserControls/thutuc/BienTap/Phi/viewlephi.aspx?ltsLP="+lephiID[0].replace("ltsLP=", ""));
  
   
    lephi = phi+'<p>'+lephi;
  
    // log(lephi);
    
    cancuphaply = await rp('http://csdl.thutuchanhchinh.vn/TTHC_UserControls/thutuc/BienTap/VanBan/pListVanBanDaChon.aspx?field=tthcVanBanPLLQ&canedit=false&VanBanDaChonArr=,'+tthcVanBanPLLQ);
  
  
    const $CCPL = cheerio.load(cancuphaply,{ decodeEntities: false });
    cancuphaply = $CCPL('#gridVanBanDaChonItem').html();
  
    // log(cancuphaply);
      
    //--------- Lấy dữ liệu Phí và Lệ phí ------------
  
  
      
    var thutuc = {
      id_thutuc : id_thutuc,
      maso : myTrim($('.tab-detail > tbody > tr:nth-child(1) > td:nth-child(2)').html()),	
      tenthutuc : myTrim($('.tab-detail > tbody > tr:nth-child(2) > td:nth-child(2)').html()),	
      linhvuc : myTrim($('.tab-detail > tbody > tr:nth-child(5) > td:nth-child(2) > ul > li').html()),	
      trinhtu : myTrim($('.tab-detail > tbody > tr:nth-child(6) > td.data').html()),
      cachthuc : myTrim($('.tab-detail > tbody > tr:nth-child(7) > td.data').html()),
      
      hoso : myTrim($('.tab-detail > tbody > tr:nth-child(8) > td.data').html()),	
      sobohoso : myTrim($('.tab-detail > tbody > tr:nth-child(9) > td.data').html()),			
      // ngaytao : trim($('#contain > table > tbody > tr:nth-child(2) > td:nth-child(4)').html()),	
      // ngayhieuluc : "",
      thoihan : myTrim($('.tab-detail > tbody > tr:nth-child('+$thoihan_field+') > td:nth-child(2)').html()),		
      doituong : myTrim($('.tab-detail > tbody > tr:nth-child('+$doituong_field+') > td:nth-child(2)').html()),	
      donvi : myTrim($('.tab-detail > tbody > tr:nth-child('+$donvi_field+') > td:nth-child(2) ').html()),
      donviquyetdinh : myTrim($('.tab-detail > tbody > tr:nth-child('+$donviquyetdinh_field+') > td.data ').html()),		
      diachitiepnhan : myTrim($('.tab-detail > tbody > tr:nth-child('+$diachi_field+') > td.data').html()),				
      ketqua : myTrim($('.tab-detail > tbody > tr:nth-child('+$ketqua_field+') > td.data').html()),	
      yeucau : myTrim($('.tab-detail > tbody > tr:nth-child('+$yeucau_field+') > td.data').html()),		
  
      tthcVanBanPLLQ : tthcVanBanPLLQ,				
      tthcVbQDTTHCKhac : tthcVbQDTTHCKhac,
      tthcLienQuan : tthcLienQuan,
      tthcLienThong : tthcLienThong,
  
      lephi:lephi,
      cancuphaply:cancuphaply,
      
      sync_date : moment().format('YYYY-MM-DD hh:mm:ss'),
      modified_date : moment().format('YYYY-MM-DD hh:mm:ss'),
	  noidung : noidung,
      
      
    };
      
		//------------- Kiểm tra các field dưới đây nếu trắng thì thoát và gửi mail lỗi.
		//------------- ID log chứa dữ liệu lỗi sẽ được cập nhật "Đã đồng bộ"
		var require_fields = ["maso","tenthutuc","linhvuc","trinhtu","cachthuc","hoso","sobohoso","thoihan","doituong","ketqua","donvi","cancuphaply"]; 	
    
    const missingField = await new  Promise((resolve, reject) => { 
      require_fields.forEach(function(field){
        if(thutuc[field] === ""){          
          return resolve(field)
        }
      })

      return resolve('');

    })  

    if(missingField !== "" ){
      var e = new Error("Lỗi đồng bộ do thiếu trường bắt buộc "+ missingField);
      e.name = 'missingField'; 
      throw e;
    } 

		//------------- Lưu dữ liệu -----------     
           
      // log(thutuc);
      const results = await new  Promise((resolve, reject) => {
  
        db.select('id_thutuc').where(' id_thutuc = '+id_thutuc+' ')
        .get('cchc_thutuc', function(err, results) { 
          
          return void err ? reject(err) : resolve(results)
          
        });  
  
      });
  
      // return results;
  
      if(results.length > 0){
  
        var info = await new Promise((resolve, reject) => {        
          db
          .where(' id_thutuc = '+id_thutuc)  
          .update('cchc_thutuc', thutuc, function(err, info) { 
            // log(info);
            return void err ? reject(err) : resolve(info)
          });    
    
        });      
        
      }else{
  
        var info = await new Promise((resolve, reject) => {  
  
          db.insert('cchc_thutuc', thutuc, function(err, info) { 
            // log(info);
            return void err ? reject(err) : resolve(info)
          });    
    
        }); 
      
      } 
  
      if (info instanceof Error) {

        throw info;     
  
      }else{
  
        var mailOptions = {
          from: 'pmis@danang.gov.vn',  
          to: 'linhtranvu@gmail.com',
          subject: 'Đồng bộ thành công '+moment().format('DD/MM'),
          html: JSON.stringify(thutuc,null, "\t"),
        };  
        
  
      }
   
      await new Promise((resolve, reject) => { 
        
        mailTransport.sendMail(mailOptions,function(error,info){
          console.log('Success! Email sent: ' + info.response);
          return void error ? reject(error) : resolve(info)
                    
        });          

      })
      
    
      return info;


  }catch(e){
    
    log(e); 

    var mailOptions = {
      from: 'pmis@danang.gov.vn', 
      to: 'linhtranvu@gmail.com,thaoptd@danang.gov.vn',
      subject: 'Đồng bộ không thành công '+moment().format('DD/MM'),
      html: e.toString() + '<p><p><p>' + JSON.stringify(thutuc,null, "\t"), 
    };  

    mailTransport.sendMail(mailOptions,function(error,info){
      // if(error) throw error;
      console.log('Fail! Email sent: ' + e.toString());
	  console.log(error);
      
    }); 

    if(e.name === 'missingField'){
		return e;
      // return e.toString() + '. Đánh dấu đã đồng bộ Log';
    }else{
      return e;
    }

  }



    

    // log($.html());                                         	


	

}






function myTrim(x) {
  if(x === null){
    return "";
  }
  return x.replace(/^\s+|\s+$/gm,'');
}

function converDate(dateString){

  var parts = dateString.split(' ');
  var dateParts = parts[0].split('/');
  var date = dateParts[2]+'-'+dateParts[1]+'-'+dateParts[0]+' '+parts[1];
  return date

}


function syncLog(){
  
	let options = {
		
		loginOptions,		
		requestOptions:{
			uri: 'http://csdl.thutuchanhchinh.vn/TTHC_UserControls/AuditLog/pList.aspx?&Page=1&RowPerPage=100',
			
			existDOM: '#gridCoQuanBanHanhItem > table > tbody > tr:nth-child(2) > td:nth-child(2)',
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
        
        const $ = cheerio.load(data,{ decodeEntities: false });  

        // log($('#gridCoQuanBanHanhItem > table > tbody > tr').html());

        $('#gridCoQuanBanHanhItem > table > tbody > tr').each(function(){

          let thutuc_log = {

            id_log : $(this).find(' td:nth-child(1)').text().trim(),
            thaotac : $(this).find(' td:nth-child(3)').text().trim(),
            doituong : $(this).find(' td:nth-child(4)').text().trim(),
            tenbangghi : $(this).find(' td:nth-child(5)').text().trim(),
            id_thutuc : $(this).find(' td:nth-child(7)').text().trim(),
            timelog : converDate($(this).find(' td:nth-child(8)').text().trim()),
            sync_log_date : moment().format('YYYY-MM-DD hh:mm:ss'),        
          }

          id_log = $(this).find(' td:nth-child(1)').text().trim();

          log(id_log);

          db.select('id_log').where(' id_log = "'+ id_log + '" ')
          .get('cchc_thutuc_log', function(err, results) { 

            // log(results);
            
            if(results.length > 0){
              
              // Log synced, do thing!
      
            }else{
              
              log(thutuc_log);
              db.insert('cchc_thutuc_log', thutuc_log, function(err, info) { 
                log(info);
              });          
            
            } 
            
          });             

        })
      

  })()

}

async function syncThutuc(){

  console.log(chalk.bgBlue("Begin sync thu tuc"));

  var results = await new Promise((resolve, reject) => {     

    db.select('*').where(" type = 0 and (thaotac='Thêm mới'  or thaotac='Cập nhật' or thaotac='Địa phương hóa'  ) ")
    .get('cchc_thutuc_log', function(err, results) { 

      return void err ? reject(err) : resolve(results)

    })   

  })

  // log(results);
  // data =  await saveThutuc(444360);   


  for (let thutuc_log of results){

    log('Log thủ tục:',thutuc_log);
    
     data =  await saveThutuc(thutuc_log.id_thutuc);   
     log('Update save Thu tuc: ', data);

     if (data instanceof Error || data === undefined) {

       log('Error happend when save thu tuc: ',thutuc_log);
       logData = {
         id : thutuc_log.id,
         type: 0,
         sync_thutuc_date:  moment().format('YYYY-MM-DD hh:mm:ss'),
		 sync_info: data.toString(),
       } 	   

     }else{
       
       logData = {
         id : thutuc_log.id,
         type: 1,
         sync_thutuc_date:  moment().format('YYYY-MM-DD hh:mm:ss'),
		 sync_info: "",
       } 
	 }

       log(logData);
         
       var info = await new Promise((resolve, reject) => {        
         db
         .where(' id = '+ logData.id )  
         .update('cchc_thutuc_log', logData, function(err, info) { 
           log('Update log: ',info);
           return void err ? reject(err) : resolve(info)
         });    
   
       });          
   
     	    

  }
  

}

async function compareMultipleData(){

  if(moment().format('hh:mm') === '07:45' || moment().format('hh:mm') === '11:45'){

    console.log(chalk.bgBlue("Begin compare"));
    
      var sample = [447403, 444360, 444998]
    
    
      for (let id_thutuc of sample){
        await compareData(id_thutuc);
      }    
  }else{
    console.log(chalk.bgBlue("Wating for right time"));
    return;
  }
  

}


// saveThutuc(447403);
// saveThutuc(444360);
 // saveThutuc(447431);

// compareData(447403);


// syncLog();

// syncThutuc();  

// compareMultipleData();

//----------- RUN PRODUCTION ---------------//
  setInterval(syncThutuc, 350000);
  setInterval(syncLog, 300000); //300000 = 5p 

  setInterval(compareMultipleData, 60000); // 40s/lan

