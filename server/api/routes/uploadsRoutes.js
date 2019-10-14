const express = require('express');
const router = express.Router();

const Authentication = require('../middleware/authentication');
const UploadsController = require('../controllers/uploadsController');

const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
  const fileFilter = (req, file, cb) => {
    // reject a file
    if (path.extname(file.originalname) === '.kml') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
  });

// Get all uploads from the database
router.get('/', Authentication.check_user, UploadsController.get_all);
// Upload a file to the database and create an upload
router.post('/', Authentication.check_user, upload.single('file'), UploadsController.create_upload);
// Get a single upload from the database
router.get('/:uploadId', Authentication.check_user, UploadsController.get_upload);
// DELETE an upload from the database
router.delete('/:uploadId', Authentication.check_user, UploadsController.delete_upload);

module.exports = router;

