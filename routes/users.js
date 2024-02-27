var express = require('express');
var router = express.Router();
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

  db.Team.findAll()
  .then(div => {
    
    let div_ary = [];
    for(let i in div){
      let div_data = {};
      div_data.id = div[i].dataValues.id;
      div_data.name = div[i].dataValues.name;
      div_ary.push(div_data);
    }
    
    req.session.div = div_ary;
    //formの初期値
    form = {
      name: '',
      company_id: '',
      employee_id: '',
      pass: '',
      division: '',
    }
    if(req.session.form != null){
      let formData = req.session.form
      form.name = formData.name;
      form.company_id = formData.company_id;
      form.employee_id = formData.employee_id;
      form.division = formData.division;
    }
    
    let data = {
      title: 'Sign Up',
      content: div_ary,
      err: null,
      form: form
    }
    res.render('users/add', data);
  })  
})

//確認ボタン押下時
router.post('/add',[
  // バリデーションルールを定義
  check('name', '名前は必ず入力してください').notEmpty().escape(),
  // check('company_id', '企業IDは必ず入力してください').notEmpty().escape(),
  check('employee_id', '社員IDは必ず入力してください').notEmpty().escape(),
  check('pass').notEmpty().withMessage('パスワードを入力してください').if(value => value !== '').isLength({ min: 8, max: 16 }).withMessage('パスワードは8文字以上16文字以下で入力してください').escape(),
  // check('division', '部署を選択してください').custom(value =>{
  //   return value != 999;
  // }),
],(req, res, next)=>{
  // バリデーションエラーを取得
  const errors = validationResult(req);

  // セッション
  const divValue = req.session.div;

  //送信値を取得
  const form = {
    name: req.body.name,
    company_id: req.body.company_id,
    employee_id: req.body.employee_id,
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
  } else if(form.division == 999 && form.company_id == '') { 
    req.session.form = form; 
    res.redirect('company_add');
  } else {  //全ての項目が入力されているとき                          
    req.session.form = form; 
    res.redirect('confirm');
  }
})
//======会社登録画面=====================================================
router.get('/company_add', (req, res,next)=>{

  let sendData = {
    company_name: '',
    team : '',
  }

  let data = {
    title: '会社登録',
    company_name: '',
    sendData: sendData
  }
  res.render('users/company_add', data)
})

router.post('/company_add', [
  check('company_name', '会社名を入力してください').notEmpty().escape(),
],(req, res, next)=>{
  // バリデーションエラーを取得
  const errors = validationResult(req);
  let company_name = req.body.company_name;
  let team = req.body.team;

  let form = req.session.form;
  let sendData = {
    company_name: company_name,
    team : team,
  }

  if(!errors.isEmpty()) {  //エラー時
    let data = {
      title: '会社登録',
      sendData: sendData,
      err: errors.array(),
    }
    res.render('usres/company_add', data);  
  }else{
    form.company_name = company_name;
    form.team = team;
    req.session.form = form;  //セッションのformの値を更新  
    console.log(req.session.form);
    res.redirect('confirm');
  }
})

//======確認画面=====================================================
router.get('/confirm', (req, res, next) => {
  //フォーム
  const form = req.session.form;
  //所属部署情報
  const division = req.session.div;

  let divName = '';
  for(let i in division) {
    if(division[i].id == form.division){
      divName = division[i].name;
      break;
    }
  }

  //表示用のform
  let showForm = {
    name: form.name,
    company_id: form.company_id,
    employee_id: form.employee_id,
    division: divName,
  }

  //表示項目名
  const formName = {
      name: '氏名', 
      company_id: '会社ID', 
      employee_id: '社員ID',
      division: '所属部署'
  }

  let data = {
    title: 'Confirm',
    formVal: showForm,
    formName: formName
  }

  res.render('users/confirm', data);
})

router.post('/confirm', (req, res, next) => {
  //押されたボタンの値
  let btn = req.body.btn;

  if(btn === 'back') {  //確認画面へ
    res.redirect('add');
  } else {              //登録処理 
    //フォームから社員番号を抜き出す
    const form = req.session.form;
    const name = form.name;
    const company_id = form.company_id;
    const employee_id = form.employee_id;
    const pass = form.pass;
    const division = form.division;

    db.sequelize.sync()
    .then(() => db.User.create(form))

    
    req.session.login = id; //ログイン状態へ
    let url = req.session.back;
    res.redirect(url);
  }
})

module.exports = router;
