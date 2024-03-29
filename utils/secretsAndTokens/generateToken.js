import Jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const generateToken = (id,isAdmin) => {
  return Jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "5h",
  });
};

export default generateToken;
