// Init
function program_init()
{
  document.title = "Loading...";

  // メイン部分で処理が終わるまで、ページ本体を表示させないようにする
  document.getElementsByTagName("html")[0].style.visibility="hidden";
  window.onload=function()
  {
    document.getElementsByTagName("html")[0].style.visibility="visible";   
  }
}
program_init();