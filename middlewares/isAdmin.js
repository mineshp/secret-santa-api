
const isAdmin = async (ctx, next) => {
  const user = await ctx.state.user;

  if (user.admin) {
    return next();
  }
  // Required as the status does not get set to 401 without it.
  // Defaults to 404 otherwise.
  ctx.status = 401;
  return ctx.throw(401, 'Unauthorised access, user is required to be an admin');
};

module.exports = (isAdmin);
