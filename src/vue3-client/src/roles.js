var roles = undefined;
var user = undefined;
export default {
  getRoles: function () {
    if (roles === undefined) {
      roles = JSON.parse(localStorage.getItem('roles'));
    }
    return roles !== null ? roles : [];
  },
  getUser: function () {
    if (user === undefined) {
      user = JSON.parse(localStorage.getItem('user'));
    }
    return user;
  },
  setRoles: function (val) {
    if (!Array.isArray(val)) {
      throw 'val is not an array of roles';
    }
    roles = val;
    localStorage.setItem('roles', JSON.stringify(roles));
  },
  setUser: function (val) {
    user = val;
    localStorage.setItem('user', JSON.stringify(user));
  },
  haveRole: function (role) {
    if (roles === undefined) {
      roles = JSON.parse(localStorage.getItem('roles'));
    }
    if (roles === null) return false;
    return roles.some(r => r === role);
  },
};
