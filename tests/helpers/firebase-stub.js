// Faux Firebase minimal pour les tests de parcours : aucune connexion réelle, un invité (window.__LOGGED = false) ou un pilote connecté (true).
module.exports = `
(function(){
  const snap = { empty:true, size:0, docs:[], exists:false, data(){return {}}, forEach(){}, docChanges(){return []}, id:'x', metadata:{} };
  function q(){ const o = {
    get: async()=>snap, onSnapshot(a,b){ try{ (typeof a==='function'?a:a&&a.next)&&(typeof a==='function'?a:a.next)(snap);}catch(e){} return ()=>{} },
    set: async()=>{}, update: async()=>{}, add: async()=>({id:'x'}), delete: async()=>{},
    doc: ()=>q(), collection: (n)=>{ const o=q(); o.doc=(id)=>{ const d=q(); const key=n+'/'+id; d.get=async()=>{ const v=window.__DOCS&&window.__DOCS[key]; return v?{exists:true,id:id,data:()=>v}:{exists:false,id:id,data:()=>({})}; }; d.set=async(v)=>{ (window.__WRITES=window.__WRITES||[]).push([key,v]); if(window.__DOCS)window.__DOCS[key]=v; }; return d; }; if(n==='motorauto_catalog'&&window.__CATDOCS){ const ds=window.__CATDOCS.map(d=>({id:d.id,data:()=>d})); o.get=async()=>({empty:!ds.length,size:ds.length,docs:ds,forEach:(f)=>ds.forEach(f)}); } return o; }, where: ()=>q(), orderBy: ()=>q(), limit: ()=>q(), startAfter: ()=>q(), collectionGroup: ()=>q(),
    runTransaction: async(f)=>f({get:async()=>snap,set(){},update(){},delete(){}}), batch: ()=>({set(){},update(){},delete(){},commit:async()=>{}}),
    enablePersistence: async()=>{}, settings(){}, useEmulator(){}, FieldValue:{}, };
    return o; }
  const U = window.__LOGGED ? { uid:'u1', email:(window.__EMAIL||'testeur@motorauto.test'), displayName:'Testeur', emailVerified:true, photoURL:null, getIdToken: async()=>'t', getIdTokenResult: async()=>({claims:{}}) } : null;
  const auth = { currentUser:U, onAuthStateChanged(cb){ setTimeout(()=>cb(U),50); return ()=>{} }, onIdTokenChanged(cb){ setTimeout(()=>cb(U),50); return ()=>{} }, signOut: async()=>{}, setPersistence: async()=>{}, languageCode:'fr', useDeviceLanguage(){} };
  const fs = Object.assign(()=>q(), { FieldValue:{ serverTimestamp:()=>0, increment:n=>n, arrayUnion:(...a)=>a, arrayRemove:(...a)=>a, delete:()=>0 }, Timestamp:{ now:()=>({toMillis:()=>Date.now()}), fromMillis:m=>({toMillis:()=>m}) } });
  const fn = ()=>({ httpsCallable:()=>async()=>({data:{}}) });
  const firebase = { initializeApp(){}, apps:[{}], app:()=>({functions:fn,storage:()=>({}),auth:()=>auth,firestore:()=>q()}), auth: Object.assign(()=>auth,{GoogleAuthProvider:function(){}, EmailAuthProvider:{}, Auth:{Persistence:{LOCAL:'l',SESSION:'s',NONE:'n'}}}), firestore: fs, functions: fn, storage:()=>({ref:()=>({put:async()=>({}),getDownloadURL:async()=>''})}), messaging: Object.assign(()=>({getToken:async()=>'',onMessage(){}}),{isSupported:()=>false}), analytics:()=>({}) };
  window.firebase = firebase;
})();`;
