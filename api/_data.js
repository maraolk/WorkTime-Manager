const data = {
  users: [
    {
      id: 'u1',
      name: 'Arina Petrova',
      email: 'arina@example.com',
      password: 'password',
      role: 'freelancer',
      dailyGoalHours: 6,
    },
    {
      id: 'u2',
      name: 'Ivan Lead',
      email: 'ivan@example.com',
      password: 'password',
      role: 'manager',
      dailyGoalHours: 8,
    },
  ],
  projects: [
    {
      id: 'p1',
      userId: 'u1',
      name: 'Client Portal',
      client: 'Northwind',
      plannedHours: 42,
      color: '#0f8b8d',
    },
    {
      id: 'p2',
      userId: 'u1',
      name: 'Design System',
      client: 'Contoso',
      plannedHours: 28,
      color: '#8a5cf6',
    },
    {
      id: 'p3',
      userId: 'u2',
      name: 'Team Platform',
      client: 'Internal',
      plannedHours: 80,
      color: '#d66b00',
    },
  ],
  tasks: [
    {
      id: 't1',
      projectId: 'p1',
      title: 'Auth flow',
      plannedHours: 10,
      status: 'active',
    },
    {
      id: 't2',
      projectId: 'p1',
      title: 'Reports page',
      plannedHours: 12,
      status: 'todo',
    },
    {
      id: 't3',
      projectId: 'p2',
      title: 'Taiga UI layout',
      plannedHours: 8,
      status: 'active',
    },
    {
      id: 't4',
      projectId: 'p3',
      title: 'Sprint review',
      plannedHours: 6,
      status: 'todo',
    },
  ],
  timeEntries: [
    {
      id: 'e1',
      userId: 'u1',
      projectId: 'p1',
      taskId: 't1',
      date: '2026-04-24',
      minutes: 135,
      description: 'Implemented login state and route guard',
      billable: true,
      createdAt: '2026-04-24T09:00:00.000Z',
      updatedAt: '2026-04-24T11:15:00.000Z',
    },
    {
      id: 'e2',
      userId: 'u1',
      projectId: 'p2',
      taskId: 't3',
      date: '2026-04-25',
      minutes: 90,
      description: 'Prepared dashboard layout and responsive states',
      billable: true,
      createdAt: '2026-04-25T07:00:00.000Z',
      updatedAt: '2026-04-25T08:30:00.000Z',
    },
    {
      id: 'e3',
      userId: 'u2',
      projectId: 'p3',
      taskId: 't4',
      date: '2026-04-25',
      minutes: 60,
      description: 'Reviewed team time plan',
      billable: false,
      createdAt: '2026-04-25T10:00:00.000Z',
      updatedAt: '2026-04-25T11:00:00.000Z',
    },
  ],
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function applyQuery(items, query) {
  return items.filter((item) =>
    Object.entries(query).every(([key, value]) => {
      if (!value || key.startsWith('_')) {
        return true;
      }

      return String(item[key]) === String(value);
    }),
  );
}

function getResourceId(req) {
  const rawId = req.query?.id;

  if (Array.isArray(rawId)) {
    return rawId.at(0);
  }

  if (rawId) {
    return rawId;
  }

  return req.url.split('?').at(0).split('/').filter(Boolean).at(-1);
}

module.exports = {
  applyQuery,
  data,
  getResourceId,
  readBody,
  send,
};
