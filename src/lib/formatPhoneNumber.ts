export const validateAndFormatPhoneNumber = (phoneNumber: string): string => {
  const phone = String(phoneNumber).trim();

  const PhoneRegex = /^(\+251|0|251)?(9|7)\d{8}$/;
  if (!PhoneRegex.test(phone)) {
    throw new Error("Invalid phone number format");
  }

  if (phone.startsWith("0")) {
    return `+251${phone.substring(1)}`;
  } else if (phone.startsWith("9") || phone.startsWith("7")) {
    return `+251${phone}`;
  } else if (phone.startsWith("+")) {
    return phone;
  } else if (phone.startsWith("251")) {
    return `+${phone}`;
  } else {
    throw new Error("Invalid phone number format");
  }
};