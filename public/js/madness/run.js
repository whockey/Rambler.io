var tran_dates = {};
function transToDates(transactions){
	var current, next, ident, month;
	for (var i = 0; i < transactions.length-1; i++) {
		current = new Date(transactions[i].date)
		current = new Date(transactions[i+1].date)
		month = (current.getMonth()+1);
		if(month<10)
			month = '0'+month
		ident = current.getFullYear() +'.'+ month;
		if(!tran_dates[ident] || !tran_dates[ident].trans){
			tran_dates[ident] = {date: ident, trans : [transactions[i]]};
		}
		else{
			tran_dates[ident].trans.push(transactions[i])
		}
	};
	return tran_dates;
}
