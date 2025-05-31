import moment from 'moment';
const dateconvert = date => {
  const isoDate = date;
  const formattedDate = moment(isoDate).format('DD/MM/YYYY');
  return formattedDate;
};

export const currentdate = () => {
  const currentDate = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  return currentDate;
};

export default dateconvert;
