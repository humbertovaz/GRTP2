var express = require('express');
var router = express.Router();
var snmp = require("net-snmp");
var session = snmp.createSession("127.0.0.1", "public");


function freeSpace(blocksize, size, used) {
    result = (size - used); // Disk free = Disk size - Disk used
    if(result!=0){
      result = (result / size) * 100
    }else{
      result = 100
    }
    return result;
  }
function totalSpace(blocksize,size) {
    return size*blocksize/1000000000 //Bytes to GB
}

var options = {
  port: 161,
  retries: 1,
  timeout: 50000,
  transport: "udp4",
  trapPort: 162,
  version: snmp.Version1,
  idBitsSize: 16
};

/* GET home page. */
router.get('/', function(req, res, next) {
    var session = snmp.createSession("127.0.0.1", "public",options);
    //          ( .4 -> Unidade da particao, .5 -> Tamamanho da particao, .6 -> Size Used) 
    var oids = ["1.3.6.1.2.1.25.2.3.1.4.31", "1.3.6.1.2.1.25.2.3.1.5.31","1.3.6.1.2.1.25.2.3.1.6.31", // root 
                "1.3.6.1.2.1.25.2.3.1.4.32", "1.3.6.1.2.1.25.2.3.1.5.32","1.3.6.1.2.1.25.2.3.1.6.32", // /dev
                "1.3.6.1.2.1.25.2.3.1.4.33", "1.3.6.1.2.1.25.2.3.1.5.33","1.3.6.1.2.1.25.2.3.1.6.33", // /net
                "1.3.6.1.2.1.25.2.3.1.4.34", "1.3.6.1.2.1.25.2.3.1.5.34","1.3.6.1.2.1.25.2.3.1.6.34"] // /home
                
              
                session.get(oids, function(error, varbinds) {
                    var metrics = []
                    if (error) {
                      console.error(error);
                    } else {
                      var j = 0  
                      for (var i = 0; i < varbinds.length; i+=3){

                        if (snmp.isVarbindError(varbinds[i])){console.log("ENTREI4");console.error(snmp.varbindError(varbinds[i]));}
                        else{ 
                          //console.log(varbinds[i].oid + " = " + varbinds[i].value);
                          // Total Space (GB), Free Space(%)
                          total = totalSpace(varbinds[i].value,varbinds[i+1].value)
                          free = freeSpace(varbinds[i].value,varbinds[i+1].value,varbinds[i+2].value)
                          metrics[j]=total
                          metrics[j+4]=free
                          console.log("Free Space: "+ free)
                          console.log("Total Space: "+ total)
                          console.log("Metrics - Free Space: " + metrics[j+4])
                          console.log("Metrics - Total Space: " + metrics[j])
                          j++
                        } 
                      }  
                  
                    }
                  
                    // If done, close the session
                    res.render('space', { metrics:  metrics});
                    session.close();
                  });
                
                
})


module.exports = router;
