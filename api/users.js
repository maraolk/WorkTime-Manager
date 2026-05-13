const { applyQuery, data, readBody, send } = require('./_data');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return send(res, 200, applyQuery(data.users, req.query));
  }

  if (req.method === 'POST') {
    const user = await readBody(req);
    const existing = data.users.some((item) => item.email === user.email);

    if (existing) {
      return send(res, 409, { message: 'User with this email already exists' });
    }

    data.users.push(user);
    return send(res, 201, user);
  }

  return send(res, 405, { message: 'Method not allowed' });
};
