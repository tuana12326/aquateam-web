const express=require('express'),session=require('express-session'),bcrypt=require('bcryptjs'),multer=require('multer'),nodemailer=require('nodemailer'),path=require('path'),fs=require('fs'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const DATA=process.env.DATA_DIR||path.join(__dirname,'data'),UP=path.join(DATA,'uploads');
fs.mkdirSync(UP,{recursive:true});
const db=new DatabaseSync(path.join(DATA,'site.db'));
const P=['title_tr','title_en','body_tr','body_en','date'];
const S={posts:P,tests:P,gallery:['caption_tr','caption_en','url'],sponsors:['name','link','logo'],members:['name','role_tr','role_en','dept','grade','linkedin','alumni']};
const UPL={gallery:'url',sponsors:'logo'};
const LBL={posts:'Duyuru / Blog',tests:'Havuz Testi Günlüğü',gallery:'Galeri (foto / video)',sponsors:'Sponsorlar',members:'Üyeler'};
const FILES={logo:'logo.png',sponsor:'sponsorluk.pdf',model:'model.glb',coral:'coral.png',presskit:'basin-kiti.zip'};
for(const t in S)db.exec(`CREATE TABLE IF NOT EXISTS ${t}(id INTEGER PRIMARY KEY AUTOINCREMENT,${S[t].map(c=>c+' TEXT').join(',')})`);
db.exec('CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT,data TEXT,created TEXT)');
if(!db.prepare('SELECT 1 FROM posts').get())db.prepare('INSERT INTO posts(title_tr,title_en,body_tr,body_en,date) VALUES(?,?,?,?,?)').run('Yeni web sitemiz yayında','Our new website is live','Yönetim panelinden duyuru, test günlüğü, galeri ve sponsorları artık kolayca güncelleyebiliyoruz.','We can now easily update posts, test logs, gallery and sponsors from the admin panel.','2026-11-22');

if(!db.prepare('SELECT 1 FROM members').get()){const ins=db.prepare('INSERT INTO members(name,role_tr,role_en,dept,grade,linkedin,alumni) VALUES(?,?,?,?,?,?,?)');
const E='Elektrik-Elektronik Müh. 3. Sınıf',B='Bilgisayar Müh. 2. Sınıf',M='Makine Müh. 2. Sınıf',L='https://www.linkedin.com/in/';
for(const m of [
['Enes Alver','Takım Kaptanı / As Pilot','Team Captain / Co-Pilot','kaptan,pilot',E,L+'enesalver/'],
['Muhammed Emir Aydın','Arayüz Geliştirme (CORAL Arayüz)','Interface Development (CORAL Interface)','yazilim',E,L+'muhammed-emir-aydın/'],
['Eslem Serra Saatçi','Görüntü İşleme (CLAHE / YOLOv9)','Image Processing (CLAHE / YOLOv9)','yazilim',B,L+'eslem-serra-saatci-030978386/'],
['Betül Kaya','Görüntü İşleme (OpenCV / AI)','Image Processing (OpenCV / AI)','yazilim',B,L+'betül-kaya-b9695738b/'],
['Samet Karakaş','Otonom Programlama (Pymavlink)','Autonomous Programming (Pymavlink)','yazilim','Otonom 2. Sınıf',L+'samet-karakaş-2545863a3/'],
['Rahmi Yerlikaya','Mekanik Tasarım (SOLIDWORKS) / Test Mühendisi','Mechanical Design (SOLIDWORKS) / Test Engineer','mekanik,test',M,L+'rahmi-yerlikaya-891877396/'],
['Batuhan Enes Demir','Mekanik Tasarım & Analiz','Mechanical Design & Analysis','mekanik',M,L+'batuhanenesdemir/'],
['Oğuzhan Koçdemir','Parça Üretim & Montaj','Part Manufacturing & Assembly','mekanik',E,L+'oguzhan-kocdemir/'],
['Hüseyin Efe Düztaş','Elektronik & PCB Tasarımı / Yedek Pilot','Electronics & PCB Design / Backup Pilot','elektronik,pilot',E,L+'huseyin-efe-duztas/'],
['Ahmet Bilgiç','Güç Sistemleri & Regülasyon','Power Systems & Regulation','elektronik',E,L+'ahmet-bilgiç-174b42325/'],
['Abdulkadir Küçükapan','Sensör Entegrasyon / Test Mühendisi','Sensor Integration / Test Engineer','elektronik,test',E,L+'abdulkadir-küçükapan-057931330/'],
['Mustafa Berk Türkal','Sensör Entegrasyon / Test Mühendisi','Sensor Integration / Test Engineer','elektronik,test',E,L+'mustafaberkturkal/'],
['Özge Zeynep Keskin','Sensör Entegrasyon','Sensor Integration','elektronik',E,L+'özge-keskin-54440439b/'],
['Cemalettin Akdoğan','Akademik Danışman','Academic Advisor','danisman','Öğr. Gör. · Afyon Kocatepe Üniversitesi',L+'cemalettin-akdoğan-53209717b/']
])ins.run(...m,'')}
if(!db.prepare('SELECT 1 FROM gallery').get()){const g=db.prepare('INSERT INTO gallery(caption_tr,caption_en,url) VALUES(?,?,?)');
g.run('CORAL Ana ROV havuz kenarında test hazırlığında','CORAL Main ROV preparing for a pool test','/img/hero-bg.jpg');g.run('Takım atölye çalışması','Team workshop session','/img/team-work.jpg')}
const HASH=bcrypt.hashSync(process.env.ADMIN_PASS||'degistir',10);
const mailer=process.env.SMTP_HOST&&nodemailer.createTransport({host:process.env.SMTP_HOST,port:+process.env.SMTP_PORT||587,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
const OKEXT=/\.(png|jpe?g|webp|gif|svg|mp4)$/i;
const up=multer({storage:multer.diskStorage({destination:UP,filename:(q,f,cb)=>cb(null,crypto.randomUUID()+path.extname(f.originalname).toLowerCase())}),limits:{fileSize:25e6},fileFilter:(q,f,cb)=>cb(null,OKEXT.test(f.originalname))});
const fileUp=multer({storage:multer.diskStorage({destination:UP,filename:(q,f,cb)=>cb(null,FILES[f.fieldname])}),limits:{fileSize:60e6}});
const all=(t,o='id DESC')=>db.prepare(`SELECT * FROM ${t} ORDER BY ${o}`).all();
const app=express();
app.set('view engine','ejs');app.set('trust proxy',1);
app.locals.S=S;app.locals.LBL=LBL;app.locals.FILES=FILES;
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));app.use('/uploads',express.static(UP));
app.use(session({secret:process.env.SESSION_SECRET||'dev-secret',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}}));
app.use((req,res,next)=>{const lang=(req.headers.cookie||'').includes('lang=en')?'en':'tr';
 Object.assign(res.locals,{lang,q:req.query,title:'',x:(a,b)=>lang=='tr'?a:b,f:(r,k)=>r[k+'_'+lang]||r[k+'_tr']||'',has:n=>fs.existsSync(path.join(UP,n)),yt:u=>(String(u).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)||[])[1]});next()});
