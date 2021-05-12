const app = require('./app');
const request = require('supertest');
const sinon = require('sinon');
const sg = require('./utils/sendGrid');
const email = require ('./src/models/email.model');

describe('testing the send email',()=>{
    const sandbox = sinon.createSandbox();

    beforeEach(()=>{
        const sendGrid = sandbox.stub(sg,'sendEmail')

        sendGrid.withArgs({
            sendAt: null,
            to: 'seshenya.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
          }).resolves([false,{ batchId:'batchIDTest1',xID:'xIDTest1'}])
          
          sendGrid.withArgs({
            sendAt: 1620441300,
            to: 'seshenya.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
          }).resolves([false,{ batchId:'batchIDTest2',xID:'xIDTest2'}])

          sendGrid.withArgs({
            sendAt: null,
            to: 'seshenya1.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
          }).resolves([true,"Send email to sendGrid failed"])

          sendGrid.withArgs({
            sendAt: null,
            to: 'seshenya2.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
          }).resolves([false,{ batchId:'batchIDTest3',xID:'xIDTest3'}])


        const emailCreate = sandbox.stub(email,'create')

        emailCreate.withArgs({
            status: 'SENT',
            sendGridID: 'batchIDTest1',
            xID: 'xIDTest1',
            to: 'seshenya.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
          }).resolves([false,15])

          emailCreate.withArgs({
            status: 'QUEUED',
            sendGridID: 'batchIDTest2',
            xID: 'xIDTest2',
            to: 'seshenya.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
          }).resolves([false,10])

          emailCreate.withArgs({
              status: 'FAILED',
              sendGridID: null,
              xID: null,
              to: 'seshenya1.work@gmail.com',
              subject: 'This is subject',
              constent: 'This is content'
          }).resolves([false,9])

          emailCreate.withArgs({
            status: 'SENT',
            sendGridID: 'batchIDTest3',
            xID: 'xIDTest3',
            to: 'seshenya2.work@gmail.com',
            subject: 'This is subject',
            constent: 'This is content'
        }).resolves([true,"Database error occured"])
    })

    afterEach(()=>{
        sandbox.restore()
    })

    it('email sent between 8AM-5PM should be sent directly',async()=>{
        const mockDate = new Date(1620369831000)
        const spy =jest
        .spyOn(global,'Date')
        .mockImplementation(()=>mockDate)

        const res =await request(app)
        .post('/v1/emails')
        .send(
            {
                to:'seshenya.work@gmail.com',
                subject:'This is subject',
                constent:'This is content'
            }
        )
        expect(res.status).toEqual(200)
        expect(res.body).toEqual(
            {
            status:'SENT',
            id:15
        })
        spy.mockRestore()
    })


    it('email sent not within 8AM-5PM should be scheduled',async()=>{
        const mockDate = new Date(1620395031000)
        const spy =jest
        .spyOn(global,'Date')
        .mockImplementation(()=>mockDate)

        const res =await request(app)
        .post('/v1/emails')
        .send(
            {
                to:'seshenya.work@gmail.com',
                subject:'This is subject',
                constent:'This is content'
            }
        )
        expect(res.status).toEqual(200)
        expect(res.body).toEqual(
            {
            status:'QUEUED',
            id:10
        })
        spy.mockRestore()
    })

    it('return mail response as fail when sendGrid fail to send the email ',async()=>{
        const mockDate = new Date(1620369831000)
        const spy =jest
        .spyOn(global,'Date')
        .mockImplementation(()=>mockDate)

        const res =await request(app)
        .post('/v1/emails')
        .send(
            {
                to:'seshenya1.work@gmail.com',
                subject:'This is subject',
                constent:'This is content'
            }
        )
        expect(res.status).toEqual(200)
        expect(res.body).toEqual(
            {
            status:'FAILED',
            id:9
        })
        spy.mockRestore()
    })

    it('return error when database throws error when creating mail',async()=>{
        const mockDate = new Date(1620369831000)
        const spy =jest
        .spyOn(global,'Date')
        .mockImplementation(()=>mockDate)

        const res =await request(app)
        .post('/v1/emails')
        .send(
            {
                to:'seshenya2.work@gmail.com',
                subject:'This is subject',
                constent:'This is content'
            }
        )
        expect(res.status).toEqual(500)
        expect(res.body).toEqual(
            {
                message:"Database error occured"
            })
        spy.mockRestore()
    })

})

