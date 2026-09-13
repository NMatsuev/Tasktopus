const express = require('express');
const ctrl = require('../controllers/taskController');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/', ctrl.index);
router.get('/new', ctrl.newForm);
router.post('/', ctrl.create);

router.get('/:id', ctrl.show);
router.get('/:id/edit', ctrl.editForm);
router.put('/:id', ctrl.update); // вызывается через <input type="hidden" name="_method" value="PUT">
router.delete('/:id', ctrl.remove); // аналогично, value="DELETE"

router.post('/:id/attachments', upload.array('files', 5), ctrl.uploadAttachment);
router.get('/:id/attachments/:attachmentId/download', ctrl.downloadAttachment);
router.delete('/:id/attachments/:attachmentId', ctrl.removeAttachment);

module.exports = router;
