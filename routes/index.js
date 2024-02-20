const express = require('express');
const router = express.Router();
const db = require('../models/index');
const { Op } =  require('sequelize'); 
const server = require('http').Server(express()); //ソケット通信用のサーバーを立てるための準備
const io = require('socket.io')(server);    //どのサーバーで通信を行うかをsocket.ioに伝える
//ランダムなidを発行する関数
const {v4: uuidV4} = require('uuid');  //{v4: uuidV4} v4関数をuuidV4にリネーム
const { log } = require('console');

// ログインチェックの関数
function check(req, res) {

  if(req.session.login == null) {
      req.session.back = '../';
      res.redirect('/users');
      return true;
  } else { 
      return false;
  }
}

//============================================================
router.get('/', function(req, res, next) {
  if(check(req, res)) { return };
  
  //ログイン中のユーザー情報を取得する
  let usr_info = req.session.login;
  
  //DBから自分のグループメンバーの情報を取得する
  db.Member.findAll({
    where: {
      groupId: {[Op.eq]: usr_info.groupId}
    }
  }).then(usrs => {
    let data = {
      title: 'ホーム画面',
      users: usrs
    } 
    res.render('index', data);
  });
  
});

router.post('/', (req, res, next) => {
  const sendBtn = req.body.btn;
  
  //通話ボタンがおさされれば
  if(sendBtn == 'fhone'){
    res.redirect('chat');
  }
});

module.exports = router;
