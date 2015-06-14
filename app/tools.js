module.exports = {
	strDateCompare: function(strDate1, strDate2) {
		var date1 = new Date(strDate1);
		var date2 = new Date(strDate2);
		return date1 > date2 ? -1 : date1 < date2 ? 1 : 0;
	}
};
