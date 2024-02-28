"use strict";
// const socket = io("/");

//メンバーの要素を取得
let members = document.getElementsByClassName('member');

//投稿タイトルを表示するul
const ulSubject = document.getElementsByClassName('subject')[0];

//表示されて投稿タイトル取得用の変数
let titles;

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

        //ユーザーIDの取得  
        let userId = '';
        // サーバーからセッション情報を取得する
        fetch('/session-user-data')
        .then(response => response.json())
        .then(data => {
            userId = data.memberNum;    //ユーザーID
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
                        let titleId = title.id;
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
                            const ulTalk = document.getElementsByClassName('talk')[0];
                            for(let talk of data){
                                const li = document.createElement('li');
                                li.textContent = talk;
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
        .catch(error => console.error('エラー:', error));
    })
    
}

//======タイトル入力時の処理============================================
const subjectForm = document.getElementById('formSubject');
//ソケット通信で投稿された投稿を取得する
subjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const socket = io();

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
        userId =  data.userId;
        memberId = data.memberId;
        let inputText = subjectForm.children[0].value;

        //送信値をまとめる
        let sendData = {
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
    })
    .catch(error => {
        console.error('通信エラー:', error);
    });
})  

//======タイトルクリック時の処理============================================
