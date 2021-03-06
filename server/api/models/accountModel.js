const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    organization: { type: String },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    delete_permission: { type: Boolean, required: true } // used to determine if an account is an admin or not
});

module.exports = mongoose.model('Account', accountSchema);