app.get('/lang/:l',(req,res)=>{res.cookie('lang',req.params.l=='en'?'en':'tr',{maxAge:3e10});res.redirect(req.get('referer')||'/')});
const page=(p,title,data=()=>({}))=>app.get(p=='home'?'/':'/'+p,(req,res)=>res.render(p,{title,...data()}));
page('home','AquaTeam',()=>({posts:all('posts','date DESC').slice(0,3),sponsors:all('sponsors')}));
page('systems','Sistemler / Systems');
app.get('/game',(req,res)=>res.sendFile(path.join(__dirname,'public','game.html')));
page('media','Medya / Media',()=>({g:all('gallery')}));
page('sponsor','Sponsorluk / Sponsorship',()=>({sponsors:all('sponsors')}));
page('team','Ekibimiz / Team',()=>({m:all('members','dept,name')}));
page('contact','İletişim / Contact');
const list=(kind,title)=>(req,res)=>{const s=String(req.query.s||'').trim().slice(0,60),l='%'+s+'%';
 const rows=s?db.prepare(`SELECT * FROM ${kind} WHERE title_tr LIKE ? OR title_en LIKE ? OR body_tr LIKE ? OR body_en LIKE ? ORDER BY date DESC`).all(l,l,l,l):all(kind,'date DESC');
 res.render('list',{title,kind,rows,s})};
