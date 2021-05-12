const express = require("express");

const app= express();

const port = 2010; 

app.use(express.json());

require("./src/routes/route")(app);

// set port, listen for requests if not called from a parent ex: from tests
if (!module.parent) {
    app.listen(port, () => {
        console.log('Server is running on port:' + port)
    });
}

module.exports = app

