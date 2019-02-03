var mongoose = require("mongoose");
var OpenLeague = require("../models/openLeague");
//var PrivateLeague = require("./models/privateLeague");
var Race = require("../models/race").raceModel;

var data = [
    {
        raceTitle: "Cracker"
    }
];

function seedDB() {

    data.forEach(function (seed) {
        OpenLeague.findOne({ "openTitle": "Testing 2" }, (err, foundLeague) => {
            if (err) {
                console.log(err);
            } else {
                Race.create(seed, function (err, race) {
                    if (err) {
                        console.log(err);
                    } else {
                        foundLeague.races.push(race);
                        foundLeague.save();
                        console.log("created new race");

                    }
                });
            }
        });
    });
};

module.exports = seedDB;

