/**
 * Created by 晓霞 on 2017/11/21.
 */
/*1.找到公用的数据源(数据库) mongodb://127.0.0.1:27017/数据库名
 内网(局域网) http://www.outman.com(用于测试)  公司内部的
 外网       http://www.outmanall.com(经过认可的数据)  公共的
 * 2.链接数据库  注：封装函数  why：代码重复，可重复利用
 * */
var setting=require("./setting.js");
var MongoClient=require("mongodb").MongoClient;
//封装共用的数据库函数
function ConnectDB(callback){
    var url=setting.dbUrl;
    MongoClient.connect(url,function(err,db){
        if(err){
            callback(err,null);
            return
        }
        callback(err,db);
    })
}
//增  需求：db相当于jq，用的时候需要引入
exports.add=function(collName,json,callback){
    ConnectDB(function(err,db){
        db.collection(collName).insert(json,function(err,result){
            callback(err,result);
            db.close();
        });
    });
};
//删
exports.del=function(collName,json,callback){
  ConnectDB(function(err,db){
      db.collection(collName).remove(json,function(err,result){
          callback(err,result);
          db.close();
      });
  });
};
//更新
exports.change=function(collName,json,callback){
    ConnectDB(function(err,db){
        db.collection(collName).update(json[0],json[1],function(err,result){
           callback(err,result);
            db.close();
        });
    });
};
//简洁版查找
exports.find=function(collName,json,callback){
  ConnectDB(function(err,db){
     db.collection(collName).find(json).toArray(function(err,result){
         callback(err,result);
         db.close();
     })
  });
};
//查找
/*
* 1.查找所有的数据
* 2.分页
*   2.1 总数  页数  每页条数
*   exports.find=function(collName,json,)
* */
exports.findObj=function(collName,json,c,d){
    //判断参数的个数
    if(arguments.length==3){
        //没有参数d，代表的是callback
        var callback=c;
        //个数限制
        var limit=0;
        //跳过当前页最后一条数据的下标
        var skipnum=0;
    }else if(arguments.length==4){
        var callback=d;
    //    args是一个数组对象  可以传递多个  页数
        var args=c;
        var limit=args.pageNumber || 0;
        var skipnum=limit * args.page;
        var sort=args.sort || {};
    }else{
        throw err;
        return
    }
    ConnectDB(function(err,db){
       db.collection(collName).find(json).limit(limit).skip(skipnum).sort(sort).toArray(function(err,result){
            callback(err,result);
            db.close();
       });
    })
};