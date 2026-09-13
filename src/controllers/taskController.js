const fs = require("fs");
const path = require("path");

const taskModel = require("../models/taskModel");
const attachmentModel = require("../models/attachmentModel");
const { STATUSES, isValidStatus } = require("../constants/status");
const { UPLOAD_ROOT } = require("../middleware/upload");

/**
 * Валидация данных формы задачи. Возвращает { errors, values }.
 * values — уже нормализованные данные, которые можно как сохранить в БД,
 * так и вернуть обратно в форму при ошибке (чтобы пользователь не терял ввод).
 */
function validateTaskInput(body) {
  const errors = [];
  const title = (body.title || "").trim();
  const status = body.status || "todo";
  const due_date = (body.due_date || "").trim();
  const description = (body.description || "").trim();

  if (!title) errors.push("Название задачи обязательно.");
  if (title.length > 200)
    errors.push("Название не должно превышать 200 символов.");
  if (!isValidStatus(status)) errors.push("Недопустимый статус.");
  if (due_date && Number.isNaN(Date.parse(due_date))) {
    errors.push("Некорректная дата выполнения.");
  }

  return {
    errors,
    values: { title, description, status, due_date: due_date || null },
  };
}

function removeTaskFilesFromDisk(taskId) {
  const taskDir = path.join(UPLOAD_ROOT, String(taskId));
  fs.rm(taskDir, { recursive: true, force: true }, () => {});
}

// GET /tasks — список задач с фильтром по статусу (?status=...)
exports.index = (req, res) => {
  const filterStatus = isValidStatus(req.query.status)
    ? req.query.status
    : null;
  const tasks = taskModel.getAll({ status: filterStatus });
  res.render("tasks/index", {
    title: "Список задач",
    tasks,
    statuses: STATUSES,
    currentStatus: filterStatus,
    query: req.query,
  });
};

// GET /tasks/new — форма создания
exports.newForm = (req, res) => {
  res.render("tasks/new", {
    title: "Новая задача",
    statuses: STATUSES,
    errors: [],
    values: { title: "", description: "", status: "todo", due_date: "" },
  });
};

// POST /tasks — создание задачи (обычная отправка формы)
exports.create = (req, res) => {
  const { errors, values } = validateTaskInput(req.body);
  if (errors.length) {
    return res.status(422).render("tasks/new", {
      title: "Новая задача",
      statuses: STATUSES,
      errors,
      values,
    });
  }
  const task = taskModel.create(values);
  res.redirect(`/tasks/${task.id}?ok=created`);
};

// GET /tasks/:id — карточка задачи + список вложений
exports.show = (req, res, next) => {
  const task = taskModel.getById(req.params.id);
  if (!task) return next();
  const attachments = attachmentModel.getByTaskId(task.id);
  res.render("tasks/show", {
    title: task.title,
    task,
    attachments,
    statuses: STATUSES,
    query: req.query,
  });
};

// GET /tasks/:id/edit — форма редактирования
exports.editForm = (req, res, next) => {
  const task = taskModel.getById(req.params.id);
  if (!task) return next();
  res.render("tasks/edit", {
    title: `Изменить: ${task.title}`,
    statuses: STATUSES,
    errors: [],
    values: task,
    taskId: task.id,
  });
};

// PUT /tasks/:id (форма с _method=PUT) — обновление задачи
exports.update = (req, res, next) => {
  const task = taskModel.getById(req.params.id);
  if (!task) return next();

  const { errors, values } = validateTaskInput(req.body);
  if (errors.length) {
    return res.status(422).render("tasks/edit", {
      title: `Изменить: ${task.title}`,
      statuses: STATUSES,
      errors,
      values,
      taskId: task.id,
    });
  }
  taskModel.update(task.id, values);
  res.redirect(`/tasks/${task.id}?ok=updated`);
};

// DELETE /tasks/:id (форма с _method=DELETE) — удаление задачи и её файлов
exports.remove = (req, res, next) => {
  const task = taskModel.getById(req.params.id);
  if (!task) return next();

  removeTaskFilesFromDisk(task.id);
  taskModel.remove(task.id); // каскадно удалит записи attachments из БД
  res.redirect("/tasks?ok=deleted");
};

// POST /tasks/:id/attachments — загрузка одного или нескольких файлов
exports.uploadAttachment = (req, res, next) => {
  const task = taskModel.getById(req.params.id);
  if (!task) return next();

  const files = req.files || [];
  for (const file of files) {
    attachmentModel.create({
      task_id: task.id,
      original_name: file.originalname,
      stored_name: file.filename,
      mime_type: file.mimetype,
      size: file.size,
    });
  }
  res.redirect(`/tasks/${task.id}?ok=file_uploaded`);
};

// GET /tasks/:id/attachments/:attachmentId/download — скачивание файла
exports.downloadAttachment = (req, res, next) => {
  const attachment = attachmentModel.getById(req.params.attachmentId);
  if (!attachment || String(attachment.task_id) !== req.params.id)
    return next();

  const filePath = path.join(
    UPLOAD_ROOT,
    req.params.id,
    attachment.stored_name,
  );
  res.download(filePath, attachment.original_name, (err) => {
    if (err) next(err);
  });
};

// DELETE /tasks/:id/attachments/:attachmentId (форма с _method=DELETE)
exports.removeAttachment = (req, res, next) => {
  const attachment = attachmentModel.getById(req.params.attachmentId);
  if (!attachment || String(attachment.task_id) !== req.params.id)
    return next();

  const filePath = path.join(
    UPLOAD_ROOT,
    req.params.id,
    attachment.stored_name,
  );
  fs.rm(filePath, { force: true }, () => {});
  attachmentModel.remove(attachment.id);
  res.redirect(`/tasks/${req.params.id}?ok=file_deleted`);
};
