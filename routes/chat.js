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
        roomId: req.params.room
    }                  
    res.render("chat/", data);    
});

module.exports = router;