const decideButton = document.getElementById('decide');
const deleteButton = document.getElementById('delete');
const codeInput    = document.getElementById('code');

decideButton.addEventListener('click', codeUpdate);
deleteButton.addEventListener('click', codeDelete);

// コード更新
function codeUpdate()
{
  let code = codeInput.value;
  chrome.storage.sync.set({ SettingCode: code }, function()
  {
    alert("コードを保存しました:" + code);
    console.log("Code Saved:" + code);
  });
}

// コード削除
function codeDelete()
{
  let code = codeInput.value;
  chrome.storage.sync.remove('SettingCode', function()
  {
    alert("コードを削除しました");
    console.log("Code Deleted");
    codeInput.value = "";
  });
}

chrome.storage.sync.get(['SettingCode'], function(storageData)
{
  if(storageData?.SettingCode != null)
  {
    console.log("Code Loaded:" + storageData.SettingCode);  
    codeInput.value = storageData.SettingCode;
  }
  else
  {
    codeInput.value = "";
  }
});
