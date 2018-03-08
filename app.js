/**
 * Created by 晓霞 on 2017/11/22.
 */
//作为启动文件   express里面的路由
var express=require("express");
//加载path模块  功能：处理路径
var path=require("path");
//处理post的中间件
var bodyparser=require("body-parser");
//处理cookie
/*cookie
特点：xss是什么
    1.cookie不加密，用户可以随时访问
    2.cookie可以被用户删除
    3.cookie可以被篡改
    4.cookie 可以被xss攻击   用于攻击
    5.cookie的储存量比较小4k,未来即将被localstorage替代，但是这个东西仅支持IE9以上
* */
var cookieparser=require("cookie-parser");
//处理日志
/*morgan是express默认的日志中间件，也可以脱离express，作为node.js的日志组件单独使用。*/
var logger=require("morgan");
//session
var session=require("express-session");
//加载接口文件
var index=require("./routes/index");
//加载初始数据文件
var db=require("./routes/db");
//导入中间件connect-flash  是用来保存req和res返回的消息 并储存到session中
var flash=require("connect-flash");
//入口文件
var app=express();
//解决跨域问题，防止中文乱码
app.use(function(req,res,next){
   //允许 跨域访问的地址
    res.header("Access-Control-Allow-Origin","*");
    //解决接口的请求跨域
    res.header("Access-Control-Allow-Credentials",true);
    //解决发送方式的请求跨域
    res.header("Access-Control-All-Methods","PUT,GET,POST,DELETE,OPTIONS");
    //设置内容类型
    res.header("Access-Control-All-Headers","Content-type");
    //设置请求
    res.header("Access-Control-All-Headers","X-Requested-With");
    //防止中文乱码
    res.header("Content-type","text/plain;charset=utf-8");
    next();//终止
});
//使用之前的中间件
app.use(logger("dev"));
//处理json
app.use(bodyparser.json());
//解决form表单发送的请求
app.use(bodyparser.urlencoded({extended:false}));
    //处理cookieparser
app.use(cookieparser("FCHT"));
//设置session
app.use(session({
        name:"FCHT", /*设置cookie读取的名称   默认name是connect.id*/
        secret:"FCHT",   /*设置加密字符串  后面的字段必须有，而且是必须存在这个属性*/
        cookie:{maxAge:1000*60*60*24*30}, /*设置cookie的时长 默认单位是ms*/
        resave:false,     /*每次请求时都会重置session*/
        saveUninitialized:false  /*每次执行时都要初始化*/
    }));
app.use(flash());
//set flash
app.use(function (req, res, next) {
    res.locals.errors = req.flash('error');
    res.locals.infos = req.flash('info');
    next();
});
//设置静态资源
app.use(express.static(path.join(__dirname,"public")));
//设置路由 Handler 手柄  只有它能触摸到
app.use("/Handler",index);
//暴露模块
module.exports=app;