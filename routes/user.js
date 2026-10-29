var mongoose = require('mongoose');
var User = require('../models/user');
var queryOptions = require('./query');

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
            var where = queryOptions.parseObject(req.query.where, 'where') || {};
            var sort = queryOptions.parseObject(req.query.sort, 'sort');
            var select = queryOptions.parseObject(req.query.select, 'select');
            var skip = queryOptions.parseNumber(req.query.skip, 'skip', 0);
            var limit = queryOptions.parseNumber(req.query.limit, 'limit', 0);

            if (queryOptions.isTrue(req.query.count)) {
                var count = await User.countDocuments(where);
                return res.status(200).json({ message: 'OK', data: count });
            }

            var query = User.find(where);
            if (sort) query = query.sort(sort);
            if (select) query = query.select(select);
            query = query.skip(skip);
            if (limit > 0) query = query.limit(limit);
            var users = await query;
            res.status(200).json({ message: 'OK', data: users });
        } catch (err) {
            if (err instanceof SyntaxError || err.message.includes('must be a JSON object') || err.message.includes('must be a non-negative integer')) {
                return res.status(400).json({ message: 'Bad request', data: null });
            }
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // GET /users/:id -> get user or 404
    userRoute.get(async function (req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'Invalid user ID', data: null });
            }
            var query = User.findById(req.params.id);
            var select = queryOptions.parseObject(req.query.select, 'select');
            if (select) query = query.select(select);
            var user = await query;
            if (!user) {
                return res.status(404).json({ message: 'User not found', data: null });
            }
            res.status(200).json({ message: 'OK', data: user });
        } catch (err) {
            if (err instanceof SyntaxError || err.message.includes('must be a JSON object')) {
                return res.status(400).json({ message: 'Bad request', data: null });
            }
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
    userRoute.put(async function (req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(404).json({ message: 'User not found', data: null });
            }
            var replacement = Object.assign({}, req.body);
            delete replacement._id;
            if (!replacement.dateCreated) replacement.dateCreated = new Date();
            if (!replacement.pendingTasks) replacement.pendingTasks = [];
 
            var user = await User.findOneAndReplace(
                { _id: req.params.id },
                replacement,
                { new: true, runValidators: true }
            );
            if (!user) {
                return res.status(404).json({ message: 'User not found', data: null });
            }
            res.status(200).json({ message: 'User updated', data: user });
        } catch (err) {
            var status = errorStatus(err);
            res.status(status).json({
                message: status === 400 ? 'Bad request' : 'Server error',
                data: err.message
            });
        }
    });

    // DELETE /users/:id -> delete user or 404
    userRoute.delete(async function (req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(404).json({ message: 'User not found', data: null });
            }
            var user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found', data: null });
            }
            res.status(200).json({ message: 'User deleted', data: user });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    return router;
};
