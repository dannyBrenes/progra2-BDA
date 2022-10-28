var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
const neo4j = require('neo4j-driver')

var app = express();

//View engine

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'))
const session = driver.session()

app.listen(3000);
console.log('El servidor esta en el puerto 3000');

// Muestra el menú de inicio del programa
app.get('/', function (req, res) {
    res.render('menuInicio')
})

// Muestra todos los clientes registrados
app.get('/mostrarClientes', function (req, res) {
    session
        .run('MATCH (n:Cliente) RETURN n')
        .then(function (result) {
            var clientesArr = [];
            result.records.forEach(function (record) {
                clientesArr.push({
                    id: record._fields[0].properties.id,
                    first_name: record._fields[0].properties.first_name,
                    last_name: record._fields[0].properties.last_name
                });
            });
            res.render('index', {
                clientes: clientesArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Crea un nuevo cliente en la base de datos
app.post('/crearClientes', function (req, res) {
    var id = req.body.id;
    var name = req.body.first_name;
    var lastname = req.body.last_name;
    session
        .run('CREATE (c:Cliente {id:$idParam,first_name:$nameParam,last_name:$lastnameParam}) RETURN c',
            { idParam: id, nameParam: name, lastnameParam: lastname })
        .then(function (result) {
            res.redirect('/mostrarClientes');
        })
        .catch(function (err) {
            console.log(err)
        })
})

// Buscar un cliente especifico en la base de datos
app.post('/buscarCliente', function (req, res) {
    var name = req.body.first_name;
    var lastname = req.body.last_name;
    session
        .run('MATCH (n:Cliente{first_name:$firstNameParam,last_name:$lastNameParam}) RETURN n', { firstNameParam: name, lastNameParam: lastname })
        .then(function (result) {
            var clientesArr = [];
            result.records.forEach(function (record) {
                clientesArr.push({
                    id: record._fields[0].properties.id,
                    first_name: record._fields[0].properties.first_name,
                    last_name: record._fields[0].properties.last_name
                });
            });
            res.render('index', {
                clientes: clientesArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Elimina un cliente especifico en la base de datos
app.post('/eliminarCliente', function (req, res) {
    var id = req.body.id;
    session
        .run('MATCH (n:Cliente{id:$idParam})-[r:Compra]-() DELETE r,n', { idParam: id })
        .then(function (result) {
            res.redirect('/mostrarClientes');
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Edita la informacion de un cliente especifico
app.post('/editarCliente', function (req, res) {
    var id = req.body.id;
    var name = req.body.first_name;
    var lastname = req.body.last_name;
    session
        .run('MATCH (c:Cliente {id:$idParam}) set c={id:$idParam,first_name:$nameParam,last_name:$lastnameParam} RETURN c',
            { idParam: id, nameParam: name, lastnameParam: lastname })
        .then(function (result) {
            res.redirect('/mostrarClientes');
        })
        .catch(function (err) {
            console.log(err)
        })
})

// Muestra todas las compras realizadas
app.get('/view/registroCompras', function (req, res) {
    session
        .run('match (n:Cliente)-[r:Compra]-(p:Producto) return n.id,r,p.id')
        .then(function (result) {
            var comprasArr = [];
            result.records.forEach(function (record) {
                console.log(record._fields[1].properties.cantidad)
                comprasArr.push({
                    idCliente: record._fields[0],
                    idProducto: record._fields[2],
                    cantidad: record._fields[1].properties.cantidad
                });
            });
            res.render('indexPrueba', {
                compras: comprasArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Registra una nueva compra
app.post('/generarCompras', function (req, res) {
    var idCliente = req.body.idCliente;
    var idProducto = req.body.idProducto;
    var cantidad = req.body.cantidad;
    session
        .run('MATCH (c:Cliente {id:$idClienteParam}),(p:Producto {id:$idProductoParam}) CREATE (c)-[r:Compra {cantidad:$cantidadParam}]->(p)', { idClienteParam: idCliente, idProductoParam: idProducto, cantidadParam: cantidad })
        .then(function (result) {
            res.redirect('/view/registroCompras');
        })
        .catch(function (err) {
            console.log(err)
        })
})

// Muestra las compras realizadas por un cliente especifico
app.post('/buscarCompra', function (req, res) {
    var idCliente = req.body.idCliente;
    session
        .run('MATCH (n:Cliente)-[r:Compra]-(p:Producto) WHERE n.id=$idClienteParam RETURN n.first_name, p.nombre, r.cantidad', { idClienteParam: idCliente })
        .then(function (result) {
            var comprasArr = [];
            result.records.forEach(function (record) {
                comprasArr.push({
                    idCliente: record._fields[0],
                    idProducto: record._fields[1],
                    cantidad: record._fields[2]
                });
            });
            res.render('indexPrueba', {
                compras: comprasArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra todos los clientes que hayan comprado un producto especifico
app.post('/view/consultas/productoComun', function (req, res) {
    var idProducto = req.body.idProducto;
    session
        .run('MATCH (n:Cliente)-[r:Compra]-(p:Producto) WHERE p.id=$idProductoParam RETURN n.first_name, p.nombre, r.cantidad', { idProductoParam: idProducto })
        .then(function (result) {
            var comprasArr = [];
            result.records.forEach(function (record) {
                console.log(record._fields)
                comprasArr.push({
                    idCliente: record._fields[0],
                    idProducto: record._fields[1],
                    cantidad: record._fields[2]
                });
            });
            res.render('indexPrueba', {
                compras: comprasArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra las marcas existentes
app.get('/mostrarMarcas', function (req, res) {
    session
        .run('MATCH (n:Marca) RETURN n')
        .then(function (result) {
            var marcasArr = [];
            result.records.forEach(function (record) {
                console.log(record._fields[0].properties)
                marcasArr.push({
                    id: record._fields[0].properties.id,
                    nombre: record._fields[0].properties.nombre,
                    pais: record._fields[0].properties.pais
                });
            });
            res.render('indexMarcas', {
                marcas: marcasArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra menu de consultas disponibles
app.get('/view/mostrarConsultas', function (req, res) {
    res.render('indexConsultas')
})

// Muestra consulta de top cinco productos vendidos
app.get('/view/consultas/top5Productos', function (req, res) {
    session
        .run('match(x:Cliente)-[r:Compra]->(y:Producto) return y as Productos_Mayor_Cantidad_Vendidas, sum(toInteger(r.cantidad)) as Cantidad_Compras order by Cantidad_Compras desc limit 5')
        //.run('match (n:Cliente)-[r:Compra]-(p:Producto) return p as Productos_Mayor_Cantidad_Vendidas, count(*) as Unidades_Vendidas order by Unidades_Vendidas desc limit 5')
        .then(function (result) {
            var productosArr = [];
            result.records.forEach(function (record) {
                productosArr.push({
                    nombre: record._fields[0].properties.nombre,
                    marca: record._fields[0].properties.marca,
                    precio: record._fields[0].properties.precio
                });
            });
            res.render('consultaTopProductos', {
                productos: productosArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra consulta de top cinco mejores clientes
app.get('/view/consultas/top5Clientes', function (req, res) {
    session
        //.run('match(x:Cliente)-[r:Compra]->(y:Producto) return x as Clientes_Mayor_Cantidad_Compras, count(*) as Cantidad_Compras order by Cantidad_Compras desc limit 5')
        .run('match(x:Cliente)-[r:Compra]->(y:Producto) return x as Clientes_Mayor_Cantidad_Compras, sum(toInteger(r.cantidad)) as Cantidad_Compras order by Cantidad_Compras desc limit 5')
        .then(function (result) {
            var clientesArr = [];
            result.records.forEach(function (record) {
                clientesArr.push({
                    id: record._fields[0].properties.id,
                    first_name: record._fields[0].properties.first_name,
                    last_name: record._fields[0].properties.last_name
                });
            });
            res.render('consultaTopClientes', {
                clientes: clientesArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra consulta de top cinco mejores marcas
app.get('/view/consultas/top5Marcas', function (req, res) {
    session
        //.run('match (c:Cliente)-[r:Compra]-(p:Producto) return p.marca as marca, count(p.marca) as count order by count desc limit 5')
        .run('match(x:Cliente)-[r:Compra]->(y:Producto) return y.marca as Marcas_Mayor_Cantidad_Vendidas, sum(toInteger(r.cantidad)) as Unidades_Vendidas order by Unidades_Vendidas desc limit 5')
        .then(function (result) {
            var marcasArr = [];
            result.records.forEach(function (record) {
                marcasArr.push({
                    nombre: record._fields[0],
                    cantidad: record._fields[1].low,
                });
            });
            res.render('consultaTopMarcas', {
                marcas: marcasArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra la consulta especializada dos
app.post('/view/consultas/especializada2', function (req, res) {
    var idCliente = req.body.id;
    session
        .run('match(cli1:Cliente)--(prod)--(cli2:Cliente) where cli1.id=$idClienteParam with count(distinct prod) as suma, cli2 as cli2, collect( prod.nombre) as prod where suma>1 return cli2.first_name,suma,prod', { idClienteParam: idCliente })
        .then(function (result) {
            var comprasArr = [];
            result.records.forEach(function (record) {
                console.log(record)
                comprasArr.push({
                    Cliente: record._fields[0],
                    Producto: record._fields[2]
                });
            });
            res.render('consultaEspecializada2', {
                clientes: comprasArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Muestra todos los productos registrados
app.get('/view/mostrarCatalogo', function (req, res) {
    session
        .run('MATCH (n:Producto) RETURN n')
        .then(function (result) {
            var CatalogoArr = [];
            result.records.forEach(function (record) {
                CatalogoArr.push({
                    id: record._fields[0].properties.id,
                    nombre: record._fields[0].properties.nombre,
                    marca: record._fields[0].properties.marca,
                    precio: record._fields[0].properties.precio

                });
            });
            session
                .run('MATCH (n:Marca) RETURN n.nombre')
                .then(function (result2) {
                    var MarcasArr = [];
                    result2.records.forEach(function (record) {
                        MarcasArr.push({
                            nombre: record._fields[0]
                        });
                    });
                    res.render('indexCatalogo', {
                        objCatalogo: CatalogoArr,
                        marcas: MarcasArr
                    });
                })

        })
        .catch(function (err) {
            console.log(err);
        })
})

// Crea un nuevo producto
app.post('/crearProducto', function (req, res) {
    var id = req.body.id;
    var nombre = req.body.nombre;
    var marca = req.body.marca;
    var precio = req.body.precio;
    console.log(req.body);
    session
        .run('CREATE (p:Producto {id:$idParam,nombre:$nombreParam,marca:$marcaParam,precio:$precioParam}) RETURN p',
            { idParam: id, nombreParam: nombre, marcaParam: marca, precioParam: precio })
        .then(function (result) {
            res.redirect('/view/mostrarCatalogo');
        })
        .catch(function (err) {
            console.log(err)
        })
})

// Busca un producto en específico
app.post('/buscarProducto', function (req, res) {
    var id = req.body.id;
    session
        .run('MATCH (n:Producto{id:$idParam}) RETURN n', { idParam: id })
        .then(function (result) {
            var CatalogoArr = [];
            result.records.forEach(function (record) {
                //console.log(record._fields[0].properties)
                CatalogoArr.push({
                    id: record._fields[0].properties.id,
                    nombre: record._fields[0].properties.nombre,
                    marca: record._fields[0].properties.marca,
                    precio: record._fields[0].properties.precio
                });
            });
            res.render('indexCatalogo', {
                objCatalogo: CatalogoArr
            });
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Elimina un producto específico
app.post('/eliminarProducto', function (req, res) {
    var id = req.body.id;
    session
        //.run('MATCH (n:Producto{id:$idParam})-[r:Compra]-() DELETE r,n',{idParam:id})
        .run('MATCH (n:Producto{id:$idParam}) DELETE n', { idParam: id })
        .then(function (result) {
            res.redirect('/view/mostrarCatalogo');
        })
        .catch(function (err) {
            console.log(err);
        })
})

// Edita un producto específico
app.post('/editarProducto', function (req, res) {
    var id = req.body.id;
    var nombre = req.body.nombre;
    var marca = req.body.marca;
    var precio = req.body.precio;
    session
        .run('MATCH (c:Producto {id:$idParam}) set c={id:$idParam,nombre:$nombreParam,marca:$marcaParam,precio:$precioParam} RETURN c',
            { idParam: id, nombreParam: nombre, marcaParam: marca, precioParam: precio })
        .then(function (result) {
            res.redirect('/view/mostrarCatalogo');
        })
        .catch(function (err) {
            console.log(err)
        })
})

// Funcion que carga el archivo sobre los clientes
const cargarClientes = () => {
    session
        .run(`LOAD CSV WITH HEADERS FROM 'file:///Clientes.csv' AS clientes CREATE (cliente:Cliente {id:clientes.id ,last_name:clientes.last_name,first_name:clientes.first_name})`)
        .then(function (result) {
            console.log("Se agrego el archvio con exito")
            res.redirect('/');
        })
        .catch(function (err) {
            console.log(err)
        })
}

// Funcion que carga el archivo sobre los productos
const cargarProductos = () => {
    session
        .run(`LOAD CSV WITH HEADERS FROM 'file:///Productos.csv' AS productos CREATE (producto:Producto {id:productos.id ,nombre:productos.nombre,marca:productos.marca,precio:productos.precio})`)
        .then(function (result) {
            console.log("Se agrego el archvio con exito")
            res.redirect('/');
        })
        .catch(function (err) {
            console.log(err)
        })
}

// Funcion que carga el archivo sobre las marcas
const cargarMarcas = () => {
    session
        .run(`LOAD CSV WITH HEADERS FROM 'file:///Marcas.csv' AS marcas CREATE (marca:Marca {id:marcas.id ,nombre:marcas.nombre,pais:marcas.pais})`)
        .then(function (result) {
            console.log("Se agrego el archvio con exito")
            res.redirect('/');
        })
        .catch(function (err) {
            console.log(err)
        })
}

// Funcion que carga el archivo sobre las compras
const cargarCompras = () => {
    session
        .run(`LOAD CSV WITH HEADERS FROM 'file:///Compras.csv' AS compras MATCH (c:Cliente {id:compras.idCliente}),(p:Producto {id:compras.idProducto}) CREATE (c)-[r:Compra {cantidad:compras.cantidad}]->(p)`)
        .then(function (result) {
            console.log("Se agrego el archvio con exito")
            res.redirect('/');
        })
        .catch(function (err) {
            console.log(err)
        })
}

// Obtiene el nombre del archivo escogido 
app.post('/cargarArchivos', function (req, res) {
    console.log(req.body.archivo)
    var archivo = req.body.archivo
    if (archivo == "Clientes.csv") {
        setTimeout(cargarClientes, 0000);
    }
    else if (archivo == "Marcas.csv") {
        setTimeout(cargarMarcas, 0000);
    }
    else if (archivo == "Productos.csv") {
        setTimeout(cargarProductos, 0000);
    }
    else if (archivo == "Compras.csv") {
        setTimeout(cargarCompras, 0000);
    }
    else {
        console.log("No se puede subir este archivo")
        res.redirect('/')
    }
})
module.exports = app;