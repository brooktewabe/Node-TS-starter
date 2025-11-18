import axios from 'axios';
import httpStatus from 'http-status';
import {ApiError} from './ApiError.ts';
import {config} from '../config/envConfig.ts'; 

const sendMessage = async (phoneNumber: string, content: string): Promise<void> => {
  try {
    const formattedPhone = phoneNumber.startsWith('+251')
      ? phoneNumber.replace('+251', '0')
      : phoneNumber;

    const response = await axios.get('https://api.afromessage.com/api/send', {
      headers: {
        Authorization: `Bearer ${config.sms_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      params: {
        sender: 'sth',
        to: formattedPhone,
        message: content,
      },
    });

    if (response.status !== 200) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send SMS');
    }
  } catch (error: any) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'SMS sending failed');
  }
};

export default sendMessage;
