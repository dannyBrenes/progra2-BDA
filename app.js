var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser= require('body-parser');
const  neo4j = require('neo4j-driver')

var app = express();

//View engine

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('BDA', '123456'))
const session = driver.session()

app.listen(3000);
console.log('El servidor esta en el puerto 3000');

app.get('/',function(req,res){
    session
        .run('MATCH (n:Cliente) RETURN n')
        .then(function(result){
            var clientesArr = [];
            result.records.forEach(function(record){
                clientesArr.push({
                    id: record._fields[0].properties.id,
                    first_name: record._fields[0].properties.first_name,
                    last_name: record._fields[0].properties.last_name 
                });
            });
            res.render('index',{
                clientes: clientesArr
            });
        })
        .catch(function(err){
            console.log(err);
        })
})

app.post('/crearClientes',function(req,res){
    var id = req.body.id;
    var name = req.body.first_name;
    var lastname = req.body.last_name;
    session
        .run('CREATE (c:Cliente {id:$idParam,first_name:$nameParam,last_name:$lastnameParam}) RETURN c',
            {idParam:id,nameParam:name,lastnameParam:lastname})
        .then(function(result){
            res.redirect('/');
        })
        .catch(function(err){
            console.log(err)
        })
})

app.post('/buscarCliente',function(req,res){
    var id = req.body.id;
    session
        .run('MATCH (n:Cliente{id:$idParam}) RETURN n',{idParam:id})
        .then(function(result){
            var clientesArr = [];
            result.records.forEach(function(record){
                clientesArr.push({
                    id: record._fields[0].properties.id,
                    first_name: record._fields[0].properties.first_name,
                    last_name: record._fields[0].properties.last_name 
                });
            });
            res.render('index',{
                clientes: clientesArr
            });
        })
        .catch(function(err){
            console.log(err);
        })
})

app.post('/eliminarCliente',function(req,res){
    var id = req.body.id;
    session
        .run('MATCH (n:Cliente{id:$idParam})-[r:Compra]-() DELETE r,n',{idParam:id})
        .then(function(result){
            res.redirect('/');
        })
        .catch(function(err){
            console.log(err);
        })
})

app.post('/editarCliente',function(req,res){
    var id = req.body.id;
    var name = req.body.first_name;
    var lastname = req.body.last_name;
    session
        .run('MATCH (c:Cliente {id:$idParam}) set c={id:$idParam,first_name:$nameParam,last_name:$lastnameParam} RETURN c',
            {idParam:id,nameParam:name,lastnameParam:lastname})
        .then(function(result){
            res.redirect('/');
        })
        .catch(function(err){
            console.log(err)
        })
})

module.exports = app;