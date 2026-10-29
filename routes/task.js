var mongoose = require('mongoose');
var Task = require('../models/task');
var queryOptions = require('./query');

function errorStatus(err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        return { status: 400, message: err.message };
    }
    return { status: 500, message: 'Internal Server Error' };
}

module.exports = function (router) {
    var tasksRoute = router.route('/tasks');
    var taskRoute = router.route('/tasks/:id');

    // GET /tasks -> list of tasks 
    tasksRoute.get(async function(req, res) {
        try {
            var where = queryOptions.parseObject(req.query.where, 'where') || {};
            var sort = queryOptions.parseObject(req.query.sort, 'sort');
            var select = queryOptions.parseObject(req.query.select, 'select');
            var skip = queryOptions.parseNumber(req.query.skip, 'skip', 0);
            var limit = queryOptions.parseNumber(req.query.limit, 'limit', 100);

            if (queryOptions.isTrue(req.query.count)) {
                var count = await Task.countDocuments(where);
                return res.status(200).json({ message: 'OK', data: count });
            }

            var query = Task.find(where);
            if (sort) query = query.sort(sort);
            if (select) query = query.select(select);
            query = query.skip(skip).limit(limit);
            var tasks = await query;
            res.status(200).json({ message: 'OK', data: tasks });
        } catch (err) {
            if (err instanceof SyntaxError || err.message.includes('must be a JSON object') || err.message.includes('must be a non-negative integer')) {
                return res.status(400).json({ message: 'Bad request', data: null });
            }
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // POST /tasks -> create task 
    tasksRoute.post(async function(req, res) {
        try {
            var replacement = Object.assign({}, req.body);
            var assignedUserId = replacement.assignedUser || '';
            var assignedUser = null;
            if (assignedUserId) {
                if (!mongoose.isValidObjectId(assignedUserId)) {
                    return res.status(400).json({ message: 'Bad request', data: null });
                }
                assignedUser = await require('../models/user').findById(assignedUserId);
                if (!assignedUser) return res.status(404).json({ message: 'User not found', data: null });
                if (Object.prototype.hasOwnProperty.call(replacement, 'assignedUserName') && replacement.assignedUserName !== assignedUser.name) {
                    return res.status(400).json({ message: 'Bad request', data: null });
                }
                replacement.assignedUserName = assignedUser.name;
            } else {
                replacement.assignedUser = '';
                replacement.assignedUserName = 'unassigned';
            }
            var task = await Task.create(replacement);
            if (assignedUser && !task.completed) {
                await require('../models/user').updateOne(
                    { _id: assignedUser._id },
                    { $addToSet: { pendingTasks: String(task._id) } }
                );
            }
            res.status(201).json({ message: 'Task created', data: task });
        } catch (err) {
            res.status(400).json({ message: 'Bad request', data: err.message });
        }
    });

    // GET /tasks/:id -> get task or 404 
    taskRoute.get(async function(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'Invalid task ID', data: null });
            }
            var query = Task.findById(req.params.id);
            var select = queryOptions.parseObject(req.query.select, 'select');
            if (select) query = query.select(select);
            var task = await query;
            if (!task) {
                return res.status(404).json({ message: 'Task not found', data: null });
            }
            res.status(200).json({ message: 'OK', data: task });
        } catch (err) {
            if (err instanceof SyntaxError || err.message.includes('must be a JSON object')) {
                return res.status(400).json({ message: 'Bad request', data: null });
            }
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // PUT /tasks/:id -> replace entire task or 404
    taskRoute.put(async function(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(404).json({ message: 'Task not found', data: null });
            }
            var oldTask = await Task.findById(req.params.id);
            if (!oldTask) return res.status(404).json({ message: 'Task not found', data: null });
            var replacement = Object.assign({}, req.body);
            delete replacement._id;
            replacement.dateCreated = oldTask.dateCreated;
            var User = require('../models/user');
            var assignedUserId = replacement.assignedUser || '';
            var assignedUser = null;
            if (assignedUserId) {
                if (!mongoose.isValidObjectId(assignedUserId)) {
                    return res.status(400).json({ message: 'Bad request', data: null });
                }
                assignedUser = await User.findById(assignedUserId);
                if (!assignedUser) return res.status(404).json({ message: 'User not found', data: null });
                if (Object.prototype.hasOwnProperty.call(replacement, 'assignedUserName') && replacement.assignedUserName !== assignedUser.name) {
                    return res.status(400).json({ message: 'Bad request', data: null });
                }
                replacement.assignedUserName = assignedUser.name;
            } else {
                replacement.assignedUser = '';
                replacement.assignedUserName = 'unassigned';
            }
            var task = await Task.findOneAndReplace({ _id: req.params.id }, replacement, { new: true, runValidators: true });
            if (oldTask.assignedUser) {
                await User.updateOne({ _id: oldTask.assignedUser }, { $pull: { pendingTasks: String(oldTask._id) } });
            }
            if (assignedUser && !task.completed) {
                await User.updateOne({ _id: assignedUser._id }, { $addToSet: { pendingTasks: String(task._id) } });
            }
            res.status(200).json({ message: 'Task updated', data: task });
        } catch (err) {
            var status = errorStatus(err);
            res.status(status.status).json({
                message: status.status === 400 ? 'Bad request' : 'Server error',
                data: err.message
            });
        }
    });

    // DELETE /tasks/:id -> delete task or 404
    taskRoute.delete(async function(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'Invalid task ID', data: null });
            }
            var task = await Task.findByIdAndDelete(req.params.id);
            if (!task) {
                return res.status(404).json({ message: 'Task not found', data: null });
            }
            res.status(204).end();
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    return router;
};
