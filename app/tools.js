module.exports = {
    strDateCompare: (strDate1, strDate2) => {
        const date1 = new Date(strDate1);
        const date2 = new Date(strDate2);
        if (date1 > date2) {
            return -1;
        }
        if (date1 < date2) {
            return 1;
        }
        return 0;
    },
};
