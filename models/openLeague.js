const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let raceSchema = require('./race').my_schemas;

const OpenLeagueSchema = new Schema({
    openTitle: {
        type: String,
        required: true
    },
    numOfRaces: {
        type: Number,
        required: true
    },
    numOfPlayers: {
        type: Number,
        required: true
    },
    numOfHorses: {
        type: Number,
        required: true
    },
    typeOfHorses: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    endDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    races: [raceSchema.Race]
});

module.exports = mongoose.model('open_leagues', OpenLeagueSchema);