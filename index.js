const express = require('express')
const path = require('path');
const multer = require('multer');
const mongodb = require('mongodb')
const bodyParser = require('body-parser')
const app = express()

app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(express.static('uploads'))

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,'uploads');
    },
    filename: function (req, file, cb) {
        const name = file.originalname
        const id = Date.now()
        const filePath = `images/${id}-${name}`
      cb(null,filePath);
    },
  });
  
  const upload = multer({storage})
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const {MongoClient} = require('mongodb');
const uri = "mongodb+srv://krowdev:Lucasdev5623410@cluster0.leptlre.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.use(express.urlencoded({extended: false}))

let user = null
let inSession = false

app.get('/cadastroUsuario',function(req,res){
    res.render('cadastroUsuario.ejs')
})
app.post('/register',async function(req,res){
    await client.connect();
    const emailExists = await client.db("myProject").collection("Usuarios").findOne({'email': req.body.email})
    console.log(emailExists)
    if(req.body.senha !== req.body.senhaConfirm){
        res.send("As senhas não batem!")
    }else if(emailExists !== null){
        res.send("Este email já está cadastrado!")
    }else{
        try {
            await client.connect();
            await addUser(client,{
                nome: req.body.nome,
                email: req.body.email,
                senha: req.body.senha,
                admin: false,
                afiliated: false,
                adopted: false
            })
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
            res.redirect('/')
        }
    }
})
app.get('/loginUsuario',function(req,res){
    if(inSession == false)
    {res.render('login.ejs')}
    else{res.redirect('/')}
})
app.post('/login',async function(req,res){
    logged = false
    try {
        await client.connect();
        const userExist = await client.db("myProject").collection("Usuarios").findOne({'email': req.body.email})
        if(userExist !== null){
            if(userExist.senha === req.body.senha){
                logged = true
                user = userExist
                inSession = true
            }
        }
    } catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
        if(logged == true)
            res.redirect('/')
        else
            res.send("Email e/ou senha incorretos, ou Usuário não existe!")
    }
})
app.get('/logout',function(req,res){
    user = null
    inSession = false
    res.redirect('/')
})


async function addUser(client, newListing){
    const result = await client.db("myProject").collection("Usuarios").insertOne(newListing);
    console.log(`Novo usuario criado com o seguinte id: ${result.insertedId}`);
}
async function addPet(client, newListing){
    const result = await client.db("myProject").collection("Pets").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}
async function adoptPet(client, newListing){
    const result = await client.db("myProject").collection("AdoptPets").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}
async function addNoticia(client, newListing){
    const result = await client.db("myProject").collection("Noticias").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}
async function addDica(client, newListing){
    const result = await client.db("myProject").collection("Dicas").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}
async function addComment(client, newListing){
    const result = await client.db("myProject").collection("Comentarios").insertOne(newListing);
    console.log(`Novo Comentário em ${result.sessao}: ${result.insertedId}`);
}
async function createListing(client, newListing){
    const result = await client.db("myProject").collection("testeCollection").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}
async function findOneListingByName(client, nameOfListing) {
    const result = await client.db("myProject").collection("testeCollection").findOne({ name: nameOfListing });

    if (result) {
        console.log(`Found a listing in the collection with the name '${nameOfListing}':`);
        console.log(result);
    } else {
        console.log(`No listings found with the name '${nameOfListing}'`);
    }
}



async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

app.get('/',async function(req,res){
    if(inSession == true && user.adopted == true){
        try {
            await client.connect();
            var o_id = new mongodb.ObjectID(user._id);
            const pets = await client.db("myProject").collection("AdoptPets").find({'AdoptedBy':o_id}).toArray()
            res.render("home.ejs",{user: user,Session: inSession,pets: pets})
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
        }
    }else{
        res.render("home.ejs",{user: user,Session: inSession})
    }
})
app.get('/upar',function(req,res){
    res.render('upar.ejs')
})
app.get('/pics',async function(req,res){
    try {
        await client.connect();
        const result = await client.db("myProject").collection("imagens").find().toArray()
        console.log(result)
        res.render('pics.ejs',{pictures: result})
    } catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
})

app.post('/upload', upload.single('file'), async function (req, res, next) { 
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
         if (req.file == null) {
        // If Submit was accidentally clicked with no file selected...
        } else { 
            try {
                await client.connect();
                
                // this landing will give you any option of file information that you can collect
                console.log('landing here', req.file)
                await addPet(client,
                    {
                        nome: req.body.nome,
                        peso: req.body.peso,
                        altura: req.body.altura,
                        historia: req.body.historia,
                        especie: req.body.especie,
                        sexo: req.body.sexo,
                        path: req.file.path,
                        fileName: req.file.filename
                    })
            } catch (e) {
                console.error(e);
            }
            finally {
                await client.close();
                res.redirect('/')
            }
     }});

app.get('/pesquisa',async function(req,res){
    try {
        await client.connect();
        const result = await client.db("myProject").collection("Pets").find().toArray()
        console.log(result)
        res.render('pesquisaPets.ejs',{pets: result})
    } catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
})

