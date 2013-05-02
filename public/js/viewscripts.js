$(function test(){
	var n = 0;
	$('.number').append(n);	
	$('.flipper').click(function(){
		n ++;
		console.log(n);
		$('.number').css({'transition':'0.2s','-webkit-transform':'rotateX(' + 360*n + 'deg)'})
		$('.number').delay(2000).empty().append(n);
	});
});