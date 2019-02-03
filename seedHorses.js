var mongoose = require("mongoose");
var OpenLeague = require("./models/openLeague");
//var PrivateLeague = require("./models/privateLeague");
var Race = require("./models/race").raceModel;
var Horse = require("./models/race").horseModel;

var data = [
    {
        horseName: "Diamond"
    }
    // {
    //     raceTitle: "Private Race 2"
    // },
    // {
    //     raceTitle: "Private Race 3"
    // },
    // {
    //     raceTitle: "Private Race 4"
    // },
    // {
    //     raceTitle: "Private Race 5"
    // }
];

function seedDB() {
    Race.findOne({ "raceTitle": 'Open Race 2' }, (err, foundRace) => {
        if (err) {
            console.log(err);
        } else {
            Horse.create({
                horseName: "Diamond"
            }, function (err, horse) {
                if (err) {
                    console.log(err);
                } else {
                    foundRace.horsesInRace.push(horse);
                    foundRace.save();
                    console.log("created new horse and added to the race");
                }
            });
        }
    });
};

module.exports = seedDB;

