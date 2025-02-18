import moment from 'moment';
const dateconvert = date => {
  const isoDate = date;
  const formattedDate = moment(isoDate).format('DD/MM/YYYY');
  return formattedDate;
};

export default dateconvert;
