const Notice = require('../models/Notice');

exports.getNotices = async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createNotice = async (req, res) => {
    try {
        const notice = new Notice({
            ...req.body,
            postedBy: req.user?._id
        });
        await notice.save();
        res.status(201).json(notice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
