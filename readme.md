# Email Management App
This is used to send emails via [`SendGrid`](https://sendgrid.com/). If the email is sent between 8AM to 5PM, email will be sent directly. Else it will be scheduled to be sent on the next day at 8.05AM.

## How to configure
- Create a sendgrid account and include the api key in the config file.
- SendGrid webhook is configured to notify when a scheduled mail is sent.
- Expose the server running in local machine to the public internet using an app like [ngrok](https://ngrok.com/)
- Include the specific url with the suffix `v1/events/` in the sendgrid webhook

## How to run
```
npm install
npm start
```

## How to test
```
npm test
```

### To send an email
```
path : /v1/emails
action : POST
body : {
to : 'test@email.com',
subject : 'Test subject',
content : 'Test content'
}
```

### To find an email
```
path : /v1/emails/1
action : GET
```

### To delete an email
```
path : /v1/emails/1
action : DELETE
```