const { applyQuery, data, readBody, send } = require('./_data');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return send(res, 200, applyQuery(data.projects, req.query));
  }

  if (req.method === 'POST') {
    const project = await readBody(req);

    data.projects.push(project);
    return send(res, 201, project);
  }

  return send(res, 405, { message: 'Method not allowed' });
};
