const express = require('express');
const app = express();
const router = express.Router();
const server = require('http').Server(app); //ソケット通信用のサーバーを立てるための準備
const io = require('socket.io')(server);    //どのサーバーで通信を行うかをsocket.ioに伝える
//ランダムなidを発行する関数
const {v4: uuidV4} = require('uuid');  //{v4: uuidV4} v4関数をuuidV4にリネーム

router.get('/', function(req, res, next) {
    let ROOM_ID = uuidV4();
    res.redirect(`chat/${ROOM_ID}`);
});

//roomIdつきのルームにリダイレクト
router.get("/:room", (req, res) => { 
    
    let data = {
        title:'chat',
        roomId: req.params.room,
    }                  
    res.render("chat/", data);    
});

//非同期通信でチャット画面訪問時に相手にURLを送信するために必要なデータを送信
router.get('/chat/sendData', function(req, res, next) {
    const sendData = req.session.phoneData;
    console.log('確認',sendData);
    if (sendData) {
        res.json({ sendData: sendData });
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
});

module.exports = router;