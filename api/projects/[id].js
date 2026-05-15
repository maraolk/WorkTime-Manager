const { data, getResourceId, readBody, send } = require('../_data');

module.exports = async (req, res) => {
  const id = getResourceId(req);
  const index = data.projects.findIndex((project) => project.id === id);

  if (index === -1) {
    return send(res, 404, { message: 'Project not found' });
  }

  if (req.method === 'PUT') {
    const project = await readBody(req);

    data.projects[index] = project;
    return send(res, 200, project);
  }

  if (req.method === 'DELETE') {
    data.projects.splice(index, 1);
    return send(res, 200, {});
  }

  return send(res, 405, { message: 'Method not allowed' });
};
