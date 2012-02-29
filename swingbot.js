var keys   = require('./keys');

var Bot    = require(keys.NODE_LOC + "/Turntable-API/index");
var bot = new Bot(keys.AUTH, keys.USERID, keys.ROOMID);

var sqlite3 = require(keys.NODE_LOC + "/node-sqlite3/sqlite3");
var db = new sqlite3.Database(keys.DATABASE_LOC);

Array.prototype.includes = function(element) {
    return this.indexOf(element) != -1;
};

bot.isDj = function() {
    var result = false;
    this.roomInfo(function(data) {
        if (data.room.metadata.djs.includes(keys.USERID)) {
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
               bot.bootUser(data.user[0].userid, "Banned");
            }
         }
      });
   }
});

bot.on('speak', function (data) {
   // Get the data
   var name = data.name;
   var text = data.text.toLowerCase();

   if (text.match(/^houndbot/)) {
       var command = text.replace(/^houndbot\s+/, '');

   //Let Hounddog turn notifications on and off
   if(command == "dj on"){
       if (!bot.isDj()) {
	     bot.addDj(function (dummy){
	       bot.speak("DJing for you!  Type \'Houndbot DJ off\' to make me stop, or \'Houndbot skip\' if you don't like my song.");
	     });
       }
   }

   if(command == "dj off"){
      if (bot.isDj()) {
	    bot.remDj(keys.USERID, function (dummy){
	       bot.speak("Stepping down.");
	    });
      }
   }

   if(command == "skip"){
      if (bot.isDj()) {
	    bot.skip(function (dummy){
	       bot.speak("Skipping song.");
	    });
      }
   }

   if(command == "help"){
      bot.speak("AVAILABLE COMMANDS:  \'Houndbot DJ on\', \'Houndbot DJ off\', \'Houndbot skip\'," +
                "\'Houndbot dance\', \'Houndbot mystats\'");
   }

   if(['dance', 'shim sham', 'shimsham', 'swingout', 'california routine', 'shake that thing', 'bust a move'].includes(command)){
      bot.vote('up');
   }

   if(['mystats', 'my stats'].includes(command)){
      //Query for user
      db.get("SELECT score FROM users WHERE id = '" + data.userid + "';", function(err, sqldata){
         if(typeof(sqldata)!='undefined'){
            bot.speak(data.name + ", you have " + sqldata.score + " points from this room");
         }
         else
            bot.speak(data.name + ", you have no points from this room");
      });
   }

   if(command.match(/^ban /)){
      var ban_username = command.replace(/^ban\s+/, '').replace(/\s/g, '');

      bot.roomInfo(false, function(roomInfo){
         if(roomInfo.room.metadata.moderator_id.includes(data.userid)){
            //Moderator is speaking, add to ban list
            var idx = 0;
            for(; idx < roomInfo.users.length && 
                roomInfo.users[idx].name.toLowerCase() != ban_username; idx++);
            if(idx < roomInfo.users.length){
               var Query1 = "INSERT OR IGNORE INTO users (id, banned) VALUES ('" + 
                              roomInfo.users[idx].userid + "', 1);";
               var Query2 = "UPDATE users SET banned = 1 WHERE id = '" +
                              roomInfo.users[idx].userid + "';";
               db.exec(Query1 + Query2);
               bot.bootUser(roomInfo.users[idx].userid, "Banned");
            }
         }
      });
   }

   }
});
