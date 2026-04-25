const { applyQuery, data, readBody, send } = require('./_data');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const entries = applyQuery(data.timeEntries, req.query);

    return send(
      res,
      200,
      req.query._sort === '-date' ? entries.sort((a, b) => b.date.localeCompare(a.date)) : entries,
    );
  }

  if (req.method === 'POST') {
    const entry = await readBody(req);

    data.timeEntries.unshift(entry);
    return send(res, 201, entry);
  }

  return send(res, 405, { message: 'Method not allowed' });
};
