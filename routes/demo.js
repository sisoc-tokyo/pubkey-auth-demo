var model = require('../model');
var PostBbs = model.PostBbs;
var PostPubkagi = model.PostPubkagi;

var express = require('express');
var router = express.Router();

var SHA256 = require("crypto-js/sha256");
var base64 = require('js-base64').Base64;
var kjur = require('jsrsasign');

router.get('/bbs/delete/:id', function(req, res){
  var id = req.params.id;
  PostBbs.findByIdAndRemove(id, function(err, result){
	if(err){
		res.send({'error': 'An error has occurred - ' + err});
	}else{
		console.log('Success: ' + result + ' document(s) deleted');
	}
  });
  res.redirect('/bbs');
});

router.post('/bbs/create', function(req, res){
  if(req.body.id == "0"){
	var newPost = new PostBbs(req.body);
	newPost.name = req.session.user
	newPost.save(function(err){
		if(err){
			console.log(err);
			res.redirect('back');
		}
	});
  }else{
	PostBbs.findByIdAndUpdate(req.body.id, req.body, function(err, result){
		if(err){
			res.send({'error': 'An error has occurred - ' + err});
		}else{
			console.log('Success: ' + result + ' document(s) updated');
		}
	});
  }
  res.redirect('/bbs');
});

router.get('/bbs/form/:id', function(req, res){
  if (req.params.id != "0"){
	var id = req.params.id;
	PostBbs.findById(id, function(err, item){
		var mes = item.text.toString();
		console.log(mes);
		res.render('bbs_form', { title: 'New Entry', mes:mes , id:id});
	});
  }else{
	res.render('bbs_form', { title: 'New Entry', mes: '', id:req.params.id});
  };
});

router.get('/bbs/logout', function(req, res) {
  delete req.session.user;
  res.redirect('/');
});

router.get('/bbs', function(req, res){
  if(req.session.user == null){
	res.redirect('/');
  }
  PostBbs.find({}, function(err, items){
      items.reverse();
      res.render('bbs_top', { title: 'Entry List', items: items, name: req.session.user });
    });
});

router.get('/', function(req, res, next) {
  res.render('top', {
	title: 'Publickey Authentication Demo'
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', {
	title: 'Publickey Authentication Demo - Login'
  });
});

router.get('/demo', function(req, res, next) {
  res.render('demo', {
	title: 'ECDSA Authentication Demo'
  });
});

router.post('/signin', function(req, res){
	res.contentType('application/json');

	console.log(JSON.stringify(req.body));

	var name = req.body.name;
	var token = req.body.token;
	var sigHex = req.body.sighex;
	var alg = req.body.alg;

	PostPubkagi.find({name: name}, function(e,r){
		var data = {err: false};
		if(r.length > 0){
			var msg = token + r[0].pass;
			var pubkey = base64.decode(r[0].pubkey);
			sig = new kjur.Signature({"alg": alg});
			sig.init(kjur.KEYUTIL.getKey(pubkey));
			sig.updateString(msg);
			var result = sig.verify(sigHex);

			console.log([msg,pubkey,result]);

			data = {result: result};

			if(result){
				req.session.user = req.body.name;
				data.next = '/bbs';
			}
		}else{
			data = {err: e};
		};

		var dataJSON = JSON.stringify(data);
		res.send(dataJSON);
	});
});

router.post('/signup', function(req, res){
	res.contentType('application/json');

	console.log(JSON.stringify(req.body));

	var name = req.body.name;
	var pass = req.body.pass;
	var pubkey = req.body.pubkey;

	PostPubkagi.find({name: name}, function(e,r){
		if(r.length == 0){
			var _pass = pass_hash(name,pass);
			var newPostPubkagi = new PostPubkagi({name: name, pass: _pass, pubkey: pubkey});
			newPostPubkagi.save(function(e) {
				var data = {err: false};
				if(e) {
					console.log(e);
					data = e;
				};

				var dataJSON = JSON.stringify(data);
				res.send(dataJSON);
			});
		}else{
			var data = {err: {message: 'name is already exists'}};
			var dataJSON = JSON.stringify(data);
			res.send(dataJSON);
		};
	});
});

function pass_hash(name,pass){
        var fixsalt = '5415231cd6ab37041ab9faacf828ee6ce31c9dcf981556687978496a753c6a57';
	var salt = name + fixsalt;
	var hash = '';
        for(i = 0;i < 10; i = i + 1){
                hash = SHA256(hash + pass + salt).toString();
	}
	return hash;
}

module.exports = router;
