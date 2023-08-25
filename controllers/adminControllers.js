import User from "../models/user/userModel.js";

const getAllUsers = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      msg: "All users displayed",
      data: await User.find(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      msg: error.message,
    });
  }
};

export { getAllUsers };
