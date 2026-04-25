const { data, readBody, send } = require('../_data');

module.exports = async (req, res) => {
  const { id } = req.query;
  const index = data.tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return send(res, 404, { message: 'Task not found' });
  }

  if (req.method === 'PUT') {
    const task = await readBody(req);

    data.tasks[index] = task;
    return send(res, 200, task);
  }

  if (req.method === 'DELETE') {
    data.tasks.splice(index, 1);
    return send(res, 200, {});
  }

  return send(res, 405, { message: 'Method not allowed' });
};
