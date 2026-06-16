const fs = require('fs');
const path = require('path');
const multer = require('multer');

function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dest = path.join(__dirname, '..', 'uploads', 'complaints');
		ensureDir(dest);
		cb(null, dest);
	},
	filename: (req, file, cb) => {
		const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
		const extension = path.extname(safeOriginal);
		cb(null, `${file.fieldname}-${Date.now()}${extension}`);
	},
});

const fileFilter = (req, file, cb) => {
	const allowed = /jpe?g|png|webp|mp4|mov|avi/;
	const ext = path.extname(file.originalname).toLowerCase();
	if (allowed.test(ext)) {
		return cb(null, true);
	}
	return cb(new Error('Only image and video files are allowed')); 
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 50 * 1024 * 1024, files: 5 },
});

const uploadMedia = upload.array('media', 5);

module.exports = { upload, uploadMedia };
