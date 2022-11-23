
import bodyParser from 'body-parser';
import  express  from 'express';
import exphb from 'express-handlebars';
import session from 'express-session';
import flash from 'express-flash';
import pgPromise from 'pg-promise';
import SpazaSuggest from './spaza-suggest.js';

const pgp = pgPromise();

const app = express();
// database set up
const DATABASE_URL =  process.env.DATABASE_URL || 'postgresql://zuggs:suggest123@localhost:5432/spaza_suggest'

const config = {
    connectionString: DATABASE_URL
}
if(process.env.NODE_ENV == 'production'){
    config.ssl ={
        rejectUnauthorized: false
    }
}
const db = pgp(config);

const spazaSuggest = SpazaSuggest(db);


app.engine('handlebars', exphb.engine({defaultLayout : false}));
app.set('view engine', 'handlebars');
//setting up body-parser
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());


app.use(session({
    secret: 'Dikgang',
    resave: false,
    saveUninitialized: true, 
    cookie: {maxAge: 60000}
  }));
app.use(flash());

app.use(express.static('public'));

app.get('/',async (req,res)=>{

    if(!req.session.clientCode){
        res.redirect('/login')
        return;
    }


    res.render('index')
})

app.post('/register', async (req,res)=>{

    const {clientName} = req.body;

    if(!/^[aA-zZ]/.test(clientName)){
        req.flash('error','Please enter a valid name')
        return res.redirect("/register");
    } else {
        const register = await spazaSuggest.registerClient(clientName);
        req.flash('success',`PLease login using this code: ${register}`)
    }
    

    res.redirect('register')


})

app.get('/register',(req,res)=>{
    res.render('register')
})

app.get('/login',async (req,res)=>{
    res.render('login')
})

app.post('/login',async (req,res)=>{
    const {code} = req.body;
    const user = spazaSuggest.clientLogin(code);

    if(code){
        // req.flash('error', 'Please login using the code given')
        // return res.redirect('login')
        if(user){
            req.session.user = user;
            res.redirect('/');
            return;
        }
    }
    res.render('login')
    // else {
        // if(clientCode){
        //     req.session.clientCode = clientCode;
        //     res.redirect('/');
        //     return
        // }
    // }
})



const PORT = process.env.PORT || 3020;
app.listen(PORT, ()=>{
    console.log('the server started at port:', PORT)
})