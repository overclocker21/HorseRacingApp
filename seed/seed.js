var mongoose = require("mongoose");
var OpenLeague = require("../models/openLeague");
//var PrivateLeague = require("./models/privateLeague");
var Race = require("../models/race").raceModel;

var data = [
    {
        raceTitle: "The Big Hurdle"
    }
];

function seedDB() {

    data.forEach(function (seed) {
        OpenLeague.findOne({ "openTitle": "First Open" }, (err, foundLeague) => {
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

