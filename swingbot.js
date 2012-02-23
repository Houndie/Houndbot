var keys   = require('./keys');

var Bot    = require(keys.NODE_LOC + "/Turntable-API/index");
var bot = new Bot(keys.AUTH, keys.USERID, keys.ROOMID);

var sqlite3 = require(keys.NODE_LOC + "/node-sqlite3/sqlite3");
var db = new sqlite3.Database(keys.DATABASE_LOC);

bot.isDj = function() {
    var result = false;
    this.roomInfo(function(data) {
        if (data.room.metadata.djs.indexOf(keys.USERID) != -1) {
            result = true;
        }
    });

    return result;
};


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
   var text = data.text.toLowerCase();

   //Let Hounddog turn notifications on and off
   if(text == "houndbot dj on"){
       if (!bot.isDj()) {
	     bot.addDj(function (dummy){
	       bot.speak("DJing for you!  Type \'Houndbot DJ off\' to make me stop, or \'Houndbot skip\' if you don't like my song.");
	     });
       }
   }
   if(text == "houndbot dj off"){
      if (bot.isDj()) {
	    bot.remDj(keys.USERID, function (dummy){
	       bot.speak("Stepping down.");
	    });
      }
   }
   if(text == "houndbot skip"){
      if (bot.isDj()) {
	    bot.skip(function (dummy){
	       bot.speak("Skipping song.");
	    });
      }
   }
   if(text == "houndbot help"){
      bot.speak("AVAILABLE COMMANDS:  \'Houndbot DJ on\', \'Houndbot DJ off\', \'Houndbot skip\'," +
                "\'Houndbot dance\', \'Houndbot mystats\'");
   }
   if(text == "houndbot dance" ||
      text == "houndbot shim sham" ||
      text == "houndbot shimsham" ||
      text == "houndbot swingout" ||
      text == "houndbot california routine" ||
      text == "houndbot shake that thing" ||
      text == "houndbot bust a move"){
      bot.vote('up');
   }
   if(text == "houndbot my stats" ||
      text == "houndbot mystats"){
      //Query for user
      db.get("SELECT score FROM users WHERE id = '" + data.userid + "';", function(err, sqldata){
         if(typeof(sqldata)!='undefined'){
            bot.speak(data.name + ", you have " + sqldata.score + " points from this room");
         }
         else
            bot.speak(data.name + ", you have no points from this room");
      });
   }
   if(text.substring(0, 12) == "houndbot ban"){
      bot.roomInfo(false, function(roomInfo){
         if(roomInfo.room.metadata.moderator_id.indexOf(data.userid) != -1){
            //Moderator is speaking, add to ban list
            var idx = 0;
            for(; idx < roomInfo.users.length && 
                roomInfo.users[idx].name.toLowerCase() != text.substring(12).replace(/\s/g, ""); idx++);
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
