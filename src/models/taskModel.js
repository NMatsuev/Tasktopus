const { db } = require('../config/db');

/**
 * Возвращает список задач, опционально отфильтрованный по статусу.
 * Считаем количество вложений одним запросом (без N+1).
 * Сортировка: сначала задачи с ближайшим сроком, задачи без срока — в конце.
 */
function getAll({ status } = {}) {
  const base = `
    SELECT
      t.*,
      COUNT(a.id) AS attachments_count
    FROM tasks t
    LEFT JOIN attachments a ON a.task_id = t.id
    ${status ? 'WHERE t.status = ?' : ''}
    GROUP BY t.id
    ORDER BY (t.due_date IS NULL), t.due_date ASC, t.id DESC
  `;
  return status ? db.prepare(base).all(status) : db.prepare(base).all();
}

function getById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function create({ title, description, status, due_date }) {
  const info = db
    .prepare(
      `INSERT INTO tasks (title, description, status, due_date)
       VALUES (@title, @description, @status, @due_date)`
    )
    .run({
      title,
      description: description || null,
      status,
      due_date: due_date || null,
    });
  return getById(info.lastInsertRowid);
}

function update(id, { title, description, status, due_date }) {
  db.prepare(
    `UPDATE tasks
     SET title = @title,
         description = @description,
         status = @status,
         due_date = @due_date,
         updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    title,
    description: description || null,
    status,
    due_date: due_date || null,
  });
  return getById(id);
}

function remove(id) {
  // ON DELETE CASCADE в схеме удалит связанные записи attachments автоматически.
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

module.exports = { getAll, getById, create, update, remove };
