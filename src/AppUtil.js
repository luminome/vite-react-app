const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const keyGen = () => (Math.random() + 1).toString(36).substring(2);
const date_filter = (ti) => (typeof ti === 'string' || ti instanceof String) ? new Date(Date.parse(ti)) : ti;

const date_time = (ti) => {
  const t = date_filter(ti);
  return t.getUTCHours() + ":" + t.getUTCMinutes() + ":" + t.getUTCSeconds().toString().padStart(2,'0');
};

const date_day_time = (ti) => {
  const t = date_filter(ti);
  return weekday[t.getUTCDay()] + " " + t.getUTCHours() + ":" + t.getUTCMinutes() + ":" + t.getUTCSeconds().toString().padStart(2,'0');
};

const date_timestamp = (ti) => date_filter(ti).getTime();

export {keyGen, date_time, date_day_time, date_timestamp};