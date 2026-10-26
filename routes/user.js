var mongoose = require('mongoose');
var User = require('../models/user');

function errorStatus(err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        return { status: 400, message: err.message };
    }
    return { status: 500, message: 'Internal Server Error' };
}

module.exports = function (router) {
    var usersRoute = router.route('/users');
    var userRoute = router.route('/users/:id');

    // GET /users -> list of users
    usersRoute.get(async function (req, res) {
        try {
            var users = await User.find();
            res.status(200).json({ message: 'OK', data: users });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // GET /users/:id -> get user or 404
    userRoute.get(async function (req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'Invalid user ID', data: null });
            }
            var user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found', data: null });
            }
            res.status(200).json({ message: 'OK', data: user });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // POST /users -> create user
    usersRoute.post(async function (req, res) {
        try {
            var user = await User.create(req.body);
            res.status(201).json({ message: 'User created', data: user });
        } catch (err) {
            res.status(400).json({ message: 'Bad request', data: err.message });
        }
    });

    // PUT /users/:id -> replace entire user or 404 

    // DELETE /users/:id -> delete user or 404

    return router;
};