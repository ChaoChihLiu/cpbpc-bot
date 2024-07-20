import moment from 'moment';

const today = moment().format('DD');
console.log(today);

const month = moment().format('MMMM');
console.log(month);


const now = moment();
const currentHour = now.hours();

if (currentHour >= 6 && currentHour < 12) {

    console.log("morning");
} else if (currentHour >= 12 && currentHour < 18) {

    console.log("afternoon");
} else if (currentHour >= 18 && currentHour < 21) {
    console.log("evening");
} else {
    console.log("night");
}

