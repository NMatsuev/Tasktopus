const { db } = require('../config/db');

function getByTaskId(taskId) {
  return db
    .prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY id DESC')
    .all(taskId);
}

function getById(id) {
  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
}

function create({ task_id, original_name, stored_name, mime_type, size }) {
  const info = db
    .prepare(
      `INSERT INTO attachments (task_id, original_name, stored_name, mime_type, size)
       VALUES (@task_id, @original_name, @stored_name, @mime_type, @size)`
    )
    .run({ task_id, original_name, stored_name, mime_type, size });
  return getById(info.lastInsertRowid);
}

function remove(id) {
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
}

module.exports = { getByTaskId, getById, create, remove };
