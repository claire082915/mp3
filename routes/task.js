var mongoose = require('mongoose');
var Task = require('../models/task');

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
            var tasks = await Task.find();
            res.status(200).json({ message: 'OK', data: tasks });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // POST /tasks -> create task 
    tasksRoute.post(async function(req, res) {
        try {
            var task = await Task.create(req.body);
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
            var task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json({ message: 'Task not found', data: null });
            }
            res.status(200).json({ message: 'OK', data: task });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    // PUT /tasks/:id -> replace entire task or 404
    taskRoute.put(async function(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(404).json({ message: 'Task not found', data: null });
            }
            var replacement = Object.assign({}, req.body);
            delete replacement._id;
            if (!replacement.dateCreated) replacement.dateCreated = new Date();
 
            var task = await Task.findOneAndReplace(
                { _id: req.params.id },
                replacement,
                { new: true, runValidators: true }
            );
            if (!task) {
                return res.status(404).json({ message: 'Task not found', data: null });
            }
            res.status(200).json({ message: 'Task updated', data: task });
        } catch (err) {
            var status = errorStatus(err);
            res.status(status).json({
                message: status === 400 ? 'Bad request' : 'Server error',
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
            res.status(200).json({ message: 'Task deleted', data: task });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
    });

    return router;
};