app.get('/blog',list('posts','Blog'));app.get('/tests',list('tests','Test'));
// Salt okunur REST API (JSON)
app.get('/api/:t',(req,res)=>S[req.params.t]?res.json(all(req.params.t,'id')):res.status(404).json({error:'not found'}));
app.get('/api/:t/:id',(req,res)=>{const r=S[req.params.t]&&db.prepare(`SELECT * FROM ${req.params.t} WHERE id=?`).get(req.params.id);r?res.json(r):res.status(404).json({error:'not found'})});
const FORMS={contact:['name','email','message'],sponsor:['name','email','company','message'],apply:['name','email','dept','grade','message']};
const BACK={contact:'/contact',sponsor:'/sponsor',apply:'/team'};
app.post('/form/:k',async(req,res)=>{const k=req.params.k,F=FORMS[k];if(!F)return res.sendStatus(404);
 if(req.body.website)return res.redirect(BACK[k]+'?ok=1');
 const d=Object.fromEntries(F.map(n=>[n,String(req.body[n]||'').trim().slice(0,2000)]));
 if(!d.name||!/^\S+@\S+\.\S+$/.test(d.email)||(F.includes('message')&&d.message.length<5))return res.redirect(BACK[k]+'?err=1#f');
 db.prepare('INSERT INTO messages(kind,data,created) VALUES(?,?,?)').run(k,JSON.stringify(d),new Date().toISOString());
 try{const sub='[AquaTeam/'+k+'] '+d.name;if(mailer){await mailer.sendMail({from:process.env.SMTP_USER,to:process.env.MAIL_TO||'aquateam0303@gmail.com',replyTo:d.email,subject:sub,text:Object.entries(d).map(e=>e.join(': ')).join('\n')});await mailer.sendMail({from:process.env.SMTP_USER,to:d.email,subject:res.locals.lang=='en'?'We received your message':'Mesajınız alındı',text:res.locals.lang=='en'?'Hello '+d.name+', your message has reached the AquaTeam. We will get back to you soon.':'Merhaba '+d.name+', mesajınız AquaTeam’e ulaştı. En kısa sürede size dönüş yapacağız.'})}else await fetch(process.env.FORMSPREE_URL||'https://formspree.io/f/mbddaqbn',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({...d,_subject:sub,_replyto:d.email})})}catch(e){console.error(e)}
 res.redirect(BACK[k]+'?ok=1#f')});
app.get('/download/:n',(req,res)=>{const n=FILES[req.params.n];if(!n)return res.sendStatus(404);const u=path.join(UP,n),d=path.join(__dirname,'public','downloads',n);fs.existsSync(u)?res.download(u):fs.existsSync(d)?res.download(d):res.sendStatus(404)});
// ---- admin ----
app.get('/admin/login',(q,r)=>r.render('admin_login',{title:'Giriş'}));
app.post('/admin/login',(req,res)=>{if(req.body.u===(process.env.ADMIN_USER||'admin')&&bcrypt.compareSync(req.body.p||'',HASH)){req.session.admin=1;return res.redirect('/admin')}res.redirect('/admin/login?err=1')});
app.use('/admin',(req,res,n)=>req.session.admin?n():res.redirect('/admin/login'));
app.post('/admin/logout',(req,res)=>req.session.destroy(()=>res.redirect('/')));
app.get('/admin',(q,r)=>r.render('admin',{title:'Admin',mode:'home',msgs:all('messages').map(m=>({...m,d:JSON.parse(m.data)}))}));
app.get('/admin/files',(q,r)=>r.render('admin',{title:'Dosyalar',mode:'files'}));
app.post('/admin/files',fileUp.fields(Object.keys(FILES).map(name=>({name,maxCount:1}))),(q,r)=>r.redirect('/admin/files?ok=1'));
app.param('t',(req,res,n,v)=>S[v]?n():res.sendStatus(404));
app.get('/admin/:t',(req,res)=>res.render('admin',{title:LBL[req.params.t],mode:'list',t:req.params.t,rows:all(req.params.t)}));
app.get('/admin/:t/form/:id?',(req,res)=>{const t=req.params.t;res.render('admin',{title:LBL[t],mode:'form',t,row:req.params.id?db.prepare(`SELECT * FROM ${t} WHERE id=?`).get(req.params.id)||{}:{}})});
app.post('/admin/:t/save',up.single('file'),(req,res)=>{const t=req.params.t,c=S[t],b=req.body,id=b.id;
 const v=c.map(k=>String(b[k]||'').trim());
 if(req.file&&UPL[t])v[c.indexOf(UPL[t])]='/uploads/'+req.file.filename;
 if(!v[0])return res.redirect(`/admin/${t}/form/${id||''}?err=1`);
 if(id)db.prepare(`UPDATE ${t} SET ${c.map(k=>k+'=?').join()} WHERE id=?`).run(...v,id);
 else db.prepare(`INSERT INTO ${t}(${c.join()}) VALUES(${c.map(()=>'?').join()})`).run(...v);
 res.redirect('/admin/'+t)});
app.post('/admin/:t/:id/delete',(req,res)=>{db.prepare(`DELETE FROM ${req.params.t} WHERE id=?`).run(req.params.id);res.redirect('/admin/'+req.params.t)});
app.listen(process.env.PORT||3000,()=>console.log('AquaTeam çalışıyor'));
