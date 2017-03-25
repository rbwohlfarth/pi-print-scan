// Declarations...
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var exec = require('child_process').exec;
var fs = require('fs');
var os = require('os');
var path = require('path');
var temp = require('temp');

var scans = path.join('', 'home', 'pi', 'Documents');


// Configure the application...
app.set('views', './views');
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


// URL handlers...
app.get('/', function (req, res) {  
    res.render('index', {ip: os.networkInterfaces().eth0[0].address});
});
app.get('/pi/print', function (req, res) {
    var ip = os.networkInterfaces().eth0[0].address;
    res.redirect('https://'+ip+':631/printers/HP_Deskjet_1510_series');
});
app.get('/pi/print/reset', function (req, res) {
    exec('systemd restart cupsd', function (err, stdout, stderr) {
        if (!err) {
            res.redirect('/');
        }
        else {
            res.render('index', {error: 'Printer reset FAILED. Please try again.'})
        }
    });
});
app.get('/pi/reset', function (req, res) {
    exec('sudo reboot now', function (err, stdout, stderr) {
        if (!err) { res.redirect('/'); }
        else { res.render('index', {error: 'Reboot FAILED. Please try again.'}) }
    });
});
app.get('/pi/scan', function (req, res) {
    res.render('scan', {pages: 0, total: null});
    //fs.readdir(scans, function (err, items) {
    //    for (var i=0; i<items.length; i++) {
    //        fs.stat(scans+items[i], function (err, stats) {
    //           stats.mtime 
    //        });
    //    }
    //});
    //scanimage --resolution 600 >out.pnm
    //gm convert out.pnm out.pdf
});
app.post('/pi/scan', function (req, res) {
    if (req.body.action === 'add') {
        var id = req.body.id;
        if (!id) {
            temp.mkdir({
                dir: scans,
                prefix: 'pi-print-scan'
            }, function (err, info) {
                if (!err) {
                    id = path.basename(info);
                }
                else {
                    res.render('scan', {
                        error: 'No space left for scanning.',
                        pages: req.body.pages,
                        total: req.body.total
                    });
                }
            });
        }
        
        temp.open({
            dir: path.join(scans, id),
            prefix: 'pi-print-scan-image',
            suffix: 'pnm'
        }, function (err, info) {
            if (!err) {
                exec('scanimage --resolution 600 >'+info.path, function (err, stdout, stderr) {
                    if (!err) {
                        var pages = parseInt(req.body.pages, 10);
                        res.render('scan', {
                            id: id, 
                            pages: pages + 1, 
                            total: req.body.total
                        });
                    }
                    else {
                        res.render('scan', {
                            error: 'No space left for scanning.',
                            id: id,
                            pages: req.body.pages,
                            total: req.body.total
                        });
                    }
                });
            }
            else {
                res.render('scan', {
                    error: 'No space left for scanning.',
                    id: id,
                    pages: req.body.pages,
                    total: req.body.total
                });
            }
        });
    } 
    else if (req.body.action === 'done') {
        if (req.body.id) {
            var dir = path.join(scans, req.body.id);
            fs.readdir(dir, function (err, items) {
                if (!err) {
                    for (var i = 0; i < items.length; i++) {
                        fs.unlink(items[i], null);
                    }
                    fs.rmdir(dir, null);
                    res.redirect('/');
                }
                else {
                    res.render('scan', {
                        error: 'Cannot find the scanned pages.',
                        id: id,
                        pages: req.body.pages,
                        total: req.body.total
                    });
                }
            });
        }
        else { res.redirect('/'); }
    } 
    else if (req.body.action === 'pdf') {
        if (req.body.id) {
            var dir = path.join(scans, req.body.id);
            fs.readdir(dir, function (err, items) {
                if (!err) {
                    for (var i = 0; i < items.length; i++) {
                        fs.unlink(items[i], null);
                    }
        //gm convert out.pnm out.pdf
        //send back the PDF
                }
                else {
                    res.render('scan', {
                        error: 'Cannot find the scanned pages.',
                        id: id,
                        pages: req.body.pages,
                        total: req.body.total
                    });
                }
            });
        }
        else { 
            res.render('scan', {
                error: 'Cannot find the scanned pages.',
                id: id,
                pages: req.body.pages,
                total: req.body.total
            });
        }
    }
    else {
        res.render('scan', {
            id: id, 
            pages: req.body.pages, 
            total: req.body.total
        });
    }
});
app.get('/pi/scan/image', function (req, res) {
    temp.open({
        dir: scans,
        prefix: 'pi-print-scan-image',
        suffix: 'pnm'
    }, function (err, info) {
        if (!err) {
            fs.close(info.fd, null);
            exec('scanimage --resolution 600 >'+info.path, function (err, stdout, stderr) {
                if (!err) {
                    var jpeg = info.path.replace(/\.pnm$/i, '.jpg');
                    exec('gm convert '+jpeg, function (err, stdout, stderr) {
                        if (!err) {
                            var s = fs.createReadStream(jpeg);
                            s.on('open', function () {
                                res.set('Content-Type', 'image/jpeg');
                                s.pipe(res);
                            });
                            s.on('error', function () {
                                res.set('Content-Type', 'text/plain');
                                res.status(404).end('Not found');
                            });
                            s.on('close', function () {
                                fs.unlink(jpeg, null);
                                fs.unlink(info.path, null);
                            });
                        } else {
                            fs.unlink(info.path, null);
                            res.render('index', {
                                error: 'No space left for scanning.',
                                pages: req.body.pages,
                                total: req.body.total
                            });
                        }
                    });
                } else {
                    fs.unlink(info.path, null);
                    res.render('index', {
                        error: 'No space left for scanning.',
                        pages: req.body.pages,
                        total: req.body.total
                    });
                }
            });
        }
    });
});
app.get('/pi/scan/reset', function (req, res) {
    exec('systemd restart saned', function (err, stdout, stderr) {
        if (!err) { res.redirect('/'); }
        else { res.render('index', {error: 'Scanner reset FAILED. Please try again.'}) }
    });
});
app.use(express.static('static'));


// Run the web server.
app.listen(8080, '0.0.0.0');
