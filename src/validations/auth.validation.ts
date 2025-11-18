import joi from "joi";
import validator from "validator";

const passwordValidation = (value: string, helpers: joi.CustomHelpers) => {
  if (!validator.isStrongPassword(value)) {
    return helpers.message({
      custom:'Password should contain atleast 8 characters containing one uppercase and lowercase letter, number and special character',
    });
  }
  return value;
};
export const loginSchema = {
  body: joi.object().keys({
    phoneNumber: joi.string().required(),
    password: joi.string().optional(),
  }),
};
export const forgotPassword = {
  body: joi.object().keys({
    phoneNumber: joi.string().required()
  }),
};
export const changePassword = {
  body: joi.object().keys({
    currentPassword: joi.string().required(),
    newPassword: joi.string().custom(passwordValidation).required(),
  }),
};
export const resetSchema = {
  body: joi.object().keys({
    resetToken: joi.string().required(),
    phoneNumber: joi.string().required(),
    newPassword: joi.string().custom(passwordValidation).required(),
  }),
};
