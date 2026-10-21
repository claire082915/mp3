var User = require('../models/user');

module.exports = function (router) {
    var usersRoute = router.route('/users');

    usersRoute.get(async function (req, res) {
        try {
            var users = await User.find();
            res.status(200).json({ message: 'OK', data: users });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    usersRoute.post(async function (req, res) {
        try {
            var user = await User.create(req.body);
            res.status(201).json({ message: 'User created', data: user });
        } catch (err) {
            res.status(400).json({ message: 'Bad request', data: err.message });
        }
    });

    return router;
};