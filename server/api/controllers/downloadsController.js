const Download = require('../models/downloadModel');
const Upload = require('../models/uploadModel');
const mongoose = require('mongoose');

/**
 * RETURN ALL DOWNLOADS IN THE DATABASE
 */
exports.get_all = (req, res, next) => {
    const regex = new RegExp(req.query.search, 'i');
    // find all download in the database
    Download.find({$or: [
        { download_by: regex },
        { download_via: regex }
    ]})
        .limit(parseInt(req.query.count) || 20)
        .skip(parseInt(req.query.page-1)*parseInt(req.query.count))
        .sort(req.query.sort || {'download_date': -1 })
        .select("_id upload_id download_date download_by download_via") // data you want to fetch
        .exec()
        .then(docs => {
            res.status(200).json({
                downloads: docs
            });
        })
        .catch(err => {
            err.status = 500;
            next(err);
        });
};

/**
 * DOWNLOAD A FILE AND CREATE AN DOWNLOAD
 */
exports.create_download = (req, res, next) => {
    // validate parameter
    if (!mongoose.Types.ObjectId.isValid(req.params.uploadId)) {
        const error = new Error('Parameter must be a valid ObjectId');
        error.status = 400;
        return next(error);
    }
    // find the file by upload_id
    Upload.findById(req.params.uploadId)
        .exec()
        .then(result => {
            if (result) { // there is an upload with that upload_id
                // return if file has a delete_by field
                if (result.delete_by !== undefined) {
                    const error = new Error('File already deleted');
                    error.status = 404;
                    return next(error);
                } else {
                    // create a download object
                    const download = new Download({
                        _id: new mongoose.Types.ObjectId(),
                        upload_id: result._id,
                        download_by: req.userData.username,
                        download_date: Date.now(),
                        download_via: req.body.download_via || 'API'
                    });
                    // set response header filename or else it would return response.minetype
                    res.setHeader("Content-Disposition", "attachment; filename=" + result.filename);
                    // save the download to the database
                    download.save()
                        .then(result => {
                            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                                bucketName: 'uploads'
                            });
                            bucket.openDownloadStream(result.upload_id)
                                .pipe(res)
                                .on('error', function (error) {
                                    // download failed
                                    error.status = 500;
                                    return next(error);
                                })
                                .on('finish', function () {
                                    // download successful
                                });
                        })
                        .catch(err => {
                            err.status = 500;
                            next(err);
                        });
                }
            } else { // the upload with that upload_id does not exist
                const error = new Error('File not found');
                error.status = 404;
                next(error);
            }
        })
        .catch(err => {
            err.status = 500;
            next(err);
        });
};

/**
 * GET ALL DOWNLOADS OF AN UPLOAD
 */
exports.get_download = (req, res, next) => {
    const regex = new RegExp(req.query.search, 'i');
    // validate parameter from request
    if (!mongoose.Types.ObjectId.isValid(req.params.uploadId)) {
        const error = new Error('Parameter must be a valid ObjectId');
        error.status = 400;
        return next(error);
    }
    // find all downloads with the specify upload_id in the database
    Download.find({ upload_id: req.params.uploadId, $or: [
        { download_by: regex },
        { download_via: regex }]})
        .limit(parseInt(req.query.count) || 20)
        .skip(parseInt(req.query.page-1)*parseInt(req.query.count))
        .sort(req.query.sort || {'download_date': -1 })
        .select("upload_id download_date download_by download_via") // data you want to fetch
        .exec()
        .then(results => {
            if (results.length >= 1) { // there is at least one download record
                res.status(200).json({
                    downloads: results
                });
            } else { // no download record found
                const error = new Error("No valid entry found for provided upload_id");
                error.status = 404;
                next(error);
            }
        })
        .catch(err => {
            err.status = 500;
            next(err);
        });
};
