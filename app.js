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

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'))
const session = driver.session()

app.listen(3000);
console.log('El servidor esta en el puerto 3000');

// Muestra todos los clientes registrados
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

// Crea un nuevo cliente en la base de datos
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

// Buscar un cliente especifico en la base de datos
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

// Elimina un cliente especifico en la base de datos
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

// Edita la informacion de un cliente especifico
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

// Muestra las compras realizadas
app.get('/view/registroCompras',function(req,res){
    session
        .run('match (n:Cliente)-[r:Compra]-(p:Producto) return n.id,r,p.id')
        .then(function(result){
            var comprasArr = [];
            result.records.forEach(function(record){
                console.log(record._fields[1].properties.cantidad)
                comprasArr.push({
                    idCliente: record._fields[0],
                    idProducto: record._fields[2],
                    cantidad: record._fields[1].properties.cantidad
                });
            });
            res.render('indexPrueba',{
                compras: comprasArr
            });
        })
        .catch(function(err){
            console.log(err);
        })
})

// Registra una nueva compra
app.post('/generarCompras',function(req,res){
    var idCliente = req.body.idCliente;
    var idProducto = req.body.idProducto;
    var cantidad = req.body.cantidad;
    session
        .run('MATCH (c:Cliente {id:$idClienteParam}),(p:Producto {id:$idProductoParam}) CREATE (c)-[r:Compra {cantidad:$cantidadParam}]->(p)',{idClienteParam:idCliente,idProductoParam:idProducto,cantidadParam:cantidad})
        .then(function(result){
            res.redirect('/view/registroCompras');
        })
        .catch(function(err){
            console.log(err)
        })
})

// Muestra las compras realizadas por un cliente especifico
app.post('/buscarCompra',function(req,res){
    var idCliente = req.body.idCliente;
    session
        .run('MATCH (n:Cliente)-[r:Compra]-(p:Producto) WHERE n.id=$idClienteParam RETURN n.first_name, p.nombre, r.cantidad',{idClienteParam:idCliente})
        .then(function(result){
            var comprasArr = [];
            result.records.forEach(function(record){
                console.log(record._fields)
                comprasArr.push({
                    idCliente: record._fields[0],
                    idProducto: record._fields[1],
                    cantidad: record._fields[2]
                });
            });
            res.render('indexPrueba',{
                compras: comprasArr
            });
        })
        .catch(function(err){
            console.log(err);
        })
})

// Muestra todos los clientes que hayan comprado un producto especifico
app.post('/view/consultas/productoComun',function(req,res){
    var idProducto = req.body.idProducto;
    session
        .run('MATCH (n:Cliente)-[r:Compra]-(p:Producto) WHERE p.id=$idProductoParam RETURN n.first_name, p.nombre, r.cantidad',{idProductoParam:idProducto})
        .then(function(result){
            var comprasArr = [];
            result.records.forEach(function(record){
                console.log(record._fields)
                comprasArr.push({
                    idCliente: record._fields[0],
                    idProducto: record._fields[1],
                    cantidad: record._fields[2]
                });
            });
            res.render('indexPrueba',{
                compras: comprasArr
            });
        })
        .catch(function(err){
            console.log(err);
        })
})

module.exports = app;