const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { UserInputError, AuthenticationError } = require("apollo-server");
const { JWT_SECRET } = require("../../config/env.json");
const jwt = require("jsonwebtoken");
const { User, Message } = require("../../models");
module.exports = {
  Query: {
    getUser: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Unauthenticated");
        
      let users = await User.findAll({
          attribute: ['username','imageUrl','createdAt'],
          where: { username: { [Op.ne]: user.username } },
        });
        
        const allUserMessages = await Message.findAll({
          where:{
            [Op.or]:[{from:user.username},{to:user.username}]
          },
          order:[['createdAt','DESC']]
        })
      
        users = users.map(otherUser => {
          const latestMessage = allUserMessages.find(
            m => m.from === otherUser.username || m.to === otherUser.username
          );
         
          otherUser.latestMessage = latestMessage;
          return otherUser;
        
        });

        return users;
      } catch (error) {
        console.log(error);
      }
    },

    login: async (_, args) => {
      const { password, username } = args;
      let errors = {};
      try {
        if (username.trim() === "")
          errors.username = "username must not be empty";
        if (password === "") errors.password = "password must be empty";
        if (Object.keys(errors).length > 0) {
          throw new UserInputError("bad input", { errors });
        }
        const user = await User.findOne({ where: { username } });

        if (!user) {
          errors.username = "user not found";
          throw new UserInputError("user not found", { errors });
        }

        const correctPassword = await bcrypt.compare(password, user.password);
        if (!correctPassword) {
          errors.password = "incorrect password";
          throw new AuthenticationError("password is incorrect", { errors });
        }

        const token = jwt.sign(
          {
            username,
          },
          JWT_SECRET,
          { expiresIn: 60 * 60 }
        );

        return {
          ...user.toJSON(),
          createdAt: user.createdAt.toISOString(),
          token,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },

  Mutation: {
    register: async (_, args) => {
      let { username, email, password, confirmPassword } = args;
      let errors = {};

      try {
        // Todo validate the data input
        if (email.trim() === "") errors.email = "email must not be empty";
        if (username.trim() === "")
          errors.username = "username must not be empty";
        if (password.trim() === "")
          errors.password = "password must not be empty";
        if (confirmPassword.trim() === "")
          errors.confirmPassword = "confirm Password must not be empty";

        // match passwords
        if (password !== confirmPassword)
          errors.password = "password must match";

        //const usernameBy = await Users.findOne({ where: { username } });
        //const emailBy = await Users.findOne({ where: { email } });
        // check to see if the user exist
        //if (usernameBy) errors.username = "username taken";
        //if (emailBy) errors.email = "email taken";

        if (Object.keys(errors).length > 0) {
          throw errors;
        }
        // hash the password
        password = await bcrypt.hash(password, 8);

        // create user

        const user = await User.create({
          username,
          password,
          email,
        });

        //return the user
        return user;
      } catch (err) {
        console.log(err);
        if (err.name === "SequelizeUniqueConstraintError") {
          err.errors.forEach(
            (e) => (errors[e.path] = `${e.path} is already taken`)
          );
        } else if (err.name === "SequelizeValidationError") {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError("Bad input", { errors });
      }
    },
  },
};