app.get('/pesquisa/:filtro',async function(req,res){
    try {
        await client.connect();
        const result = await client.db("myProject").collection("Pets").find({'especie': req.params.filtro}).toArray()
        console.log(result)
        res.render('pesquisaPets.ejs',{pets: result})
    } catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
})
app.get('/pets/:id',async function(req,res){
    try {
        await client.connect();
        var o_id = new mongodb.ObjectID(req.params.id);
        const result = await client.db("myProject").collection("Pets").findOne({ '_id': o_id });
        console.log(result)
        res.render('petInfo.ejs',{pet: result})
    } catch (e) {
        console.error(e);
    }  
    finally {
        await client.close();
    }
})
app.get('/noticias',async function(req,res){
    try {
        await client.connect();
        const result = await client.db("myProject").collection("Noticias").find().toArray()
        console.log(result)
        res.render('noticias.ejs',{noticias: result})
    } catch (e) {
        console.error(e);
    }  
    finally {
        await client.close();
    }
})
app.get('/noticia/:id',async function(req,res){
    try {
        await client.connect();
        var o_id = new mongodb.ObjectID(req.params.id);
        const result = await client.db("myProject").collection("Noticias").findOne({'_id': o_id})
        const comments = await client.db("myProject").collection("Comentarios").find({'from': req.params.id}).toArray()
        console.log(result)
        console.log(comments)
        if(inSession == true){
            res.render('page.ejs',{page: result, tipo:"noticia",comentarios: comments,userID: user._id})
        }else{
            res.render('page.ejs',{page: result, tipo:"noticia",comentarios: comments,userID: null})
        }
    } catch (e) {
        console.error(e);
    }  
    finally {
        await client.close();
    }
})
app.get('/dicas',async function(req,res){
    try {
        await client.connect();
        const result = await client.db("myProject").collection("Dicas").find().toArray()
        console.log(result)
        res.render('dicas.ejs',{dicas: result})
    } catch (e) {
        console.error(e);
    }  
    finally {
        await client.close();
    }
})
app.get('/cadastroNoticia',function(req,res){
    res.render('cadastroNoticia.ejs')
})
app.get('/cadastroDica',function(req,res){
    res.render('cadastroDica.ejs')
})
app.get('/dica/:id',async function(req,res){
    try {
        await client.connect();
        var o_id = new mongodb.ObjectID(req.params.id);
        const result = await client.db("myProject").collection("Dicas").findOne({'_id': o_id})
        const comments = await client.db("myProject").collection("Comentarios").find({'from': req.params.id}).toArray()
        console.log(result)
        console.log(comments)
        res.render('page.ejs',{page: result, tipo:"dica",comentarios: comments,Session: inSession,user: user})
        
    } catch (e) {
        console.error(e);
    }  
    finally {
        await client.close();
    }
})
app.post("/addNoticia",urlencodedParser,upload.single('file'),async function(req,res){
	if (req.file == null){
        res.redirect('/')
        console.log('não tem imagem bro')
    }else{
        try {
            await client.connect();
            await addNoticia(client,
                {
                    titulo: req.body.titulo,
                    conteudo: req.body.conteudo,
                    imagem: req.file.filename
                }
            );       
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
            res.redirect('/')
        }
    }
})
app.post("/addDica",urlencodedParser,upload.single('file'),async function(req,res){
	if (req.file == null){
        res.redirect('/')
        console.log('não tem imagem bro')
    }else{
        try {
            await client.connect();
            await addDica(client,
                {
                    titulo: req.body.titulo,
                    conteudo: req.body.conteudo,
                    imagem: req.file.filename
                }
            );       
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
            res.redirect('/')
        }
    }
})
app.get('/inicio',async function(req,res){
    try {
        await client.connect();
        const noticias = await client.db("myProject").collection("Noticias").find().toArray()
        const dicas = await client.db("myProject").collection("Dicas").find().toArray()
        const pets = await client.db("myProject").collection("Pets").find().toArray()
        res.render('inicio.ejs',{dicas: dicas,noticias: noticias,pets: pets})
    } catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
})
app.get('/adotar/:id',async function(req,res){
    if(inSession == true){
        try {
            await client.connect();
            var o_id = new mongodb.ObjectID(req.params.id);
            const PET = await client.db("myProject").collection("Pets").findOne({'_id':o_id})
            if(user.adopted == false){
                var u_id = new mongodb.ObjectID(user._id);
                await client.db("myProject").collection("Usuarios").updateOne({'_id':u_id},{$set: {'adopted':true}})
                user = await client.db("myProject").collection("Usuarios").findOne({'_id':u_id})
            }
            await adoptPet(client,{
                        nome: PET.nome,
                        fileName: PET.fileName,
                        AdoptedBy: user._id
            });
            await client.db("myProject").collection("Pets").deleteOne({'_id':o_id})
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
            res.redirect('/')
        }
    }else{
        res.redirect('/loginUsuario')
    }
})
app.post('/comentar/:sessao/:id',async function(req,res){
    if(inSession == true){
        try {
            await client.connect();
            if(req.body.conteudo.length){
                await addComment(client,
                    {
                        commentedBy: user._id,
                        userName: user.nome,
                        conteudo: req.body.conteudo,
                        sessao: req.params.sessao,
                        from: req.params.id
                    }
                );          
            }
            res.redirect(`/${req.params.sessao}/${req.params.id}`)
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
        }
    }else{
        res.redirect('/loginUsuario')
    }
    
})
app.get('/deleteCom/:infoId/:sessao/:id',async function(req,res){
    console.log("apagando")
    if(user._id == req.params.id){
        try {
            await client.connect();
            var o_id = new mongodb.ObjectID(req.params.id);
            await client.db("myProject").collection("Comentarios").deleteOne({'_id':o_id})
        } catch (e) {
            console.error(e);
        }
        finally {
            await client.close();
            res.redirect(`/${req.params.sessao}/${req.params.id}`)
        }
    }else{
        res.redirect(`/${req.params.sessao}/${req.params.infoId}`)
    }
})
app.listen(8081,function(){
    console.log("foi carai")
})