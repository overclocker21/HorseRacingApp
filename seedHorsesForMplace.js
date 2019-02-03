
var Marketplace = require("./models/marketplace");
var Horse = require("./models/race").horseModel;


function seedDBwithHorsesForMplace() {
    Marketplace.findOne({ "type": 'horses' }, (err, foundMarketplace) => {
        if (err) {
            console.log(err);
        } else {
            Horse.create({
                horseName: "Spoof"
            }, function (err, horse) {
                if (err) {
                    console.log(err);
                } else {
                    foundMarketplace.horses.push(horse);
                    foundMarketplace.save();
                    console.log("created new horse and added to the Marketplace");
                }
            });
        }
    });
};

module.exports = seedDBwithHorsesForMplace;

