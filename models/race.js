const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Horse = new Schema({
    horseName: String
});

const Race = new Schema({
    raceTitle: String,
    horsesInRace: [Horse]
});

let horseModel = mongoose.model('horses', Horse);
let raceModel = mongoose.model('races', Race);
let my_schemas = {
    'Race': Race,
    'Horse': Horse
};
module.exports = { my_schemas, raceModel, horseModel }
