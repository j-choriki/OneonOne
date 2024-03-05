'use strict';
const socket = io();        // io("/"):3000番とコネクト
const myPeer = new Peer();     //peerオブジェクトの作成

const videoWrap = document.getElementById('video-wrap');    // 作成したVideoDOMを格納するDOM
const myVideo = document.createElement("video");    //映像を映す箇所の生成
myVideo.muted = true;   //作成したvideoプロパティに含まれているmuteプロパティの設定(自分の声の反射を防ぐ)

const peers = {};   //ユーザーごとのピア情報を含むメディアコネクションオブジェクト保存用オブジェクト
let myVideoStream;

fetch('chat/sendData')
.then(response => response.json())
.then(data => {
    const insertData = JSON.parse(data.sendData);
    //URLを取得する
    const currentURL = document.URL;
    const sendData = {
        userId: insertData.userId,
        memberId: insertData.memberId,
        titleId: insertData.titleId,
        talk:currentURL,
    }
    socket.emit('sendTalk',sendData);
    
}).catch(error => console.error('Error:', error));

/**
 * 作成したVideoDOMに受け取ったstreamを追加する関数
 * @param {*} video :videoDom
 * @param {*} stream :動画、音声情報
 */
const addVideoStream = (video, stream)=>{ 
    video.srcObject = stream;
    //メタデータが読み込まれたときの処理
    video.addEventListener("loadedmetadata", () => { 
        video.play();
    });
    videoWrap.append(video);
}

/**
 * video送信の処理
 * 
 * @param {*} userId  
 * @param {*} stream 
 */
const connectToNewUser = (userId, stream) => {
    //自分video情報を相手に送る
    const call = myPeer.call(userId, stream);
    //自身のvideoタグの生成
    const video = document.createElement("video");
    //受信の処理
    call.on("stream",(userVideoStream) => {
        addVideoStream(video, userVideoStream); //新たにvideoを追加
    });
    
    //videoのコネクトが切れたときの処理
    call.on("close", () => {
        video.remove();
    });

    // 他のユーザーのピア情報を保存
    peers[userId] = call;
}

navigator.mediaDevices
    .getUserMedia({ //getUserMedia:デバイスからビデオデータと音声データを取得するAPI
        //ここはデバイスから取得したいものを記載(今回は映像と音声)
        video: true,
        audio: true,
    }).then(stream => { //promise関数のためthenを使用(返り値streamに動画情報が格納されている)
        myVideoStream = stream;
        addVideoStream(myVideo, stream); 

        //video送信対する応答処理
        myPeer.on('call', (call) => {
            call.answer(stream);
            //既存ユーザーのカメラ情報を入室したユーザー画面に表示
            const video = document.createElement("video");
            call.on("stream", userVideoStream => {
                addVideoStream(video, userVideoStream);
            })
            
            //peers変数に自身のピア情報を保存
            const userId = call.peer;
            peers[userId] = call;
        });

        //soket.on:イベントの受信
        socket.on('user-connected', (userId) => { //第一引数:受信したイベント名, 第二引数：受信したパラメーター(サーバサイドと合わせる)
            connectToNewUser(userId,stream);
        })
    });

//ユーザーがルームから離れたときの処理(接続解除)    
socket.on('user-disconnected', (userId) => {
    // 該当ユーザーが入ればクローズ
    if(peers[userId]) peers[userId].close(); //コネクションの削除
})

//peerを初期化したタイミングでopenイベントが発生する->userIdを受けとる
myPeer.on('open',(userId) => {  //userId = peerId: 相手がどのpeerに接続すればいいかわかる   
    //socket.emit():サーバへのイベントの送信
    socket.emit('join-room', ROOM_ID, userId);  //第一引数:イベント名
})

myPeer.on('disconneted', (userId) => {
    console.log('disconnected=', userId);
})

const muteUnmute = (e) => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled){
        e.classList.add("active");
        myVideoStream.getAudioTracks()[0].enabled = false; 
        e.children[0].src = '../images/micOn.png';
    } else {
        e.classList.remove("active");
        myVideoStream.getAudioTracks()[0].enabled = true; 
        e.children[0].src = '../images/micOff.png';
    }
};

const playStop = (e) => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled){
        e.classList.add("active");
        myVideoStream.getVideoTracks()[0].enabled = false;
        e.children[0].src = '../images/videoOn.png';
    } else {
        e.classList.remove("active");
        myVideoStream.getVideoTracks()[0].enabled = true;
        e.children[0].src = '../images/videoOff.png';
    }
};

const leaveVideo = (e) => {
    socket.disconnect();
    myPeer.disconnect();
    const videos = document.getElementsByTagName("video");
    for(let i = videos.length - 1; i >= 0; i--) {
        videos[i].remove();
    }
    //ホーム画面へ遷移
    window.location.href = '/';
}





