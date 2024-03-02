const express = require('express');
const router = express.Router();
const db = require('../models/index');
const { Op } =  require('sequelize'); 
const server = require('http').Server(express()); //ソケット通信用のサーバーを立てるための準備
const io = require('socket.io')(server);    //どのサーバーで通信を行うかをsocket.ioに伝える
//ランダムなidを発行する関数
const {v4: uuidV4} = require('uuid');  //{v4: uuidV4} v4関数をuuidV4にリネーム
const { log } = require('console');
const { userInfo } = require('os');

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
      groupId: {[Op.eq]: usr_info.groupId},
      memberNum: {[Op.ne]: usr_info.memberNum}
    },
    include: [{ //テーブルの結合
      model: db.Group,     // Groupモデルを含める
      attributes: ['name'], // Groupモデルから取得する属性を指定
    },
      { 
        model: db.Team,     // Groupモデルを含める
        attributes: ['name'] // Groupモデルから取得する属性を指定
    }],
    order: [['teamId', 'ASC']]
  }).then(usrs => {
    let group = usrs[0].Group.name;
    db.Team.findAll({
      where: {
        groupId: {[Op.eq]: usr_info.groupId}
      }
    }).then(teams => {
      if(req.session.memberId){
        //DBからtitleを取得
        db.title.findAll({
          where: {
            [Op.or]:[
                {
                  user1: { [Op.eq]: usr_info.memberNum },
                  user2: { [Op.eq]: req.session.memberId }
                },
                {
                  user1: { [Op.eq]: req.session.memberId },
                  user2: { [Op.eq]: usr_info.memberNum }
                }
            ]
          }
        }).then(title =>{
          let titleAry = [];
          for(let i in title){
            let titleObj = {};
            titleObj.id = title[i].id;
            titleObj.name = title[i].name;
            let dateObj = new Date(title[i].createdAt);
            var formattedDate = dateObj.toISOString().slice(0,10).replace(/-/g,"/");
            titleObj.time = formattedDate;
            titleAry.push(titleObj); 
          }
          let data = {
            title: 'ホーム画面',
            users: usrs,  //メンバー情報
            group: group, //グループ名
            teams: teams,  //チーム名
            msgTitle: titleAry, //タイトル
            user: usr_info, //ログインしているユーザー情報
          } 
          res.render('index', data);
        }).catch(error => {
          console.error('通信エラー:', error);
        });
      } else {
        let data = {
          title: 'ホーム画面',
          users: usrs,  //メンバー情報
          group: group, //グループ名
          teams: teams,  //チーム名
          msgTitle:null,
          user: usr_info, //ログインしているユーザー情報
        } 
        res.render('index', data);
      }
    })
  })
});

router.post('/', (req, res, next) => {
  //押されたボタンを格納
  const sendBtn = req.body.btn;
  //ログイン中のユーザー情報を取得する
  const usr_info = req.session.login;
  
  //トークしているmemberIdの取得
  const memberId = req.body.memberId;
  req.session.memberId = memberId;  //セッションにmemberIdを追加

  if(sendBtn == 'subject') {
    db.title.create({
        name:req.body.subject,
        user1: usr_info.memberNum,
        user2: memberId
    }).then(title => {
      res.redirect('/');
    })
  }else if(sendBtn == 'chat'){
    res.redirect('chat');
  }
});

/*==========以下非同期通信用======================================================*/

/* 非同期でセッションの値を取得する用 */
router.get('/session-user-data', function(req, res, next) {
  // セッションから値を取得する
  const sessionData = req.session.login; 
  // セッション情報を JSON 形式で返す
  res.json(sessionData);
});

router.post('/session-insert-memberId', function(req, res, next) {
  //セッションにクリックされたmemberIdを登録
  req.session.memberId = req.body.memberId;
  res.status(200).send('セッションに memberId を登録しました');
});

router.post('/get-user-and-member', function(req, res, next) {
  console.log(req.session.memberId);
  // ユーザーID
  const userId = req.session.login.memberNum;
  const memberId = req.session.memberId;
  // セッション情報を JSON 形式で返す
  res.json({ userId: userId, memberId: memberId });
});

//トークタイトルを非同期で取得するため処理
router.post('/data', (req, res) => {
  const userId = req.body.userId;
  const memberId = req.body.memberId;
  //DBからtitleを取得
  db.title.findAll({
    where: {
      [Op.or]: [
        {
          user1: { [Op.eq]: userId },
          user2: { [Op.eq]: memberId }
        },
        {
          user1: { [Op.eq]: memberId },
          user2: { [Op.eq]: userId }
        }
      ]
    }
  }).then(title =>{
    let titleAry = [];
    for(let i in title){
      let titleObj = {};
      titleObj.id = title[i].id;
      titleObj.name = title[i].name;
      let dateObj = new Date(title[i].createdAt);
      var formattedDate = dateObj.toISOString().slice(0,10).replace(/-/g,"/");
      titleObj.time = formattedDate;
      titleAry.push(titleObj); 
    }
    res.json(titleAry);
  }).catch(error => {
    console.error('通信エラー:', error);
  });
})

//トーク情報を返す非同期通信
router.post('/talk_data', (req, res, next) => {
    const userId = req.body.userId;
    const memberId = req.body.memberId;
    const titleId = req.body.titleId;

    db.Message.findAll({
      where : {
        [Op.or]: [
          {
            user1: { [Op.eq]: userId },
            user2: { [Op.eq]: memberId }
          },
          {
            user1: { [Op.eq]: memberId },
            user2: { [Op.eq]: userId }
          }
        ],
        titleId : {[Op.eq]: titleId},
      }
    }).then(data=> {
      
        talkAry = [];
        for(let i in data){
          let msgData = [];
          msgData.push(data[i].user1)
          msgData.push(data[i].msg);
          talkAry.push(msgData);
        }
        res.json(talkAry); 
    })
})

module.exports = router;
