import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError.ts';
import { logger } from '../config/logger.ts';

interface Schema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationObject = Object.keys(schema).reduce<Record<string, any>>((obj, key) => {
      if (Object.prototype.hasOwnProperty.call(req, key)) {
        obj[key] = (req as any)[key];
      }
      return obj;
    }, {});

    logger.info(validationObject);

    const { error } = Joi.compile(schema).validate(validationObject, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(', ');
      return next(new ApiError(400, errors));
    }

    return next();
  };
};
