const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

const upload = multer({ storage: multer.memoryStorage() });
app.set('view engine', 'hbs')
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "sharkyXD",
    database: "lostandfound"
});

connection.connect((err) => {
    if(err){
        console.err("Connected error", err);
        return;
    }
    console.log("Connect to database success");
});

app.get('/upload', (req, res) => {
    res.render('upload');
})

function getThaiTimestamp() {
    const date = new Date();

    const options = {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const formattedDate = formatter.format(date);

    return formattedDate.replace(',', '');
}

app.post('/upload', upload.single('image'), (req, res) => {
    const {title, detail} = req.body;
    const image = req.file ? req.file.buffer.toString('base64') : null;
    const timeStamp = getThaiTimestamp()
    
    const query = "INSERT INTO founditem(title, detail, image, timeStamp) VALUES(?, ?, ?, ?)"
    connection.query(query, [title, detail, image, timeStamp], (err, results) => {
        if (err) throw err;
        console.log('Data inserted:', results);
    });

    res.redirect('/feed')
})

app.get('/feed', (req, res) => {
    const query = "SELECT * FROM founditem";
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Internal Server Error');
        }

        results.forEach(item => {
            if (item.image) {
                item.image = `data:image/jpeg;base64,${item.image}`;
            }
        });

        results.reverse()

        res.render('feed', { items: results });
    });
});

app.post('/itMine', (req, res) => {
    const {name, itemsId} = req.body;
    let title, detail, image, foundTimeStamp, returnTimeStamp

    var query = 'SELECT * FROM founditem WHERE itemsId = ?';
    connection.query(query, [itemsId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        console.log(results)
        const item = results[0];
        title = item.title;
        detail = item.detail;
        image = item.image.buffer.toString('base64')
        foundTimeStamp = item.timeStamp;
        returnTimeStamp = getThaiTimestamp()

        query = "INSERT INTO returneditem(title, detail, image, foundTimeStamp, returnTimeStamp, owner) VALUES(?, ?, ?, ?, ?, ?)"
        connection.query(query, [title, detail, image, foundTimeStamp, returnTimeStamp, name], (err, results) => {
            if (err) throw err;
            console.log('Data inserted:', results);
            
            query = 'DELETE FROM founditem WHERE itemsId = ?';
            connection.query(query, [itemsId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Server error');
                }
            });
        });
    });
    
    res.redirect('feed')
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})