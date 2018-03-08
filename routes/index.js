/**
 * Created by 晓霞 on 2017/11/22.
 */
//编写接口文件
var express=require("express");
//加载express路由
var router=express.Router();
// 该路由使用的中间件
//router.use(function timeLog(req, res, next) {
//    console.log('Time: ', Date.now());
//    next();
//});
//加载数据模型
var db=require("./db");
var fs=require("fs");
//为了迭代处理id而引入的
var ObjectId=require("mongodb").ObjectId;
//迭代处理
//引入加密模块
var crypto=require("crypto");
//添加silly-datetime模块
var sd=require("silly-datetime");
//console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm'));
/*
* 需求：验证码
*   1.登录用户  user:id   username   password    veri  验证码
*   2.express中的路由  去实现接口的编写
*       2.1方式   get  /  post
*       2.2返回的验证码的长度  4 6 8
*       2.3 验证码为字母和数字结合
* */
//封装一个函数  为了存储登录用户信息的
function User(user){
    this.name=user.name;
    this.id=user.id;
    this.password=user.password;
    this.phone=user.phone;
    this.veri=user.veri;
}
router.get("/AdminLoginRegHandler",function(req,res,next){
   if(req.url=="/favicon.ico"){
       return
   }else{
    var actions=req.query.actions;
    switch(actions){
        case "veri":
            var randomNum=function(min,max){
                return Math.ceil(Math.random()*(max-min)+min);
            };
            var str="ABCDEFGHIGKLMNOPQRSTUVWXYZ1234567890abcdefghigklmnopqrstuvwxyz";
            var returnStr="";
            for(var i=0;i<4;i++){
                returnStr+=str[randomNum(0,str.length-1)];
            }
             var user={
                name:"",
                id:"",
                password:"",
                veri:returnStr
            };
            req.flash.user=user;
            res.send({"success":"veriSuccess","data":returnStr});
            break;
        case "checkveri":
            if(req.flash.user && req.flash.user.veri == req.query.veri){
                res.send({"success":"checkSuccess"});
            }else{
                res.send({"err":"checkErr"});
            }
            break;
        default :
            res.send({"err":"pathErr"});
    }
   }
});
router.post("/AdminLoginRegHandler",function(req,res){
    if(req.url=="/favicon.ico"){
        return
    }else{
        var actions=req.query.actions;
        switch(actions){
            case "add":
                db.findObj("Admin",{"userName":req.body.username},function(err,result){
                    if(result.length){
                        res.send({"success":"系统已有此用户"})
                    }else{
                       db.findObj("Admin",null,function(err,result){
                           var md5=crypto.createHash("md5");
                           var addData={
                               "userName":req.body.username,
                               "password":md5.update(req.body.password).digest("base64"),
                               "phone":/^[1]\d{10}$/.test(req.body.phone)?req.body.phone:false,
                               "trueName":req.body.truename,
                               "createAt":sd.format(new Date(), 'YYYY-MM-DD HH:mm'),   //silly-datetime
                               "updateAt":sd.format(new Date(), 'YYYY-MM-DD HH:mm'),
                               "tokenId":result.length+1,
                               "isDelete":/^fc/.test(req.body.trueName)?false:true,
                               "powerCode":req.body.powerCode=="1"?"系统管理员":"课程管理员",
                               "power":req.body.powerCode
                           };
                           db.add("Admin",addData,function(err,result){
                               if(err){
                                   console.log("注册失败");
                                   return
                               }
                               res.send({"success":"注册成功"})
                           });
                       })
                    }
                });
                break;
            case "login":
                var md5=crypto.createHash("md5");
                var login={
                    "userName":req.body.userName,
                    "password":md5.update(req.body.password).digest("base64")
                };
                db.findObj("Admin",{"userName":req.body.userName},function(err,result){
                    if(result.length){
                        if(result[0].password==login.password){
                            req.flash.user.id=result[0]._id;
                            req.flash.user.name=result[0].userName;
                            req.flash.user.password=result[0].password;
                            res.send({"success":"loginSuccess"});
                        }else{
                            res.send({"password":"passErr"});
                        }
                    }else{
                        res.send({"err":"noUser"});
                    }
                });
                break;
            case "returninfo":
                var id=req.flash.user.id;
                db.findObj("Admin",{"_id":id},function(err,result){
                    res.send({"success":result[0].userName});
                });
                break;
            case "updatePass" :
                var md5=crypto.createHash("md5");
                var oldPass=md5.update(req.body.oldPass).digest("base64");
                if(req.flash.user.password !=oldPass){
                   res.send({"err":"旧密码不正确"});
                }else{
                    var md5=crypto.createHash("md5");
                    var newPass=req.flash.user.password=md5.update(req.body.newPass).digest("base64");
                    var update=sd.format(new Date(), 'YYYY-MM-DD HH:mm');
                    var selector=[
                        {"userName":req.flash.user.name},
                        {$set:{"password":newPass,"updateAt":update}}
                    ];
                        db.change("Admin",selector,function(err,result){
                            if(result.result.n){
                                res.send({"success":"修改成功"});
                            }else{
                                res.send({"err":"修改失败"});
                            }
                        });
                    }
                break;
        }
    }
});
router.get("/AdminHandler",function(req,res){
   if(req.url=="/favicon.ico"){
       return
   }else{
    var actions=req.query.actions;
    switch(actions){
        case "quit":
            if(req.flash.user){
                req.flash.user={}
            }
            res.send({"success":"退出成功"});
            break;
        case "show": // 管理员显示
            db.find("Admin", null, function (err,arr) {
                // console.log(req.query.searchText);
                var selector = !req.query.searchText ? {
                    tokenId: {
                        $gt: arr.length - (parseInt(req.query.pageStart) * 3 - 3) - 3,
                        $lte: arr.length - (parseInt(req.query.pageStart) * 3 - 3)
                    }
                } : {turename: {$regex: '.*' + req.query.searchText + '.*', $options: 'i'}};
                db.find("Admin", selector, function (err,data) {
                    console.log(data)
                    if (data.length == 0) {
                        res.send({"err": "抱歉，系统中查不到人员"});
                    } else {
                        var result = {
                            success: "成功",
                            data: {
                                pageSize: 3,
                                count: arr.length,
                                list: data
                            }
                        };
                        res.send(result);
                    }
                });
            });
            break;
        default :
            res.send({"err":"路径错误"});
            break;
    }
   }
});
module.exports=router;