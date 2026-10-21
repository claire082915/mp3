const express = require('express');
const router = express.Router();
const User = require('../models/user');

// GET /api/users 
router.get('/users', async (req, res) => {
    try {

    const where = req.query.where ? JSON.parse(req.query.where) : {};
    const sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    const select = req.query.select ? JSON.parse(req.query.select) : {};
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 0; // 0 = unlimited for users
    const count = req.query.count === 'true';

    let query = User.find(where).sort(sort).select(select).skip(skip);

    if (limit > 0) {
      query = query.limit(limit);
    }

    if (count) {
      const totalCount = await User.countDocuments(where);
      return res.status(200).json({
        message: 'OK',
        data: totalCount
      });
    }

    const users = await query.exec();
    return res.status(200).json({
      message: 'OK',
      data: users
    });
  } catch (err) {
    return res.status(400).json({
      message: 'Bad Request',
      data: err.message
    });
  }
})

module.exports = router;