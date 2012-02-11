var keys   = require('./keys');

var Bot    = require(keys.NODE_LOC + "/Turntable-API/index");
var bot = new Bot(keys.AUTH, keys.USERID, keys.ROOMID);

var sqlite3 = require(keys.NODE_LOC + "/node-sqlite3/sqlite3");
var db = new sqlite3.Database(keys.DATABASE_LOC);

bot.on('endsong', function(data) {
   var Query1 = "INSERT OR IGNORE INTO users (id, score) VALUES ('" + 
                data.room.metadata.current_dj + "', " + data.room.metadata.upvotes + 
                ");";
   var Query2 = "UPDATE users SET score = score + " + data.room.metadata.upvotes + 
                " WHERE id = '" + data.room.metadata.current_dj + "';"
   db.exec(Query1 + Query2);
});

bot.on('registered', function(data){
   for(i = 0; i < data.user.length; i++){
      var Query = "SELECT banned FROM users WHERE id = '" + data.user[0].userid + "';";
      db.get(Query, function(err, sqldata){
         if(typeof(sqldata) != "undefined"){
            if(sqldata.banned){
               bot.bootUser(data.user[0].userid,"");
            }
         }
      });
   }
});

bot.on('speak', function (data) {
   // Get the data
   var name = data.name;
   var text = data.text;

   //Let Hounddog turn notifications on and off
   if(text.toLowerCase() == "houndbot dj on"){
      bot.roomInfo(function(data){
         if(data.room.metadata.djs[0] != USERID &&
            data.room.metadata.djs[1] != USERID &&
            data.room.metadata.djs[2] != USERID &&
            data.room.metadata.djs[3] != USERID &&
            data.room.metadata.djs[4] != USERID){
	    bot.addDj(function (dummy){
	       bot.speak("DJing for you!  Type \'Houndbot DJ off\' to make me stop, or \'Houndbot skip\' if you don't like my song.");
	    });
         }
      });
   }
   if(text.toLowerCase() == "houndbot dj off"){
      bot.roomInfo(function(data){
         if(data.room.metadata.djs[0] == USERID ||
            data.room.metadata.djs[1] == USERID ||
            data.room.metadata.djs[2] == USERID ||
            data.room.metadata.djs[3] == USERID ||
            data.room.metadata.djs[4] == USERID){
	    bot.remDj(USERID, function (dummy){
	       bot.speak("Stepping down.");
	    });
         }
      });
   }
   if(text.toLowerCase() == "houndbot skip"){
      bot.roomInfo(function(data){
         if(data.room.metadata.djs[0] == USERID ||
            data.room.metadata.djs[1] == USERID ||
            data.room.metadata.djs[2] == USERID ||
            data.room.metadata.djs[3] == USERID ||
            data.room.metadata.djs[4] == USERID){
	    bot.skip(function (dummy){
	       bot.speak("Skipping song.");
	    });
         }
      });
   }
   if(text.toLowerCase() == "houndbot help"){
      bot.speak("AVAILABLE COMMANDS:  \'Houndbot DJ on\', \'Houndbot DJ off\', \'Houndbot skip\'," +
                "\'Houndbot dance\', \'Houndbot mystats\'");
   }
   if(text.toLowerCase() == "houndbot dance" ||
      text.toLowerCase() == "houndbot shim sham" ||
      text.toLowerCase() == "houndbot shimsham" ||
      text.toLowerCase() == "houndbot swingout" ||
      text.toLowerCase() == "houndbot california routine" ||
      text.toLowerCase() == "houndbot bust a move"){
      bot.vote('up');
   }
   if(text.toLowerCase() == "houndbot my stats" ||
      text.toLowerCase() == "houndbot mystats"){
      //Query for user
      db.get("SELECT score FROM users WHERE id = '" + data.userid + "';", function(err, sqldata){
         if(typeof(sqldata)!='undefined'){
            bot.speak(data.name + ", you have " + sqldata.score + " points from this room");
         }
         else
            bot.speak(data.name + ", you have no points from this room");
      });
   }
   if(text.substring(0, 12).toLowerCase() == "houndbot ban"){
      bot.roomInfo(false, function(roomInfo){
         if(roomInfo.room.metadata.moderator_id.indexOf(data.userid) != -1){
            //Moderator is speaking, add to ban list
            var idx = 0;
            for(; idx < roomInfo.users.length && 
                roomInfo.users[idx].name.toLowerCase() != text.substring(12).replace(/\s/g, "").toLowerCase(); idx++);
            if(idx < roomInfo.users.length){
               var Query1 = "INSERT OR IGNORE INTO users (id, banned) VALUES ('" + 
                              roomInfo.users[idx].userid + "', 1);";
               var Query2 = "UPDATE users SET banned = 1 WHERE id = '" +
                              roomInfo.users[idx].userid + "';";
               db.exec(Query1 + Query2);
               bot.bootUser(roomInfo.users[idx].userid, "");
            }
         }
      });
   }
            
      
});
