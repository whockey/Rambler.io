
/*
 * GET home page.
 */

exports.index = function(req, res){
  // Check for TC link
  if(req.url && req.url === '/main/y7LNJAMmBobL26LdimdAUiVCuZo=s9o0hFyce406e7e%E2%80%A62649b7933d26c65c5a4ac2850d3c320b60d3e3d7b28ffb7b141890bf87c9f99b3c94918478') {
  	return res.redirect('/');
  }
  res.render('index');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};