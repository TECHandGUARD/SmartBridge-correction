const { chromium }=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort'],{env:{...process.env,VITE_SUPABASE_URL:'https://smartbridge-test.supabase.co',VITE_SUPABASE_ANON_KEY:'test-publishable-key'},stdio:'ignore'});
 let browser;
 try {
  let ready=false;
  for(let attempt=0;attempt<100;attempt++) {try {await fetch('http://127.0.0.1:5173/login');ready=true;break;}catch {await new Promise(resolve=>setTimeout(resolve,100));}}
  if(!ready) throw new Error('Test server did not start');
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
 const errors=[]; const writes=[];
 const context=await browser.newContext();
 const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
 let profile={id:'00000000-0000-4000-8000-000000000101',email:'learner@example.test',full_name:'Test Learner',role:'user',onboarding_complete:false,is_active:true,is_super_admin:false};
 const authUser={id:profile.id,email:profile.email,user_metadata:{full_name:profile.full_name},aud:'authenticated',role:'authenticated'};
 const session={access_token:'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAxMDEiLCJleHAiOjQxMDI0NDQ4MDAsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.test',refresh_token:'test-refresh',expires_at:4102444800,expires_in:3600,token_type:'bearer',user:authUser};
 let failResult=true;
 await context.route('https://smartbridge-test.supabase.co/**', async route=>{
  const req=route.request(),url=new URL(req.url()); let data=[];let status=200;
  if(url.pathname==='/auth/v1/user') data=authUser;
  if(url.pathname==='/auth/v1/token') data=session;
  if(url.pathname==='/rest/v1/users') data=[profile];
  if(url.pathname==='/rest/v1/rpc/complete_onboarding') {writes.push(req.postDataJSON());profile={...profile,role:'student',onboarding_complete:true};data=profile;}
  if(url.pathname==='/rest/v1/quizzes') data=[{id:'quiz-1',title:'Test Quiz',subject:'Mathematics',grade:'Grade 12',questions:[{question:'Test question?',options:['A','B','C','D'],correct_index:0,explanation:'Test explanation'}]}];
  if(url.pathname==='/rest/v1/quiz_results' && req.method()==='POST') { const body=req.postDataJSON();writes.push(body); if(failResult){failResult=false;status=403;data={message:'Test save failure',code:'42501'};}else data={...body,id:'result-1'}; }
  if(url.pathname.startsWith('/functions/')) {status=404;data={error:'Not available'};}
  if(url.pathname==='/auth/v1/user' && req.method()==='PUT') data=authUser;
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5173/login');
 await page.getByRole('button',{name:'Sign In',exact:true}).waitFor();
 console.log('PASS: signed-out login loads');
 await page.getByPlaceholder('Email address').fill(profile.email);
 await page.getByPlaceholder('Password',{exact:true}).fill('TestPassword123');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.getByText('Tell us who you are').waitFor();
 await page.getByRole('button',{name:/^Student I am/}).click();
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Complete Setup',exact:true}).click();
 await page.waitForURL('http://127.0.0.1:5173/');
 assert.equal(writes[0].requested_role,'student');
 console.log('PASS: login -> onboarding -> authenticated home');
 await page.goto('http://127.0.0.1:5173/quiz');
 const selectors=page.getByRole('combobox');
 await selectors.nth(0).click();await page.getByRole('option',{name:'Mathematics',exact:true}).click();
 await selectors.nth(1).click();await page.getByRole('option',{name:'Grade 12',exact:true}).click();
 await page.getByRole('button',{name:'Start Quiz'}).click();
 await page.getByRole('button',{name:'A',exact:true}).click();
 await page.getByRole('button',{name:'See Results'}).click();
 await page.getByText('Your result could not be saved. Please retry.').waitFor();
 await page.getByRole('button',{name:'See Results'}).click();
 await page.getByText('1 out of 1 correct').waitFor();
 assert.equal(writes[1].student_id,profile.id);assert.equal(writes[2].score,1);
 console.log('PASS: correct grade quiz saves with ownership ID; failed save retries without duplicate answers');
 await page.goto('http://127.0.0.1:5173/premium');
 await page.getByText('After payment',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Activate',exact:true}).count(),0);
 console.log('PASS: no self-activation of premium');
 await page.goto('http://127.0.0.1:5173/admin');
 await page.waitForURL('http://127.0.0.1:5173/');console.log('PASS: learner blocked from admin route');
 await page.goto('http://127.0.0.1:5173/reset-password');
 await page.getByLabel('New password',{exact:true}).fill('ChangedPassword123');
 await page.getByLabel('Confirm password',{exact:true}).fill('ChangedPassword123');
 await page.getByRole('button',{name:'Save password'}).click();
 await page.waitForURL('http://127.0.0.1:5173/');console.log('PASS: reset-password route updates password');
 assert.deepEqual(errors,[]);
 } finally { if(browser) await browser.close(); server.kill(); }
})().catch(e=>{console.error(e);process.exit(1)});
