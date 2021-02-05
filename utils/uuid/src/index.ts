import { parse as parseUUID, stringify as stringifyUUID, v4, validate as validateUUID } from 'uuid';

/**
 * Creates a new uuid v4.
 */
const create = (): string => {
  return v4();
};

/**
 * Checks if the provided string is a valid uuid.
 * 
 * @param uuid the uuid to check
 */
const validate = (uuid: string): boolean => {
  return validateUUID(uuid);
};

/**
 * Parse the uuid to array of bytes
 * 
 * @param uuid the uuid to convert
 * @returns ArrayLike collection of 16 values
 * @throws {TypeError} if the input is not a valid uuid
 */
const parse = (uuid: string): ArrayLike<number> => {
  return parseUUID(uuid);
};

/**
 * Stringify an array of bytes to an uuid
 * 
 * @param uuid the array of bytes
 * @returns the converted uuid
 * @throws {TypeError} if no valid UUID can be generated
 */
const stringify = (uuid: ArrayLike<number>): string => {
  return stringifyUUID(uuid);
};

export default {
  create,
  validate,
  parse,
  stringify
}