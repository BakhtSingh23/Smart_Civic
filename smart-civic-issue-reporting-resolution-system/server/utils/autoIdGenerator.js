const mongoose = require('mongoose');

function padDigits(number, length = 4) {
  return String(number).padStart(length, '0');
}

async function generateUniqueId(prefix, modelName, fieldName) {
  const year = new Date().getFullYear();
  let candidate;
  let exists = true;

  while (exists) {
    const randomNum = padDigits(Math.floor(Math.random() * 10000), 4);
    candidate = `${prefix}-${year}-${randomNum}`;
    const Model = mongoose.models[modelName] || mongoose.model(modelName);
    exists = await Model.exists({ [fieldName]: candidate });
  }

  return candidate;
}

async function generateComplaintId() {
  return generateUniqueId('CMP', 'Complaint', 'complaintId');
}

async function generateIncidentId() {
  return generateUniqueId('INC', 'IncidentGroup', 'incidentId');
}

async function generateTaskId() {
  return generateUniqueId('TSK', 'WorkerTask', 'taskId');
}

module.exports = { generateComplaintId, generateIncidentId, generateTaskId };