describe('testing email find',()=>{
    const sandbox = sinon.createSandbox();

    beforeEach(()=> {

        const emailFind = sandbox.stub(email,'findById')

        emailFind.withArgs("7").resolves([false, 
            {
                id: 7,
                sendGridID: 'sendGridIdTest1',
                x_ID: 'xIdTest1',
                reciever: 'seshenya.work@gmail.com',
                subject: 'This is subject',
                content: 'This is content',
                status: 'SENT'
                
            }
        ])
        
        emailFind.withArgs("6").resolves([false, null])

    })

    afterEach(()=>{
        sandbox.restore()
    })  

    it('email returned successfully if the email exists ',async()=>{
        const res =await request(app)
        .get('/v1/emails/7')
        expect(res.status).toEqual(200)
        expect(res.body).toEqual(
            {
                id: 7,
                status: 'SENT'
                
            })
    })

    it('email not found if email doesnt exist',async()=>{
        const res =await request(app)
        .get('/v1/emails/6')
        expect(res.status).toEqual(200)
        expect(res.body).toEqual(
            {
                message:'Email not found.'
                
            })
    })

})

describe('notify the email is delivered successfully',()=>{
    const sandbox = sinon.createSandbox();

    beforeEach(()=> {
        sandbox.stub(email,'updateStatus').resolves([false, null]);
    })

    afterEach(()=>{
        sandbox.restore()
    })  

    it('email statuses of all the emails scheduled are getting updated successfully',async()=>{
        const res =await request(app)
        .post('/v1/events')
        .send(
            [{
                email: 'seshenya.work@gmail.com',
                event: 'delivered',
                sg_event_id: 'ZGVsaXZlcmVkLTAtMjE3MzgyMDktcC1iSm5SXzBRcDZxaW5EaXF5Nmlhdy0w',
                sg_message_id: 'p-bJnR_0Qp6qinDiqy6iaw.filterdrecv-6b4886b6-5224t-1-60953CA1-A3.0',
                'smtp-id': '<p-bJnR_0Qp6qinDiqy6iaw@geopod-ismtpd-canary-0>'
              },
              {
                email: 'seshenya.work@gmail.com',
                event: 'delivered',
                sg_event_id: 'ZGVsaXZlcmVkLTAtMjE3MzgyMDktRmVvVnRieGNRS3lQQ1FIcTdkangzdy0w',
                sg_message_id: 'FeoVtbxcQKyPCQHq7djx3w.filterdrecv-77df4fc8dd-cq6tr-1-60953D22-8C.0',
                'smtp-id': '<FeoVtbxcQKyPCQHq7djx3w@geopod-ismtpd-4-0>'
              }]
        )
        expect(res.status).toEqual(200)
        expect(res.body).toEqual([false, false]);
    })

})

describe('testing the delete email',()=>{
    const sandbox = sinon.createSandbox();

    beforeEach(()=>{
        const sendGrid = sandbox.stub(sg,'deleteEmail')

        sendGrid.withArgs('sendGridIdTest4').resolves([false,201])
          
        const emailDelete = sandbox.stub(email,'deleteById')
        const emailFind = sandbox.stub(email,'findById')

        emailDelete.withArgs("5").resolves([false, true])

          emailFind.withArgs("5").resolves([false,
            {
                id: 5,
                sendGridID: 'sendGridIdTest4',
                x_ID: 'xIdTest4',
                reciever: 'seshenya.work@gmail.com',
                subject: 'This is subject',
                constent: 'This is content',
                status: 'QUEUED'
              }
            ])

    })

    afterEach(()=>{
        sandbox.restore()
    })

    it('email deleted successfully ',async()=>{
        const res =await request(app)
        .delete('/v1/emails/5')
        expect(res.status).toEqual(200)
        expect(res.body).toEqual(
            {
                id: "5",
                deleted:true
              })
        
    })
})
