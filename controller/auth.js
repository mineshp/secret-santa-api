const jwt = require('jsonwebtoken');
const { validateUser } = require('../db/auth');

const TableName = process.env.SECRET_SANTA_TABLE;

const login = async (ctx) => {
  const data = ctx.request.body;
  const user = await validateUser({ TableName, ...data });
  if (user && user.memberName) {
    const { memberName, groupID, email } = user;
    const res = JSON.stringify({
      token: jwt.sign({
        memberName,
        groupID,
        email
      }, process.env.JWT_SECRET),
      message: 'Successfully logged in!'
    });
    ctx.status = 200;
    ctx.body = JSON.stringify(res);
  } else {
    ctx.status = 401;
    ctx.body = JSON.stringify({ message: `Authentication failed - ${user.error}` });
  }
  return ctx;
};

module.exports = { login };
