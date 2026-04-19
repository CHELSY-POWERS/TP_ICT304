
function authenticate(req, res, next) {
  // On simule un utilisateur par défaut pour que les routes fonctionnent
  req.user = {
    id: 'default-user-id',
    email: 'default@test.com',
    role: 'admin'
  };
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    next();
  };
}

module.exports = { authenticate, authorize };