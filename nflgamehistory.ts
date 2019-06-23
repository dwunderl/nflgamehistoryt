import fs = require("fs");
import csv = require("fast-csv");
import Fiber = require("fibers");

// Global Variables

var numGames = 0;
var numTeams = 0;
var teams = new Array();
var games = new Array();

function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield();
}

///////////////////////////////////////////
// nflGame
// Models an nfl game matchup
// homeTeam, awayTeam : object references, not just names
///////////////////////////////////////////

function nflGame (homeTeamName,awayTeamName) {
    this.homeTeam = homeTeamName;
    this.awayTeam = awayTeamName;
}

nflGame.prototype.getInfo = function() {
   return this.homeTeam + ' vs ' + this.awayTeam;
};

// find function
// passed "this" is another game
function gameMatch(g) {
  return (g.homeTeam === this.homeTeam && g.awayTeam === this.awayTeam);
}

function processGameCsvLine(data){
   if (data[0].toLowerCase() == 'week') {
      return;
   }

   var homeTeam = data[4];
   var awayTeam = data[6];

   if (data[5] === "@") {
      homeTeam = data[6];
      awayTeam = data[4];
   }

   homeTeam = getLastToken(homeTeam);
   awayTeam = getLastToken(awayTeam);

   var game = new nflGame(homeTeam,awayTeam);
   games.push(game);
   console.log(game.getInfo());
   numGames++;
}

function endGamesCsvFile(data){
   console.log('Read finished');
   console.log('numGames is ' + numGames);
   console.log('games.length is ' + games.length)
}

// end nflGame //

function getLastToken(str) {
   var tokens = str.split(" ");
   return tokens[tokens.length-1];
}

function writeGamesCsv(gameFile, games) {
   var gameWriteStream = fs.createWriteStream(gameFile);

   var i : number; 

   for (i=0; i < games.length; i++) {
      var game = games[i];
      var homeTeamName = game.homeTeam;
      var awayTeamName = game.awayTeam;
      gameWriteStream.write(homeTeamName + "," + awayTeamName + "\n");
   }

   gameWriteStream.close();
}

////////////////
// main function
////////////////
Fiber(
function() {
    console.log('wait... ' + new Date);

    var myArgs = process.argv.slice(2);
    console.log('myArgs: ', myArgs);

    if (myArgs.length === 0) {
      throw new Error("ERROR: main: no arg for the year: ");
    }
    var historicalInputFile = "nfl" + myArgs[0] + "historical.csv";
    var historicalOutputFile = "games" + myArgs[0] + ".csv";

    console.log("Historical Input File: " + historicalInputFile);
    console.log("Historical Output File: " + historicalOutputFile);
    
    // Read the historical input file and populate the games collection
    fs.createReadStream(historicalInputFile).pipe(csv())
                                   .on('data',processGameCsvLine)
                                   .on('end',endGamesCsvFile);
    sleep(100);

    // Write out the historical output csv file in Nfl Scheduling system format
    // By traversing the games collection

    writeGamesCsv(historicalOutputFile, games);
}
).run();
console.log('back in main');


