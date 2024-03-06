'use strict';

//選択されボタンによってフォームを切り替える
const btnCreate = document.getElementById('createGroup');
const btnJoin = document.getElementById('joinGroup');
const joinForm = document.getElementById('joinForm');
const createForm = document.getElementById('createForm');
//各ボタンが押されたときの処理
btnCreate.addEventListener('click', () => {
    createForm.style.display = 'block';
    joinForm.style.display = 'none';
    if(btnCreate.classList.contains('active')){
        btnCreate.classList.remove('active');
        btnJoin.classList.add('active');
    } else {
        btnCreate.classList.add('active');
        btnJoin.classList.remove('active');
    } ;
})

btnJoin.addEventListener('click', () => {
    createForm.style.display = 'none';
    joinForm.style.display = 'block';
    if(btnJoin.classList.contains('active')){
        btnJoin.classList.remove('active');
        btnCreate.classList.add('active');
    } else {
        btnJoin.classList.add('active');
        btnCreate.classList.remove('active');
    } ;
})

//グループIDが入力されたときの非同期でチーム名を取得する
const inputGroupId = document.getElementById('group_id');
inputGroupId.addEventListener('change', () => {
    let inputText = inputGroupId.value;

    fetch('/users/getTeamName',{
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({inputText: inputText})
    })
    .then(response => response.json())
    .then(data =>{
        //チームのセレクトに取得したチーム名を追加
        const division = document.getElementById('division');
        division.innerHTML = '';
        if(data.length > 0){
            for(let team of data){
                let option = document.createElement('option');
                option.textContent = team.name;
                option.value = team.id;
                division.appendChild(option);
            }
        } else {
            alert('登録のないグループです');
        } 
    })
})

