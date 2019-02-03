var mongoose = require("mongoose");

var User = require("./models/user");
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

function seedDBwithHorsesForUser() {
    User.findOne({ "uid": '773160929731148' }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            Horse.create({
                horseName: "Fucker"
            }, function (err, horse) {
                if (err) {
                    console.log(err);
                } else {
                    foundUser.userHorses.push(horse);
                    foundUser.save();
                    console.log("created new horse and added to the user");
                }
            });
        }
    });
};

module.exports = seedDBwithHorsesForUser;

