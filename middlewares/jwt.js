const koaJwt = require('koa-jwt');

module.exports = koaJwt({
  secret: process.env.JWT_SECRET
});


// const jwt = require('jsonwebtoken');
// // const User = require('../mongodb/models/User');

// const { JWT_SECRET } = process.env;

// module.exports.authenticate = (req, res, next) => {
//   const authorisationHeader = req.headers.authorization;
//   let token;

//   if (authorisationHeader) {
//     token = authorisationHeader.split(' ')[1];
//   }

//   if (token) {
//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//       if (err) {
//         res.status(401).json({ error: 'Failed to authenticate.' });
//       } else {
//         User.findOne({ _id: decoded.id }, (findUserErr, user) => {
//           if (findUserErr) {
//             res.status(404).json({ error: `Error finding user ${findUserErr}` });
//           }
//           if (!user) {
//             res.status(404).json({ error: 'No such user' });
//           }
//           req.currentUser = {
//             id: user._id, // eslint-disable-line no-underscore-dangle
//             username: user.username,
//             email: user.email,
//             isAdmin: user.isAdmin,
//             profilesToDisplay: user.profilesToDisplay
//           };
//           next();
//         });
//       }
//     });
//   } else {
//     res.status(403).json({
//       error: 'No token provided.'
//     });
//   }
// };
