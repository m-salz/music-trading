require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');
const cors = require('cors');
const axios = require('axios')

app.use(cors());
app.use(bodyParser());
app.use(express.json());

// Home page
app.get('/', (req, res) => {
    connection.query('SELECT * FROM Music', (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Select user
app.get('/user', (req, res) => {
    const {userID} = req.query;
    connection.query("SELECT * FROM Users WHERE ID = ?", [userID], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error getting user information');
        } else {
            res.json(results);
        }
    });
});

// Get followers of user 
app.get('/followers', (req, res) => {
    const {userID_B} = req.query;
    connection.query("SELECT userID_A FROM Follows WHERE userID_B = ?", [userID_B], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error getting followers');
        } else {
            res.json(results);
        }
    });
});

// Get likes of user 
app.get('/userlikes', (req, res) => {
    const {userID} = req.query;
    connection.query("SELECT musicID FROM Likes WHERE userID = ?", [userID], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error getting likes');
        } else {
            res.json(results);
        }
    });
});

// Get trades of user 
app.get('/usertrades', (req, res) => {
    const {userID} = req.query;
    connection.query("SELECT * FROM trade_for WHERE userID_A = ? OR userID_B = ?", [userID, userID], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error getting trades');
        } else {
            res.json(results);
        }
    });
});

// Get music of user 
app.get('/usermusic', (req, res) => {
    const {userID} = req.query;
    connection.query("SELECT * FROM Music WHERE userID = ?", [userID], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error getting user music');
        } else {
            res.json(results);
        }
    });
});

// Select all vinyls
app.get('/vinyls', (req, res) => {
    var Format = "vinyl"
    connection.query('SELECT * FROM Music WHERE Format = ?', [Format], (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Select all CDs
app.get('/cds', (req, res) => {
    var Format = "cd"
    connection.query('SELECT * FROM Music WHERE Format = ?', [Format], (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Select all cassetes
app.get('/cassettes', (req, res) => {
    var Format = "cassette"
    connection.query('SELECT * FROM Music WHERE Format = ?', [Format], (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Get all music items
app.get('/all', (req, res) => {
    connection.query(
        "SELECT * FROM Music",
        (error, results) => {
            if (error) throw error;
            res.json(results);
        }
    );
});


app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send('Missing query parameter');
    }
    try {
        const response = await axios.get(`https://api.discogs.com/database/search?q=${query}&type=release`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'Authorization': `Discogs token=vkiubVAmyxmACaayGANRsLwEMbPlvSsdlzyVBKpi`,
            },
        });
        const data = response.data;
        return res.json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    }
});

app.post('/add-music-item', (req, res) => {
    const { userId, name, artist, genre, format, thumb } = req.body;

    console.log(req.body)

    if (!userId || !name || !artist || !genre || !format || !thumb) {
        return res.status(400).send('Missing required parameters');
    }

    const query = `INSERT INTO Music (userID, Name, Artist, Genre, Thumbnail, Format) VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [userId, name, artist, genre, thumb, format];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Internal server error');
        }
        return res.json({ success: true });
    });
});

// Add user
app.post('/register', (req, res) => {
    const {ProfilePhoto, email, Name} = req.body;
    connection.query("SELECT * FROM Users WHERE email = ?", [email], (error, results, fields) => {
        if (error) throw error;
        if (results.length > 0) {
            res.status(409).send('Email already exists');
        } else {
            connection.query("INSERT INTO Users (ProfilePhoto, email, Name) VALUES (?, ?, ?)", [ProfilePhoto, email, Name], (error, results, fields) => {
                if (error) {
                    console.error(error);
                    res.status(500).send('Error creating user');
                } else {
                    res.send('User created succesfully');
                }
            });
        }
    })
});

// Follow account
app.post('/follow', (req, res) => {
    const {userID_A, userID_B} = req.body;
    // res.send("A: " + userID_A + " B: " + userID_B);
    connection.query("INSERT INTO Follows (userID_A, userID_B) VALUES (?, ?)", [userID_A, userID_B], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error following user');
        } else {
            res.send('User followed succesfully');
        }
    });
});

// Add trade 
app.post('/trade', (req, res) => {
    const {musicID_A, musicID_B, userID_A, userID_B, Trade_State} = req.body;
    // res.send("A: " + userID_A + " B: " + userID_B);
    connection.query("INSERT INTO trade_for (musicID_A, musicID_B, userID_A, userID_B, Trade_State) VALUES (?, ?, ?, ?, ?)", [musicID_A, musicID_B, userID_A, userID_B, Trade_State], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error creating trade');
        } else {
            res.send('Trade created succesfully');
        }
    });
});

// Add like
app.post('/like', (req, res) => {
    const {userID, musicID} = req.body;
    // res.send("A: " + userID_A + " B: " + userID_B);
    connection.query("INSERT INTO Likes (userID, musicID) VALUES (?, ?)", [userID, musicID], (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error liking item');
        } else {
            res.send('Like created succesfully');
        }
    });
});

// Delete user
app.delete('/deleteUser/:id', (req, res) => {
    const userID = req.params.id;
    connection.query('DELETE FROM Users WHERE ID = ?', userID, (error, results, fields) => {
        if (error) {
          console.error(error);
          res.status(500).send('Error deleting user');
        } else {
          res.send(`User ${userID} deleted successfully`);
        }
      });
});

// Delete music item
app.delete('/deleteMusic/:id', (req, res) => {
    const musicID = req.params.id;
    connection.query('DELETE FROM Music WHERE MusicID = ?', musicID, (error, results, fields) => {
        if (error) {
          console.error(error);
          res.status(500).send('Error deleting music item');
        } else {
          res.send(`Music Item ${musicID} deleted successfully`);
        }
      });
});

// Delete like
app.delete('/deleteLike/:userID/:musicID', (req, res) => {
    const userID = req.params.userID;
    const musicID = req.params.musicID;
    connection.query('DELETE FROM Likes WHERE userID = ? AND musicID = ?', [userID, musicID], (error, results, fields) => {
        if (error) {
          console.error(error);
          res.status(500).send('Error deleting like');
        } else {
          res.send(`Like of ${musicID} by ${userID} deleted successfully`);
        }
      });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App is running at: http://localhost:${port}`);
});
