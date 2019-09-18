//Funkcja wzbogacająca console.log o tytuł
function clog(text,num)
{
    var labels = [ "[Server]  ", "[Database]" ];
    console.log(labels[num] + " " + text + ".");
}

//Prototyp funkcji określający czy wartość numeryczna znajduje się pomiędzy dwoma liczbami
Number.prototype.between = function(a, b) {
    var min = Math.min(a, b),
      max = Math.max(a, b);
  
    return this > min && this < max;
  };

//Moduł - obecny czas przy logach w konsoli
require('console-stamp')(console, 'HH:MM:ss');
//Moduł express
const express = require('express');
//Testowanie HTTP
const request = require('supertest');
//Moduł bodyparser
const bodyParser = require('body-parser');
//Zmienna aplikacji expreess
var app = express();
//www-url-form-encoded - bodyparser
app.use(bodyParser.urlencoded({ extended: true }));
//Moduł MYSQL
const mysql = require('mysql');
//moduł JSON Web Token
const jwt = require('jwt-simple');
//Moduł crypto
const crypto = require('crypto');


//app.use(function(req,res,next){setTimeout(next,1000)});
//CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
  });

//Hashowanie hasła w czystej formie
function hashplainpassword(param)
{
    var hashed = crypto.createHmac('sha256','top-secret-salt').update(param).digest('hex');
    return hashed;
}
//Port aplikacji - 1. parametr, 2. zmienna środowiskowa, 3. port domyślny
var broadcastport = process.argv[2] || process.env.PORT || 8080;

//Konfiguracja
var config = require('./config.js');

//Dane do połączenia z bazą
var dbconnection = mysql.createConnection(config.dbOptions);
//Nazwa bazy danych
const dbname = config.dbname;

//Utworzenie bazy danych
function createDB()
{
    dbconnection.query("CREATE DATABASE IF NOT EXISTS " + dbname, function (err, result) {
        if (err) throw err;
        clog("Database is ready", 1);

    });

    dbconnection.query("USE " + dbname, function (err, result) {
        if (err) throw err;
        clog("Database is ready", 1);

    });
    
}

//Utworzenie tabel users i list
function createTable()
{
    //Tabela users
    dbconnection.query("CREATE TABLE IF NOT EXISTS `users` ( `id` INT NOT NULL AUTO_INCREMENT , `username` TEXT NOT NULL , `password` TEXT NOT NULL , PRIMARY KEY (`id`))", function (err, result) {
        if (err) throw err;
          clog("Table 'users' is ready", 1);

    });

    //Tabela list
    dbconnection.query("CREATE TABLE IF NOT EXISTS `list` ( `id` INT NOT NULL AUTO_INCREMENT , `name` TEXT NOT NULL , PRIMARY KEY (`id`))", function (err, result) {
        if (err) throw err;
        dbconnection.query("ALTER TABLE `list` CHANGE `name` `name` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL",function (err, result) 
        {
            if (err) throw err;
            clog("Table 'list' is ready", 1);
        })

    });

}

//Liczba rekordów w tabeli user
function countUsers()
{
    dbconnection.query("SELECT COUNT(*) as cnt FROM users;", function (err, result) {
        var usercount = 0;
        if(typeof result[0] !== 'undefined')
        {
            usercount = result[0].cnt;
        }
        clog("Users loaded: " +  usercount, 1)

      });
}

//Dodanie użytkownika do bazy - rejestracja
function addUser(params)
{
    dbconnection.query("INSERT INTO `users` (`id`, `username`, `password`) VALUES (NULL, '" + params.body.username + "', '" + params.body.password + "');", function (err, result) {
        clog("User successfully added", 1)
      });
}


//Sprawdzenie czy nazwa użytkownika jest już w bazie - rejestracja
function checkifUserExists(params,callback)
{
    var returnvalue;
    dbconnection.query("SELECT * FROM users WHERE username='" + params.username + "'", function (err, result) {
        if(typeof result[0] !== 'undefined')
        {
            returnvalue = true;
        }
        else
        {
            returnvalue = false;
        }
        callback(returnvalue);
      });
}

//Funkcja odpowiadająca za rejestrację użytkownika
function registerUser(params,callback)
{
    if (
        //Czy zapytanie nie jest puste
        (params.body.username && params.body.password) !== undefined &&
        //Czy username i password jest w zakresie od 3 do 30 znaków
        ((params.body.username.length.between(2,31)) && (params.body.password.length.between(2,31))) == true
       )
    {
        clog("New register request",0);
        checkifUserExists(params.body, function(istaken)
        {
            if(istaken == false)
            {
                params.body.password = hashplainpassword(params.body.password);
                addUser(params);
                callback(200);             
            }
            else
            {
                callback(409);
            }
        });
    }
    else
    {
        callback(409);
    }
}

//Secret Tokena
var secrettoken = Buffer.from('fe1a1915a379f3be5394b64d14794932', 'hex');

//Tworzenie tokenu z nazwą użytkownika
function makeToken(params)
{
    var payload = { username: params.body.username };

    var token = jwt.encode(payload, secrettoken, 'HS512');
    return token;
}

