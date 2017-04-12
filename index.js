// Declarations...
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var exec = require('child_process').exec;
var os = require('os');


// Configure the application...
app.set('views', './views');
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// URL handlers...
app.get('/', function (req, res) {  
    res.render('index');
});
app.get('/pi/print', function (req, res) {
    var ip = os.networkInterfaces().eth0[0].address;
    res.redirect('https://'+ip+':631/jobs');
});
app.get('/pi/print/reset', function (req, res) {
    exec('systemd restart cupsd', function (err, stdout, stderr) {
        if (!err) { res.redirect('/'); }
        else { res.render('index', {error: 'Printer reset FAILED. Please try again.'}) }
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
});
app.post('/pi/scan', function (req, res) {
    var id = req.body.id;
    if (req.body.action === 'add') {
        exec('./scan-page.sh ' + id, function (err, stdout, stderr) {
            if (!err) {
                if (!id) {id = stdout;}
                res.render('scan', {
                    id: id, 
                    pages: req.body.pages + 1, 
                    total: req.body.total
                });
            }
            else { res.render('index', {error: 'No space left to scan pages.'}); }
        });
    } 
    else if (req.body.action === 'done') {
        exec('./clear-scan.sh ' + id, function (err, stdout, stderr) {
            res.redirect('/');
        });
    } 
    else if (req.body.action === 'pdf') {
        exec('./save-pdf.sh ' + id, function (err, stdout, stderr) {
            if (!err) {
                res.set('Content-Type', 'application/pdf');
                res.end(new Buffer(stdout, 'binary'));
            }
            else { res.render('index', {error: 'No pages were found.'}); }
        });
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
    exec('./scan-image.sh', function (err, stdout, stderr) {
        if (!err) {
            res.set('Content-Type', 'image/jpeg');
            res.end(new Buffer(stdout, 'binary'));
        }
        else { res.render('index', {error: 'No space left to scan the picture.'}); }
    });
});
app.get('/pi/scan/reset', function (req, res) {
    exec('systemd restart saned', function (err, stdout, stderr) {
        if (!err) { res.redirect('/'); }
        else { res.render('index', {error: 'Scanner reset FAILED. Please try again.'}); }
    });
});
app.use(express.static('static'));


// Run the web server.
app.listen(8080, '0.0.0.0');
