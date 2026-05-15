const { data, getResourceId, readBody, send } = require('../_data');

module.exports = async (req, res) => {
  const id = getResourceId(req);
  const index = data.timeEntries.findIndex((entry) => entry.id === id);

  if (index === -1) {
    return send(res, 404, { message: 'Time entry not found' });
  }

  if (req.method === 'PUT') {
    const entry = await readBody(req);

    data.timeEntries[index] = entry;
    return send(res, 200, entry);
  }

  if (req.method === 'DELETE') {
    data.timeEntries.splice(index, 1);
    return send(res, 200, {});
  }

  return send(res, 405, { message: 'Method not allowed' });
};
