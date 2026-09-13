const STATUSES = [
  { value: "todo", label: "К выполнению" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Выполнено" },
];

const STATUS_VALUES = STATUSES.map((s) => s.value);

function isValidStatus(value) {
  return STATUS_VALUES.includes(value);
}

function statusLabel(value) {
  const found = STATUSES.find((s) => s.value === value);
  return found ? found.label : value;
}

module.exports = { STATUSES, STATUS_VALUES, isValidStatus, statusLabel };
