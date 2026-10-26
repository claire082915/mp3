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

    // DELETE /tasks/:id -> delete task or 404
    return router;
};