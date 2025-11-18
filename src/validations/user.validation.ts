import Joi from "joi";
import validator from "validator";

const passwordValidation = (value: string, helpers: Joi.CustomHelpers) => {
  if (!validator.isStrongPassword(value)) {
    return helpers.message({
      custom:'Password should contain atleast 8 characters containing one uppercase and lowercase letter, number and special character',
    });
  }
  return value;
};

export const createUserSchema = {
  body: Joi.object().keys({
      fullName: Joi.string().required(),
      phoneNumber: Joi.string().required(),
      role: Joi.string().required(),
      password: Joi.string().required().custom(passwordValidation),
    }),
};