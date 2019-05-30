export const MAT_MOMENT_DATE_FORMATS = {
  parse: {
    date: ['YYYY-MM-DD', 'YYYY/MM/DD', 'll'],
    datetime: ['YYYY-MM-DD hh:mm a', 'YYYY/MM/DD hh:mm a', 'll h:mma'],
    time: [ 'h:mm a', 'hh:mm a']
  },
  display: {
    date: 'll',
    datetime: 'll hh:mm a',
    time: 'h:mm a',
    dateA11yLabel: 'LL',
    monthDayLabel: 'MMM D',
    monthDayA11yLabel: 'MMMM D',
    monthYearLabel: 'MMMM YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
    timeLabel: 'hh:mm a'
  }
};
