import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const setupScreen = $("setupScreen"), appScreen = $("appScreen");
let db, auth, uid, room = "", myName = "", partnerName = "", listeners = [];
let roomData = {}, currentQuiz = 0, target = 0;
const quiz = [
  {q:"Apa kegiatan kencan yang paling seru?",a:["Nonton film","Masak bareng","Jalan-jalan","Semua seru kalau berdua"],correct:3},
  {q:"Kalau pasangan sedang sedih, apa yang paling dibutuhkan?",a:["Didengarkan","Diberi hadiah","Ditinggal sendiri","Diajak bercanda"],correct:0},
  {q:"Mana yang lebih penting dalam hubungan?",a:["Komunikasi","Saling percaya","Saling menghargai","Semuanya penting"],correct:3},
  {q:"Pilih hadiah sederhana paling manis:",a:["Surat kecil","Bunga","Makanan favorit","Waktu bersama"],correct:3},
  {q:"Kalau punya satu hari bebas bersama, pilih apa?",a:["Pantai","Kulineran","Di rumah saja","Petualangan spontan"],correct:3}
];
const quotes = ["Hal kecil yang dilakukan bersama bisa jadi kenangan besar.","Rumah bukan selalu tempat. Kadang, rumah adalah seseorang.","Terima kasih sudah jadi bagian paling manis dari hariku.","Tidak harus sempurna, yang penting saling memilih setiap hari.","Satu pesan darimu bisa mengubah hari yang berat."];
const pickup = ["Kamu itu seperti Wi-Fi, bikin aku selalu ingin terhubung. 📶","Kalau rindu bisa jadi tugas, aku sudah mengumpulkan seribu halaman. 💗","Kamu bukan Google, tapi semua yang aku cari ada di kamu. 😚","Aku tidak butuh GPS, karena tujuanku selalu kamu. 🧭","Kamu tahu bedanya kamu dan kalender? Kalender punya tanggal, kamu punya tempat spesial di hatiku. 🥹","Boleh pinjam senyummu? Punyaku habis gara-gara mikirin kamu. 🌷"];
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function err(msg){$("setupError").textContent=msg}
function cleanName(v){return v.trim().slice(0,24)}
function makeCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function money(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0)}
function safe(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

async function startFirebase(){
  if(!firebaseConfig.apiKey || firebaseConfig.apiKey==="ISI_API_KEY") throw new Error("Konfigurasi Firebase belum diisi. Buka firebase-config.js terlebih dahulu.");
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getDatabase(app);
  const credential=await signInAnonymously(auth);uid=credential.user.uid;
}
async function createRoom(){
  try{
    err("");myName=cleanName($("yourName").value);partnerName=cleanName($("partnerName").value)||"Pasangan";
    if(!myName) return err("Isi nama kamu dulu ya.");
    await startFirebase();
    let code=makeCode();let roomRef=ref(db,`rooms/${code}`);
    while((await get(roomRef)).exists()){code=makeCode();roomRef=ref(db,`rooms/${code}`)}
    await set(roomRef,{createdAt:Date.now(),members:{[uid]:{name:myName}},target:0});
    room=code;enterApp();
  }catch(e){err(e.message);console.error(e)}
}
async function joinRoom(){
  try{
    err("");myName=cleanName($("yourName").value);partnerName=cleanName($("partnerName").value)||"Pasangan";room=$("roomInput").value.trim().toUpperCase();
    if(!myName)return err("Isi nama kamu dulu ya.");if(room.length!==6)return err("Kode ruang harus 6 karakter.");
    await startFirebase();const roomRef=ref(db,`rooms/${room}`);const snap=await get(roomRef);
    if(!snap.exists())return err("Kode ruang tidak ditemukan. Periksa lagi ya.");
    const data=snap.val();const members=data.members||{};
    if(Object.keys(members).length>=2 && !members[uid])return err("Ruang ini sudah diisi dua orang.");
    await set(ref(db,`rooms/${room}/members/${uid}`),{name:myName});
    const names=Object.values(members).map(x=>x.name);partnerName=names[0]||partnerName;
    enterApp();
  }catch(e){err(e.message);console.error(e)}
}
function enterApp(){
  setupScreen.classList.add("hidden");appScreen.classList.remove("hidden");$("leaveBtn").classList.remove("hidden");
  $("roomCode").textContent=room;$("welcomeName").textContent=myName;$("coupleNames").textContent=`${myName} & ${partnerName}`;
  $("todayDate").textContent=new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
  $("connection").textContent="● Terhubung";$("connection").style.color="#54a77b";
  listenRoom();showTab("home");
}
function listenRoom(){
  listeners.forEach(fn=>fn());listeners=[];
  const r=ref(db,`rooms/${room}`);
  const unsub=onValue(r,snap=>{roomData=snap.val()||{};renderAll()});listeners.push(unsub);
}
function renderAll(){
  const members=roomData.members||{};const names=Object.entries(members);
  const other=names.find(([id])=>id!==uid);if(other){partnerName=other[1].name||"Pasangan";$("coupleNames").textContent=`${myName} & ${partnerName}`}
  const moods=roomData.moods||{};const moodHtml=Object.entries(moods).map(([id,m])=>`<div class="mood-person"><b>${safe(m.emoji)} ${safe(m.name)}</b><span>${safe(m.mood)}</span></div>`).join("");
  $("homeMoods").innerHTML=moodHtml||'<p class="muted">Belum ada mood hari ini.</p>';
  $("moodList").innerHTML=moodHtml||'<div class="empty">Belum ada yang update mood hari ini.</div>';
  const wishes=roomData.wishes||{};const wishEntries=Object.entries(wishes);
  $("wishCount").textContent=wishEntries.length;
  $("wishList").innerHTML=wishEntries.map(([id,w])=>`<div class="list-item"><span>✨</span><div class="item-main"><b>${safe(w.text)}</b><small>Ditambahkan oleh ${safe(w.by||"Kalian")}</small></div><button class="delete-btn" data-delete-wish="${id}">✕</button></div>`).join("")||'<div class="empty">Wishlist masih kosong. Tambahkan impian pertama kalian! ♡</div>';
  const memories=roomData.memories||{};const memEntries=Object.entries(memories).reverse();
  $("memoryCount").textContent=memEntries.length;
  $("memoryList").innerHTML=memEntries.map(([id,m])=>`<article class="memory-card">${m.url?`<img src="${safe(m.url)}" alt="Foto kenangan" loading="lazy" onerror="this.style.display='none'">`:""}<div class="memory-body"><h3>${safe(m.title)}</h3><p>${safe(m.text||"")}</p><span class="memory-meta">${safe(m.by||"Kalian")} · ${new Date(m.createdAt).toLocaleDateString("id-ID")}</span><button class="delete-btn" data-delete-memory="${id}">Hapus</button></div></article>`).join("")||'<div class="empty">Belum ada kenangan. Yuk simpan momen pertama! 💗</div>';
  const savings=roomData.savings||{};const saveEntries=Object.entries(savings).reverse();const total=Object.values(savings).reduce((a,x)=>a+Number(x.amount||0),0);
  target=Number(roomData.target||0);$("savingTotal").textContent=money(total);$("bigSavingTotal").textContent=money(total);$("targetInput").value=target||"";
  const pct=target?Math.min(100,total/target*100):0;$("savingProgress").style.width=pct+"%";$("savingProgressText").textContent=target?`${Math.round(pct)}% dari target ${money(target)}`:"Tentukan target impian kalian.";
  $("savingList").innerHTML=saveEntries.map(([id,s])=>`<div class="list-item"><span>🐷</span><div class="item-main"><b>${money(s.amount)}</b><small>${safe(s.note||"Tabungan")} · ${safe(s.by||"Kalian")}</small></div><button class="delete-btn" data-delete-saving="${id}">✕</button></div>`).join("")||'<div class="empty">Belum ada tabungan yang dicatat.</div>';
}
async function addItem(path,data){await push(ref(db,`rooms/${room}/${path}`),{...data,by:myName,createdAt:Date.now()});toast("Berhasil disimpan! ♡")}
function showTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("hidden",p.id!==`tab-${name}`));
}
function nextQuiz(){currentQuiz=(currentQuiz+1)%quiz.length;renderQuiz()}
function renderQuiz(){
  const q=quiz[currentQuiz];$("quizNumber").textContent=`QUESTION ${String(currentQuiz+1).padStart(2,"0")}`;$("quizQuestion").textContent=q.q;$("quizFeedback").textContent="";
  $("quizChoices").innerHTML=q.a.map((a,i)=>`<button class="quiz-choice" data-answer="${i}">${a}</button>`).join("");
}
function selectMood(mood,emoji){set(ref(db,`rooms/${room}/moods/${uid}`),{name:myName,mood,emoji,updatedAt:Date.now()}).then(()=>toast("Mood kamu sudah dibagikan 💗"))}

