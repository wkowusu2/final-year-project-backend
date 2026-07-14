import multer from 'multer';

export const incidentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => done(null, file.mimetype.startsWith('image/')),
});
