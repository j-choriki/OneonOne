"use strict";

//メンバーリストの取得
const lists = document.querySelectorAll('p');
let memberId = "";

//リストからクリックされたidのメッサージを表示する
lists.forEach(list =>{
    list.addEventListener('click', () => {
        memberId = list.id;
        
    })
})

const form = document.getElementsByTagName('form')[0];
form.addEventListener('submit', (e) => {
    //押されたボタンのvalueを取得
    const btnValue = e.submitter.value;

    //押されたボタンがfhoneならそのまま送信する
    if(btnValue == 'fhone'){
        form.submit();
    }else{
        e.preventDefault();
    }
})