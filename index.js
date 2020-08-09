const express = require('express');
const Joi = require('@hapi/joi');
const app = express();
const Firebird = require('node-firebird');

var options = {};
 
options.host = '127.0.0.1';
options.port = 3050;
options.database = 'C:/DATOS TNS/COMERCIALMEYER2020.GDB';
options.user = 'SYSDBA';
options.password = 'masterkey';
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null;            // default
options.pageSize = 4096; 

app.use(express.json());

let clientes  = [];
let vehiculos = [];

app.get('/', (req, res) => {
    res.send('Agendamiento de citas.');
});

app.get('/api/clientes', (req, res) => {
    res.send(clientes);
});

//consulta del cliente
app.get('/api/clientes/:cedula',(req, res) => {
    
    clientes = [];

    Firebird.attach(options, function(err, db) {
 
        if (err)
            throw err;
    
        // db = DATABASE
        db.query('select first 5 nit,nombre,direcc1,email,telef1,terid from terceros where nit=?',req.params.cedula, function(err, result) {
            if (result != undefined)
            { 
                for (i=0; i< result.length ; i++){
                    /* string / text in firebird are converted to buffer objects by NodeJS. Those buffer are encoded in latin1, apparently the default character set of our DB */  
                    
                    var cliente = {
                        cedula: result[i].NIT.toString('latin1'),
                        nombre: result[i].NOMBRE.toString('latin1'),
                        direccion: result[i].DIRECC1.toString('latin1'),
                        email: result[i].EMAIL,
                        telefono: result[i].TELEF1.toString('latin1'),
                        id: result[i].TERID
                    };

                    clientes.push(cliente); 
                }   
                 
                if(clientes.length>0){
                    res.send(clientes); 
                }
                else
                {
                    res.status(404).send('El cliente no fue encontrado');  
                }       
            }
            else
            res.status(404).send('No hay resultados...');  
                db.detach();
        });
    });
});

//consulta del vehículo
app.get('/api/vehiculos/:placa',(req, res) => {
    
    vehiculos = [];

    Firebird.attach(options, function(err, db) {
 
        if (err)
            throw err;
    
        // db = DATABASE
        db.query("select m.motoid,m.placa,m.modelo,t.codigo||' - '||t.descrip as tipo,m.nromotor from moto m left join tipomoto t on m.tipomotoid=t.tipomotoid where m.placa=?",req.params.placa, function(err, result) {
            if (result != undefined)
            { 
                for (i=0; i< result.length ; i++){
                    /* string / text in firebird are converted to buffer objects by NodeJS. Those buffer are encoded in latin1, apparently the default character set of our DB */  
                    
                    var vehiculo = {
                        id: result[i].MOTOID,
                        placa: result[i].PLACA.toString('latin1'),
                        modelo: result[i].MODELO.toString('latin1'),
                        tipo: result[i].TIPO.toString('latin1'),
                        nromotor: result[i].NROMOTOR.toString('latin1')
                    };

                    vehiculos.push(vehiculo); 
                }   
                 
                if(vehiculos.length>0){
                    res.send(vehiculos); 
                }
                else
                {
                    res.status(404).send('El vehiculo no fue encontrado');  
                }       
            }
            else
            res.status(404).send('No hay resultados...'); 
                db.detach();
        });
    });
});

app.post('/api/clientes', (req, res) => {

    const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    });
    const {error, value} = validarUsuario(req.body.nombre);
    if(!error){
        const usuario = {
            cedula: clientes.length + 1,
            nombre: value.nombre
        };
        clientes.push(usuario);
        res.send(usuario);
    }else{
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
    }   
    
    
});

app.put('/api/clientes/:cedula', (req, res) => {
  
    let usuario = existeUsuario(req.params.id);
    if(!usuario){
        res.status(404).send('El cliente no fue encontrado');
        return;
    }    
    
    const {error, value} = validarUsuario(req.body.nombre);    
    if(error){
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
        return;
    }

    usuario.nombre = value.nombre;
    res.send(usuario);
});

app.delete('/api/clientes/:cedula', (req, res) => {
    let usuario = existeUsuario(req.params.cedula);
    if(!usuario){
        res.status(404).send('El usuario no fue encontrado');
        return;
    }

    const index = clientes.indexOf(usuario);
    clientes.splice(index, 1);

    res.send(usuario);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}...`);
})

function existeUsuario(cedula){
    return(clientes.find(u => u.cedula === parseInt(cedula)));
}

function validarUsuario(nom){
    const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    });
    return (schema.validate({ nombre: nom }));
}