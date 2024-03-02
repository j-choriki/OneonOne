"use strict";

//メンバーの要素を取得
let members = document.getElementsByClassName('member');

//投稿タイトルを表示するul
const ulSubject = document.getElementsByClassName('subject')[0];

//表示されて投稿タイトル取得用の変数
let titles;

//クリックされたタイトルのtitleIdを取得する
let titleId = '';

//talkエリアのulを取得
let ulTalk = document.getElementsByClassName('talk')[0];

let socket = io();

let m = document.getElementsByClassName('in');

//ユーザーIDの取得  
let userId = '';
// サーバーからセッション情報を取得する
fetch('/session-user-data')
.then(response => response.json())
.then(data => {
    userId = data.memberNum;    //ユーザーID

    //ログイン状態をここで監視  
    socket.on('update_member_state', (states) => {
        // サーバーからのデータを受信したmemberに関数情報(必要に応じてbin/wwwを書き換える)
        // console.log('Received updated data:', states[0]);
        
        let spanClassIn = document.getElementsByClassName('in');
        let checks = states.filter(state => state.memberNum != userId);
        
        let spanNum = 0;
        //メンバーの状態を取得し、クラスを付与
        for(let check of checks) {
            if(check.memberNum === spanClassIn[spanNum].id){
                let className = '';
                switch(check.state){
                    case 1 :
                        className = 'login';
                        spanClassIn[spanNum].classList.remove('calling', 'logout');
                        spanClassIn[spanNum].classList.add(className);                        
                        break;
                    case 2:
                        className = 'calling';
                        spanClassIn[spanNum].classList.remove('login', 'logout');
                        spanClassIn[spanNum].classList.add(className);
                        break;
                    default :
                        className = 'logout';
                        spanClassIn[spanNum].classList.remove('login', 'calling');
                        spanClassIn[spanNum].classList.add(className);
                        break;
                }
                
            }
            spanNum++;
        }
        
    });
}).catch(error => console.error('エラー:', error));



//======メンバーを押したときの処理=======================================
let memberId = '';
for(let member of members){
    member.addEventListener('click', () => {
        //表示されているタイトルを全て取り除く
        ulSubject.innerHTML = '';

        //押されたメンバーのIDを取得
        memberId = member.id;

        //タイトル登録用にmemberIdをformのinputに格納
        const sendMemberId = document.getElementById('sendMemberId');
        sendMemberId.value= memberId;

        //クリックされたメンバーIDをセッションに登録するため非同期で送信
        fetch('/session-insert-memberId',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ memberId: memberId })
            
        }).catch(error => {
            console.error('通信エラー:', error);
        });

        //メッセージボードのヘッダーの名前と所属を変更する
        const msgHeaderName = document.getElementById('msg_header_name');
        let parentNode = member.parentNode.parentNode;
        let span = document.createElement('span');
        span.innerText = parentNode.querySelector('h3').textContent;
        msgHeaderName.textContent = member.textContent;
        msgHeaderName.appendChild(span);

        console.log(userId);

            //非同期でトークタイトルを取得
            let requestData = JSON.stringify({memberId: memberId, userId: userId});
            fetch('/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestData
            }).then(response => {
                if (response.ok) {
                    console.log('データを送信しました');
                    return response.json();        
                } else {
                    console.error('データの送信に失敗しました');
                }
            }).then(data => {
                console.log('取得したデータ:', data);
                //取得データHTMLに組み込む
                for(let titleData of data) {
                    let li = document.createElement('li');
                    li.innerText = titleData.name;
                    li.id = titleData.id
                    let span = document.createElement('span');
                    span.innerText = titleData.time;
                    li.appendChild(span);
                    li.className = 'titles';
                    ulSubject.appendChild(li);
                }
                //クリックされたタイトルのメッセージを取得する
                let titles = document.getElementsByClassName('titles');
                for(let title of titles) {
                    title.addEventListener('click', () => {
                        //liの各値を取得する
                        titleId = title.id;
                        let titleName = title.childNodes[0].textContent;
                        let insertTime = title.childNodes[1].textContent;

                        //トークエリアに取得した値を格納
                        const talkAreaHead= document.getElementById('talk_header');
                        talkAreaHead.textContent =  titleName;
                        const span = document.createElement('span');
                        span.textContent = insertTime;
                        talkAreaHead.appendChild(span);
                        
                        let getTalkData = {
                            memberId: memberId,
                            userId: userId,
                            titleId: titleId,
                        }
                        
                        requestData = JSON.stringify(getTalkData);
                        fetch('/talk_data', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body:requestData
                        }).then(response => {
                            if (response.ok) {
                                console.log('データを送信しました');
                                return response.json();        
                            } else {
                                console.error('データの送信に失敗しました');
                            }
                        }).then(data => {
                            console.log('取得トークデータ' , data);
                            //取得したトーク内容を表示する
                            ulTalk.innerHTML = '';
                            for(let talk of data){
                                const li = document.createElement('li');
                                const span = document.createElement('span');
                                span.textContent = talk[1];
                                if(userId == talk[0]){
                                    li.className = 'right';
                                } else {
                                    li.className = 'left';
                                }
                                li.appendChild(span);
                                ulTalk.appendChild(li);
                            }
                        })
                    })
                }
            })
            .catch(error => {
                console.error('通信エラー:', error);
            });
    })
    
}

