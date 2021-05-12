const email = require("../models/email.model");
const sendGrid = require("../../utils/sendGrid");

//create and save new email
create = async (req, res) => {

  if (!req.body) {
    res.status(400).send({
      message: "Content cannot be empty"
    });
  } else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(req.body.to)) {
    res.status(500).send({
      message: 'Email address invalid'
    });
  }

  const date = new Date();
  const currentHour = date.getHours();
  let setTime = Math.floor((new Date(date.setDate(date.getDate() + 1)).setHours(8, 5, 0, 0)) / 1000);
  let emailParameters = { sendAt: ((8 < currentHour) && (17 > currentHour)) ? null : setTime, ...req.body };

  let [iserror, response] = await sendGrid.sendEmail(emailParameters);

  let emailStatus;
  if (iserror) {
    emailStatus = "FAILED";
  } else if (emailParameters.sendAt) {
    emailStatus = "QUEUED";
  } else {
    emailStatus = "SENT";
  }

  let emailToBeCreated = { status: emailStatus, sendGridID: iserror ? null : response.batchId, xID: iserror ? null : response.xID, ...req.body };

  let [isEmailCreateError, emailCreatedResponse] = await email.create(emailToBeCreated);

  if (isEmailCreateError) {
    res.status(500).send({
      message: emailCreatedResponse || "Some error occured while creating the email."
    });
  } else {
    res.status(200).send({
      status: emailStatus,
      id: emailCreatedResponse
    });
  }

}

// Find an email by the Id
findOne = async (req, res) => {
  let [isEmailFindError, emailFindResponse] = await email.findById(req.params.id);
  
  if (isEmailFindError) {
    res.status(500).send({
      message: emailFindResponse || "Some error occured while finding the email."
    });
  } else {
    if (emailFindResponse) {
      res.status(200).send({
        id:emailFindResponse.id,
        status: emailFindResponse.status
      });
    } else {
      res.status(200).send({
        message: "Email not found."
      });
    }  
  }  
};


// notify service
notify = async (req, res) => {
  var events = req.body;
  let response = await Promise.all(
    events.map(async event => {
      let sgId= event['smtp-id'].substring(1, 23);
      let status = event.event;
      let [isStatusUpdateError, statusUpdateResponse] = await email.updateStatus(sgId,status);
      return isStatusUpdateError;
    })
  )
  res.status(200).send(response);

};

// delete email by id
deleteById = async (req, res) => {
  let [isEmailFindError, emailFindResponse] = await email.findById(req.params.id);

  if (isEmailFindError) {
    res.status(500).send({
      message: emailFindResponse || "Some error occured while finding the email."
    });
  } else {
    if (!emailFindResponse) {
      res.status(500).send({
        message: "Email not found."
      });
    }
  
    if (emailFindResponse.status === "QUEUED" && emailFindResponse.sendGridID) {
      let [iserror, response] = await sendGrid.deleteEmail(emailFindResponse.sendGridID);
  
      if (iserror) {
        res.status(500).send({
          message: response || "Some error occured while finding the email."
        });
      } else {
        let [isEmailDeleteError, emailDeleteResponse] = await email.deleteById(req.params.id);
  
        if (isEmailDeleteError) {
          res.status(500).send({
            message: emailDeleteResponse || "Some error occured while finding the email."
          });
        } else {
          res.status(200).send({
            id: req.params.id,
            deleted: emailDeleteResponse
          });
        }
      }

    } else {
      res.status(500).send({
        message: "This email is not a queued email."
      });
    }
  }

};

module.exports = {
  create,
  findOne,
  notify,
  deleteById
};