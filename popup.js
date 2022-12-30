const disableButton = document.getElementById('temporaryDisabled');

disableButton.addEventListener('click', tmporaryDisabled);
// 一時的に無効
function tmporaryDisabled()
{
  chrome.storage.sync.set({tmpDisabled: true }, function()
  {
    alert("一時的に無効化したうえで再読込を行います");
    console.log("Temp. Disabled");
    chrome.tabs.reload();
  });
}