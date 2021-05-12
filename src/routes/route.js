const email = require("../services/email.service.js");

module.exports = app => {
    //send a webhook notification
    app.post("/v1/events", email.notify);

    //send a new email
    app.post("/v1/emails", email.create);

    //retrieve a sent email with emailId
    app.get("/v1/emails/:id", email.findOne);

    // //delete a single email
    app.delete("/v1/emails/:id", email.deleteById);

}

