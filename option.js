const MaxCodeCount = 5;
let CodeList = [];

let addButton = document.getElementById('add');
addButton.addEventListener('click', codeAdd);

// コード追加
function codeAdd()
{
  if(CodeList.length == MaxCodeCount)
  {
    alert("コードはこれ以上追加できません。(コードは最大" + MaxCodeCount + "個まで設定できます)");
    return;
  }

  CodeList.push("");
  formRefrash(CodeList);
}

// コード(複数)読取処理
const ReadCode = async function()
{
  let storageReadPromise = new Promise((resolve) => 
  {
    chrome.storage.sync.get(['SettingCodeList'], function(storageData)
    {
      if(storageData?.SettingCodeList != null)
      {
        resolve(storageData.SettingCodeList);
      }
      else
      {
        resolve(null);
      }
    });
  })
  let storageDataList = await storageReadPromise.then(function(result)
  {
    return result;
  });

  if(storageDataList != null)
  {
    console.log("(wait)Code Loaded:" + storageDataList + "(Count:" + storageDataList.length + ")");
  }
  else
  {
    console.log("(wait)Code Loaded failed:");
    storageDataList = [];
  }
  return storageDataList;
}

// コード(複数)保存処理
const SaveCode = async function(CodeList)
{
  let storageWritePromise = new Promise((resolve) => 
  {
    chrome.storage.sync.set({ SettingCodeList: CodeList }, function()
    {
      resolve(true);
    });
  })
  let result = await storageWritePromise.then(function(result)
  {
    return result;
  });

  if(result)
  {
    console.log("(wait)Code Write Success(Count:" + CodeList.length + ")");
  }
  else
  {
    console.log("(wait)Code Write failed:");
  }
}

// コード更新
async function codeUpdate()
{
  let codeIndex = this;
  let inputElement = document.getElementById('code' + codeIndex);

  alert("コード["+ codeIndex + "]を保存しました(" + inputElement.value + ")");
  CodeList[codeIndex] = inputElement.value;

  await SaveCode(CodeList);
}

// コード削除
async function codeDelete()
{
  let codeIndex = this;
  CodeList.splice(codeIndex, 1);

  // 削除ではなく、更新済みリストを上書きする
  await SaveCode(CodeList);
  formRefrash(CodeList);
}

// 宣言、関数はここまで。

// 
// オプションメイン処理
// 
main()
async function main()
{
  CodeList = await ReadCode();
  formRefrash(CodeList);
}

// コード一覧更新
function formRefrash(CodeList)
{
  let codeListBlockElement = document.getElementById('CodeListBlock');

  while(codeListBlockElement.firstChild)
  {
    codeListBlockElement.removeChild(codeListBlockElement.firstChild);
  }

  for(let i = 0; i < CodeList.length; i++)
  {
    console.log("Read Code["+ i +"]:" + CodeList[i]);

    let codeBlock = document.createElement('div')
    codeListBlockElement.appendChild(codeBlock);

    let codeInput    = document.createElement('input');
    codeInput.id = "code" + i;
    codeInput.style.width = "70%";
    codeInput.value = CodeList[i];

    let decideButton = document.createElement('button');
    decideButton.id  = "decide" + i;
    decideButton.style.width = "5%"
    decideButton.textContent = "決定";

    let deleteButton = document.createElement('button');
    deleteButton.id  = "delete" + i;
    deleteButton.style.width = "5%"
    deleteButton.textContent = "削除";

    codeBlock.appendChild(codeInput);
    codeBlock.appendChild(decideButton);
    codeBlock.appendChild(deleteButton);

    decideButton.addEventListener('click', codeUpdate.bind(i));
    deleteButton.addEventListener('click', codeDelete.bind(i));
  }
  if(CodeList.length == 0)
  {
    let letsMake = document.createElement('p');
    letsMake.textContent = "コードがありませんか? 「追加」ボタンを押し、今すぐ追加してみましょう！";
    codeListBlockElement.appendChild(letsMake);
  }
}
