var express = require('express');
const router = express.Router();
const db = require('../models/index');  //Sequelizeで利用されてる情報が格納される
const { Op } =  require('sequelize');   //Operatorオブジェクトの使用(条件をつけてDBを利用したいとき
//バリデーション用のモジュール
const {check, validationResult} = require('express-validator'); 

//======ログインページ=====================================================
router.get('/', function(req, res, next) {
  let data = {
    title: 'Login',
    id: '',
    content: ''
  }
  res.render('users/', data);
});

router.post('/', (req, res, next) =>{
  const id =  req.body.employee_id;
  //ログイン処理
    db.Member.findOne({ 
      where:{
        memberNum : id,
        pass: req.body.pass
      }
    }).then(usr => {
      if(usr != null){  //ログイン
        usr.state = 1;  //stateの更新(ログイン状態に)
        req.session.login = usr;
        let back = req.session.back;
        if(back == null){
          back = '../';
        }
        usr.save().then(() => {res.redirect(back);});
      } else {
        let data = {
          title: 'Login',
          content: '社員IDかパスワードが間違っています',
          id: id
        }
        res.render('users/', data)
      }
    })
})

//======新規登録=====================================================
router.get('/add',(req, res, next) => {
  //formの初期値
    form = {
      name: '',
      group_id: '',
      member_id: '',
      pass: '',
      division: '',
    }

    if(req.session.form != null){
      let formData = req.session.form
      form.name = formData.name;
      form.group_id = formData.group_id;
      form.member_id = formData.member_id;
      form.division = formData.division;
    }
    
    let data = {
      title: 'Sign Up',
      err: null,
      form: form
    }
    res.render('users/add', data);
  // })  
})

//確認ボタン押下時
router.post('/add',[
  // バリデーションルールを定義
  check('name', '名前は必ず入力してください').notEmpty().escape(),
  check('member_id', 'メンバーIDは必ず入力してください').notEmpty().escape(),
  check('group_id', 'グループIDを入力してください').notEmpty().escape(),
  check('pass').notEmpty().withMessage('パスワードを入力してください').if(value => value !== '').isLength({ min: 8, max: 16 }).withMessage('パスワードは8文字以上16文字以下で入力してください').escape(),
],(req, res, next)=>{
  // バリデーションエラーを取得
  const errors = validationResult(req);

  // セッション
  const divValue = req.session.div;


  //送信値を取得
  const form = {
    name: req.body.name,
    group_id: req.body.group_id,
    member_id: req.body.member_id,
    pass: req.body.pass,
    division: req.body.division,
  }
  
  if(!errors.isEmpty()) {  //エラー時
    let data = {
      title: 'Sign Up',
      form: form,
      err: errors.array(),
      content: divValue
    }
    res.render('users/add', data);  //会社情報の入力がない時
  } else {  //全ての項目が入力されているとき                          
    req.session.form = form; 
    res.redirect('confirm');
  }
})

//======確認画面=====================================================
router.get('/confirm', (req, res, next) => {
  //送信値を格納
  const form = req.session.form;

  
  db.Group.findOne({
    attributes:['name'],
    where:{id :form.group_id}
  }).then(groupName => {
    form.group_name = groupName.name;
    db.Team.findOne({
      attributes:['name'],
      where:{id: form.division}
    }).then(teamName => {
      form.team_name = teamName.name;
      console.log('確認',form);
      //表示用のform
      let showForm = {
        name: form.name,
        member_id: form.member_id,
        group_name: form.group_name,
        division: form.team_name,
      }

      //表示項目名
      const formName = {
          name: '氏名', 
          member_id: 'メンバーID',
          group_name: 'グループ名', 
          division: 'チーム名'
      }

      let data = {
        title: 'Confirm',
        formVal: showForm,
        formName: formName
      }

      res.render('users/confirm', data);
    })
  })
})

router.post('/confirm', (req, res, next) => {
  //押されたボタンの値
  let btn = req.body.btn;

  if(btn === 'back') {  //確認画面へ
    res.redirect('add');
  } else {              //登録処理 
    //フォームから社員番号を抜き出す
    const form = req.session.form;

    console.log('確認',form);

    insertData = {
      name: form.name,
      memberNum: form.member_id,
      pass: form.pass,
      groupId: form.group_id,
      teamId: form.division,
      state: 1,
      authority: '2',
    }

    db.sequelize.sync()
    .then(() => db.Member.create(insertData)
    .then(usr => {
      req.session.login = usr; //ログイン状態へ
      let url = req.session.back;
      res.redirect('../');
    }))
  }
})

//=====非同期の処理===============================================
router.post('/getTeamName', function(req, res, next) {
  //入力されたグループIDに所属するチーム名を返す
  let groupId = req.body.inputText;

  db.Team.findAll({
    attributes:['id', 'name'],
    where: {groupId: groupId}
  }).then(teams =>{
    res.json(teams);
  })
}) 

module.exports = router;
