const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let horseSchema = require('./race').my_schemas;

const User = new Schema({
    name: String,
    uid: String,
    userHorses: [horseSchema.Horse],
    userRaces: [horseSchema.Race]
});

module.exports = mongoose.model('users', User);