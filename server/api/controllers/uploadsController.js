const Upload = require('../models/uploadModel');
const mongoose = require('mongoose');
const validator = require('./validator');
const { Readable } = require('stream');

/**
 * RETURN ALL UPLOADS IN THE DATABASE
 * SORTED BY UPLOAD_DATE
 */

exports.get_all = (req, res, next) => {
    const regex = new RegExp(req.query.search, 'i');
    // find all upload in the database
    Upload.find({$or: [
        { title: regex },
        { description: regex },
        { upload_by: regex },
        { filename: regex }
    ]})
        .limit(parseInt(req.query.count) || 20)
        .skip(parseInt(req.query.page-1)*parseInt(req.query.count))
        .sort(req.query.sort || { 'upload_date': -1 })
        .select("_id title description upload_date upload_by last_modified delete_by delete_date filename checksum file_size parser_status") // data you want to fetch
        .exec()
        .then(docs => {
            res.status(200).send(docs);
        })
        .catch(err => {
            err.status = 500;
            next(err);
        });
};

/**
 * CREATE AN UPLOAD AND STORE THE UPLOADED FILE DATA TO THE DATABASE
 */
exports.create_upload = (req, res, next) => {
    // create an upload object using the data parsed from the request body
    // and parsed metadata using multer
    if (!req.file) {
        const error = new Error('Path `file` is required.');
        error.status = 400;
        return next(error);
    }

    // this id will be used for the upload_id and fs.files_id
    const files_id = new mongoose.Types.ObjectId();

    const upload = new Upload({
        _id: files_id,
        title: req.body.title,
        description: req.body.description,
        upload_date: Date.now(),
        last_modified: Date.now(),
        upload_by: req.userData.username,
        filename: req.file.originalname,
        file_size: req.file.size,
        parser_status: 'validationResults'
    });
    // save the upload to the database
    upload
        .save()
        .then(result => {
            // uploading file to database
            // creating a readablestream and pushing the file data from multer memory buffer
            const readableStream = new Readable();
            readableStream.push(req.file.buffer);
            readableStream.push(null);
            
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'uploads'
            });
            readableStream.
                pipe(bucket.openUploadStreamWithId(files_id, req.file.originalname)).
                on('error', function (error) {
                    // upload failed
                    error.status = 500;
                    return next(error);
                }).
                on('finish', function (file) {
                    // upload successful
                    req.file.md5 = file.md5; // save md5 generated by gridfsbucket
                });

            // sending upload created successfully response
            res.status(201).json({
                message: "Upload created successfully",
                createdUpload: {
                    _id: result._id,
                    title: result.title,
                    description: result.description,
                    upload_date: result.upload_date,
                    upload_by: result.upload_by,
                    last_modified: result.last_modified,
                    filename: result.filename,
                    file_size: result.file_size
                }
            });

            // validate xml file using fast-xml-parser and store validation result in a json object
            const xmlString = req.file.buffer.toString('utf8');
            validator.validateXML(xmlString, function (err, validationResults) {
                // update upload with parser_status and checksum
                upload.updateOne({ $set: { parser_status: validationResults, checksum: req.file.md5 } })
                    .exec()
                    .catch(err => {
                        console.log('Failed to update parser status and checksum ' + err.message);
                    });
            });
        })
        .catch(err => {
            err.status = 500;
            next(err);

        });
};

/**
 * GET A SINGLE UPLOAD FROM THE DATABASE
*/
exports.get_upload = (req, res, next) => {
    // validate parameter from request
    if (!mongoose.Types.ObjectId.isValid(req.params.uploadId)) {
        const error = new Error('Parameter must be a valid ObjectId');
        error.status = 400;
        return next(error);
    }
    // find upload in database by ID 
    Upload.findById(req.params.uploadId)
        .select("_id title description upload_date upload_by last_modified delete_by delete_date filename checksum file_size parser_status") // data you want to fetch
        .exec()
        .then(doc => {
            if (doc) {
                // upload found
                res.status(200).json({
                    upload: doc,
                });
            } else {
                // upload not found
                const error = new Error('Upload not found');
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
 * DELETE AN UPLOAD FROM THE DATABASE
 * THIS METHOD REMOVE THE FILES DATA FROM THE DATABASE
 * AND UPDATE THE "DELETE_BY" AND "DELETE_DATE" OF THE UPLOAD
 */
exports.delete_upload = (req, res, next) => {
    // validate parameter
    if (!mongoose.Types.ObjectId.isValid(req.params.uploadId)) {
        const error = new Error('Parameter must be a valid ObjectId');
        error.status = 400;
        return next(error);
    }
    // find the upload in the database by upload_id
    Upload.findById(req.params.uploadId)
        .exec()
        .then(result => {
            if (result) {
                // return if file has is already deleted
                if (result.delete_by !== undefined) {
                    const error = new Error('File already deleted');
                    error.status = 404;
                    next(error);
                } else {
                    // update the "delete_by" and "delete_date" fields 
                    result.updateOne({ $set: { delete_by: req.userData.username, delete_date: Date.now() } })
                        .exec()
                        .then(doc => {
                            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                                bucketName: 'uploads'
                            });
                            bucket.delete(result._id, function (error) {
                                if (error) {
                                    // delete failed
                                    error.status = 500;
                                    return next(error);
                                } else {
                                    // delete successful
                                    res.status(200).json({
                                        message: 'File deleted',
                                    });
                                }
                            });
                        })
                        .catch(err => {
                            err.status = 500;
                            next(err);
                        });
                }
            } else {
                const error = new Error('File not found');
                error.status = 404;
                next(error);
            }
        }).catch(err => {
            err.status = 500;
            next(err);
        })
};