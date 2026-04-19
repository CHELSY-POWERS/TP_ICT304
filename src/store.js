const store = {
  users: [
    {
      id: 'default-user-id',
      firstName: 'Default',
      lastName: 'User',
      email: 'default@test.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  accounts: [],
  transactions: []
};

module.exports = store;