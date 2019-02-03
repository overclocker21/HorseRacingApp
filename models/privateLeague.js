const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrivateLeagueSchema = new Schema({
    privateTitle: {
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
    races: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "races"
        }
    ]
});

module.exports = mongoose.model('private_leagues', PrivateLeagueSchema);