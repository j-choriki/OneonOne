"use strict";
// const socket = io("/");

//メンバーの要素を取得
let members = document.getElementsByClassName('member');

//メンバーを押したときの処理
let memberId = '';
for(let member of members){
    member.addEventListener('click', () => {
        //表示されているタイトルを全て取り除く
        const ulSubject = document.getElementsByClassName('subject')[0];
        ulSubject.innerHTML = '';

        //押されたメンバーのIDを取得
        memberId = member.id;

        //タイトル登録用にmemberIdをformのinputに格納
        const sendMemberId = document.getElementById('sendMemberId');
        sendMemberId.value= memberId;

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
                    ulSubject.appendChild(li);
                }
            })
            .catch(error => {
                console.error('通信エラー:', error);
            });
        })
        .catch(error => console.error('エラー:', error));
    })
    
}

//タイトル入力時の処理
// const subjectForm = document.getElementById('formSubject');

// subjectForm.addEventListener('submit', (e) => {
//     e.preventDefault();

//     //ユーザーIDとmemberIdを取得する
//     // fetch('/session-user-and-member')
//     // .then(response => response.json())
//     // .then(data => {

//     // }).catch(error => {
//     //     console.error('通信エラー:', error);
//     // });
//     let inputText = subjectForm.children[0].value;
//     socket.emit('sendTitle', inputText);
// })  