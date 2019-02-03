const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let horseSchema = require('./race').my_schemas;

const Marketplace = new Schema({
    type: String,
    horses: [horseSchema.Horse]
});

module.exports = mongoose.model('marketplace', Marketplace);