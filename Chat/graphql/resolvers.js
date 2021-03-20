const { Users } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env.json");
const { Op } = require("sequelize");
const { UserInputError, AuthenticationError } = require("apollo-server");
module.exports = {
  Query: {
    getUser: async (_, __, context) => {
      try {
        let user;
        if (context.req && context.req.headers.authorization) {
          const token = context.req.headers.authorization.split("Bearer ")[1];
          jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
            if (err) {
              throw new AuthenticationError("unathuntenicated");
            }
            user = decodedToken;
          });
        }
        const users = await Users.findAll();
        return users;
      } catch (error) {
        console.log(error);
      }
    },

    login: async (_, args) => {
      let errors = {};
      const { password, username } = args;
      try {
        if (username.trim() === "")
          errors.username = "username must not be empty";
        if (password === "") errors.password = "password must be empty";
        if (Object.keys(errors).length > 0) {
          throw new UserInputError("bad input", { errors });
        }
        const user = await Users.findOne({ where: { username } });
        if (!user) {
          user.errors = "user not found";
          throw new UserInputError("user not found", { errors });
        }

        const correctPasswod = await bcrypt.compare(password, user.password);
        if (!correctPasswod) {
          correctPasswod.errors = "inccorrect password";
          throw new AuthenticationError("password is incorrect", { errors });
        }

        const token = jwt.sign(
          {
            username,
          },
          "JWT_SECRET",
          { expiresIn: 60 * 60 }
        );

        user.token = token;

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
        if (email.trim() === "") email.errors = "email must not be empty";
        if (username.trim() === "")
          username.errors = "username must not be empty";
        if (password.trim() === "")
          password.errors = "password must not be empty";
        if (confirmPassword.trim() === "")
          confirmPassword.errors = "confirm Password must not be empty";

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

        const user = Users.create({
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
            (e) => (errors[e.path] = `${path}is alreadyy taken`)
          );
        } else if (err.name === "SequelizeValidationError") {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError("wrong input", { errors });
      }
    },
  },
};