//======タイトル入力時の処理============================================
const subjectForm = document.getElementById('formSubject');
const forms = document.getElementsByClassName('form');

const formsAry = [...forms];
formsAry.forEach(form =>{
    form.addEventListener('submit',(e) => {
        e.preventDefault();

        let userId = '';
        let memberId = '';

        //ユーザーIDとmemberIdを取得する
        fetch('/get-user-and-member', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('サーバーエラーが発生しました');
            }
            return response.json();
        })
        .then(data => {
            console.log('取得したデータ:', data);
            //ソケット通信用のデータ
            userId =  data.userId;
            memberId = data.memberId;
            let inputText = '';
            inputText = form.children[0].value;

            //データ送信用のオブジェクト
            let sendData = {};
        
            //form送信時の処理
            if(form.id == 'formSubject'){       //タイトルを送信するときの処理
                console.log('subject');
                //送信値をまとめる
                sendData = {
                    userId: userId,
                    memberId: memberId,
                    title: inputText
                }
                socket.emit('sendTitle', sendData);
                socket.on('insertTitle',(data) => {
                    //登録されたデータを画面に表示
                    let li = document.createElement('li');
                    li.innerText = data.name;
                    li.id = data.id;
                    li.className = 'titles';
                    let span = document.createElement('span');
                    let dateObj = new Date(data.createdAt);
                    let formattedDate = dateObj.toISOString().slice(0,10).replace(/-/g,"/");
                    let time = formattedDate;
                    span.innerText = time;
                    li.appendChild(span);
                    ulSubject.appendChild(li);
                    //タイトルエリアのtextareaの文字を空にする
                    const textarea = document.getElementsByTagName('textarea')[0];
                    textarea.value = '';
                })
            } else {    //トーク内容送信時の処理

                //送信値をまとめる
                sendData = {
                userId: userId,
                memberId: memberId,
                talk: inputText,
                titleId: titleId,
                }

                socket.emit('sendTalk', sendData);
                socket.on('insertTalk',(data) => {
                    console.log('データ',data);
                    //登録されたデータを画面に表示
                    const li = document.createElement('li');
                    const span = document.createElement('span');
                    span.textContent = data.msg;
            
                    if(userId == data.user1){
                        li.className = 'right';
                    } else {
                        li.className = 'left';
                    }
                    li.appendChild(span);
                    ulTalk.appendChild(li);
                    //タイトルエリアのtextareaの文字を空にする
                    const textarea = document.getElementsByTagName('textarea')[1];
                    textarea.value = '';
                })
            }
        })
        .catch(error => {
            console.error('通信エラー:', error);
        });
    })
})


//メンバーの状態を監視するソケット通信