$("createBtn").addEventListener("click",createRoom);$("joinBtn").addEventListener("click",joinRoom);
$("leaveBtn").addEventListener("click",()=>{listeners.forEach(fn=>fn());listeners=[];room="";location.reload()});
$("copyCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(room);toast("Kode ruang disalin!")}catch{toast("Kode ruang: "+room)}});
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.goto)));
document.querySelectorAll(".mood-option").forEach(b=>b.addEventListener("click",()=>selectMood(b.dataset.mood,b.dataset.emoji)));
$("wishForm").addEventListener("submit",async e=>{e.preventDefault();const text=$("wishInput").value.trim();if(text){await addItem("wishes",{text});$("wishInput").value=""}});
$("memoryForm").addEventListener("submit",async e=>{e.preventDefault();const title=$("memoryTitle").value.trim();if(!title)return;const url=$("memoryUrl").value.trim();if(url&&!/^https:\/\/.+/i.test(url)){toast("Link foto harus diawali https://");return}await addItem("memories",{title,text:$("memoryText").value.trim(),url});e.target.reset()});
$("savingForm").addEventListener("submit",async e=>{e.preventDefault();const amount=Number($("savingAmount").value);if(amount<=0)return;await addItem("savings",{amount,note:$("savingNote").value.trim()});$("savingAmount").value="";$("savingNote").value=""});
$("targetForm").addEventListener("submit",async e=>{e.preventDefault();const n=Number($("targetInput").value);if(n<=0)return toast("Target harus lebih dari nol.");await update(ref(db,`rooms/${room}`),{target:n});toast("Target tabungan diperbarui!")});
document.addEventListener("click",async e=>{
  const w=e.target.closest("[data-delete-wish]");if(w&&confirm("Hapus wishlist ini?"))await remove(ref(db,`rooms/${room}/wishes/${w.dataset.deleteWish}`));
  const m=e.target.closest("[data-delete-memory]");if(m&&confirm("Hapus kenangan ini?"))await remove(ref(db,`rooms/${room}/memories/${m.dataset.deleteMemory}`));
  const s=e.target.closest("[data-delete-saving]");if(s&&confirm("Hapus catatan tabungan ini?"))await remove(ref(db,`rooms/${room}/savings/${s.dataset.deleteSaving}`));
  const a=e.target.closest("[data-answer]");if(a){const correct=quiz[currentQuiz].correct;const chosen=Number(a.dataset.answer);$("quizFeedback").textContent=chosen===correct?"Yeay, jawaban paling manis! 💗":"Hehe, coba diskusikan jawabannya bareng pasangan ya!";document.querySelectorAll(".quiz-choice").forEach(x=>x.disabled=true)}
});
$("nextQuiz").addEventListener("click",nextQuiz);
$("loveBtn").addEventListener("click",()=>{$("loveOutput").textContent="“"+pickup[Math.floor(Math.random()*pickup.length)]+"”"});
$("newQuote").addEventListener("click",()=>{$("dailyQuote").textContent=quotes[Math.floor(Math.random()*quotes.length)]});
renderQuiz();
