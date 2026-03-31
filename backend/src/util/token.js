import jwt from 'jsonwebtoken';
import config from '../config.js';

const generateToken = (id) => jwt.sign({ id }, config.JWT_SECRET, {
  expiresIn: config.JWT_EXPIRES_IN || '1d'
});

export default generateToken;