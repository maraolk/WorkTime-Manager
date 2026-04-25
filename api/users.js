const { applyQuery, data, send } = require('./_data');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return send(res, 405, { message: 'Method not allowed' });
  }

  return send(res, 200, applyQuery(data.users, req.query));
};
