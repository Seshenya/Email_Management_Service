const sgEmail = require('@sendgrid/client');
const config = require('../config');

sendEmail = async (params) => {
  sgEmail.setApiKey(config.sendGridApiKey);

  const requestBatchID = {
    method: 'POST',
    url: '/v3/mail/batch',
  };

  let batchID = await sgEmail.request(requestBatchID)
    .then(([response, body]) => {
      return response.body.batch_id;
    })
    .catch((error) => {
      return null;
    })

  if (!batchID) {
    return [true, "cant create a send grid batch"];
  }

  let data = {
    content: [
      {
        type: "text/html",
        value: params.content
      }
    ],
    from: {
      email: config.sendGridSenderEmail,
      name: config.sendGridSenderName
    },
    personalizations: [
      {
        subject: params.subject,
        to: [
          {
            email: params.to,
          }
        ]
      }
    ],
    reply_to: {
      email: config.sendGridSenderEmail,
      name: config.sendGridSenderName
    },
    subject: params.subject,
    batch_id: batchID,
  };

  if (params.sendAt) {
    data = { send_at: params.sendAt, ...data };
  }

  const requestSend = {
    method: 'POST',
    url: '/v3/mail/send',
    body: data,
  };

  let response = await sgEmail.request(requestSend)
    .then(([response, body]) => {
      return [false, {batchId:batchID,xID:response.headers['x-message-id']}];
    })
    .catch((error) => {
      return [true, "send email to sendGrid failed"];
    })
  return response;
}


deleteEmail = async (ID) => {
  sgEmail.setApiKey(config.sendGridApiKey);

  const data = {
    batch_id: ID,
    status: "cancel"
  }

  const requestDelete = {
    method: 'POST',
    url: '/v3/user/scheduled_sends',
    body: data,
  };

  let response = await sgEmail.request(requestDelete)
    .then(([response, body]) => {
      return [false, response.statusCode];
    })
    .catch((error) => {
      return [true, error];
    })
  return response;
}

module.exports = {
  sendEmail,
  deleteEmail
}