const { applyQuery, data, readBody, send } = require('./_data');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return send(res, 200, applyQuery(data.tasks, req.query));
  }

  if (req.method === 'POST') {
    const task = await readBody(req);

    data.tasks.push(task);
    return send(res, 201, task);
  }

  return send(res, 405, { message: 'Method not allowed' });
};