//Sprawdzanie tokenu
function checkToken(token, callback)
{
    try {
        var decoded = jwt.decode(token,secrettoken,false);
    } catch (error) {
        clog(error,0);
        callback(false);
    }
    checkifUserExists(decoded, function(exists)
    {
        if(exists)
        {
            callback(true);
        }
        else
        {
            callback(false);
        }
    })
}
//Funkcja odpowiadająca za sprawdzenie poprawności danych logowania i utworzenie tokenu użytkownika
function loginUser(params,callback)
{
    if((params.body.username && params.body.password) !== undefined)
    {
        dbconnection.query("SELECT EXISTS ( SELECT * FROM users WHERE username = '" + params.body.username + "' AND password = '" + hashplainpassword(params.body.password) + "' ) as cnt", function (err, result) {

            if(result[0].cnt == 1)
            {

                var token = makeToken(params);
                callback(token);
            }
            else
            {
                callback();
            }
          });
    }
    else
    {
        callback();
    }
}

//Połączenie z bazą danych , utworzenie struktur
dbconnection.connect(function(err) {
    if(err) switch (err.errno)
    {
        case 'ECONNREFUSED':
            clog("Connection to the database has been refused",1);
            setInterval(function(){ console.log('2222'); }, 3000);
            break;
        default:
            break;
    }
    if (err) throw err;
    clog("Connected",1);
    createDB();
    createTable();
    countUsers();


});

//REST API /register
app.post('/register', function handler(req, res)
{
    registerUser(req, function(status)
    {
        res.sendStatus(status);
    });
})


//REST API /login
app.post('/login', function handler(req, res)
{
    loginUser(req, function(token)
    {
        if(token !== undefined)
        {
            res.send({"token": token});
        }
        else
        {
            res.sendStatus(409);
        }
    });
})

function getList(params,callback)
{
    if(params.header('token') !== undefined)
    {
        checkToken(params.header('token'), function(returnvalue)
        {
            if(returnvalue == true)
            {
                dbconnection.query("SELECT * FROM list ", function (err, result) {
                    var data = JSON.stringify(result);
                    callback(data);
                  });
            }
            else
            {
                callback();
            }
            
        })
    }
    else
    {
        callback();
    }
}

function getListID(params,callback)
{
    if(params.header('token') !== undefined)
    {
        checkToken(params.header('token'), function(returnvalue)
        {
        dbconnection.query("SELECT * FROM list WHERE id = '" + params.params.id + "'", function (err, result) {
            var data = JSON.stringify(result);
            callback(data);
          });
        })
    }
    else
    {
        callback();
    }
}
app.get('/list', function handler(req, res)
{
    getList(req, function(data)
    {
        if(data !== undefined)
        {
            res.send(data);
        }
        else
        {
            res.sendStatus(409);
        }
    })
})

app.get('/list/:id', function handler(req, res)
{
    getListID(req, function(data)
    {
        if(data !== undefined)
        {
            res.send(data);
        }
        else
        {
            res.sendStatus(409);
        }
    })
})

function addtoList(params,callback)
{
    if(params.body.name !== undefined && (params.body.name.length > 0))
    {
        checkToken(params.header('token'), function(returnvalue)
        {
            if(returnvalue == true)
            {
                dbconnection.query("INSERT INTO `list` (`id`, `name`) VALUES (NULL, '" + params.body.name + "');", function (err, result) {
                    callback(200);
                  });
            }
            else
            {
                callback(409);
            }
            
        })
    }
    else
    {
        callback(409);
    }
}

app.post('/list', function handler(req, res)
{
    addtoList(req, function(status)
    {
        res.sendStatus(status);
    });
})


function changeListID(params,callback)
{
    if(params.header('token') !== undefined)
    {
        checkToken(params.header('token'), function(returnvalue)
        {
        dbconnection.query("UPDATE `list` SET `name` = '" + params.body.name + "' WHERE `list`.`id` = " + params.params.id + "", function (err, result) {
            callback(200);
          });
        })
    }
    else
    {
        callback(409);
    }
}

app.put('/list/:id', function handler(req, res)
{
    changeListID(req, function(status)
    {
        res.sendStatus(status);
    });
})

function deleteList(params,callback)
{
    if(params.header('token') !== undefined)
    {
        checkToken(params.header('token'), function(returnvalue)
        {
        dbconnection.query("DELETE FROM list", function (err, result) {
            callback(200);
          });
        })
    }
    else
    {
        callback(409);
    }
}

app.delete('/list', function handler(req, res)
{
    deleteList(req, function(status)
    {
        res.sendStatus(status);
    });
})

function deleteListID(params,callback)
{
    if(params.header('token') !== undefined)
    {
        checkToken(params.header('token'), function(returnvalue)
        {
        dbconnection.query("DELETE FROM list WHERE id = " + params.params.id + "", function (err, result) {
            callback(200);
          });
        })
    }
    else
    {
        callback(409);
    }
}

app.delete('/list/:id', function handler(req, res)
{
    deleteListID(req, function(status)
    {
        res.sendStatus(status);
    });
})

//Zmienna serwera aplikacji
var serv = app.listen(broadcastport);

//Callback - serwer nasłuchuje
serv.on('listening', function(err)
{
    clog('App is running on port ' + broadcastport, 0);
});

//Callback - błąd serwera
serv.on('error', function(err)
{
    if(err.errno == 'EADDRINUSE')
    {
        clog('App cannot be run on port ' + broadcastport, 0);
        throw err;
    }
});


function TDDRest()
{
  request(app).post('/login').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).post('/register').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).get('/list').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).get('/list/:id').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).post('/list').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).put('/list/:id').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).delete('/list').expect(409).end(function(err, res) {
    if (err) throw err;
  });
  request(app).delete('/list/:id').expect(409).end(function(err, res) {
    if (err) throw err;
  });

}

TDDRest();