const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp(
//    { 
//         credential: admin.credential.cert(serviceAccount),
//         databaseURL: 'https://fir-noti-c7bd6.firebaseio.com'
//    }
// );

const {
    initializeApp,
    applicationDefault,
    cert
} = require('firebase-admin/app');
const {
    getFirestore,
    Timestamp,
    FieldValue,
    Filter
} = require('firebase-admin/firestore');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();


exports.sendToken = functions.https.onRequest((request, response) => {

    // Extract necessary data from the request
    const {
        userId,
        token
    } = request.body;
    console.log(request.body);

    let res;
    // if (request.body.type == "sender") {
    //     const cityRef = db.collection('Sender').doc(userId);
    //     res = cityRef.update({
    //         token: request.body.token
    //     });

    // } else {
        const cityRef = db.collection('Receiver').doc(userId);
        res = cityRef.update({
            token: request.body.token
        });

   // }

    if (res) {
        response.status(200).send({'message':"Token updated successfully",'data':[], 'error':''});
    } else {
        response.status(200).send({'message':"Token not updated",'data':[], 'error':true});
    }

});


exports.sendMessage = functions.https.onRequest((request, response) => {
    // Extract necessary data from the request
    const {
        recipientId,
        message,
        senderId
    } = request.body;

    // Send the message to the recipient
    // Implement your logic to send the message using FCM or other messaging service
    var newData = {
        message: message,
        from: senderId,
        creatAt: new Date(),
        to: recipientId

    };
    const res = db.collection('Messages').doc().set(newData);
    if (res) {

        // geting token data for reciver user
        const reciverdata = db.collection('Receiver');
        const retDataTok =  reciverdata.where('to', '==', recipientId).get();   
        
        const payload = {
            token: retDataTok.token, //FCMToken
            notification: {
                title: 'cloud function demo',
                body: message
            },
            data: {
                body: message,
            }
        };

        admin.messaging().send(payload).then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            return {
                success: true
            };
        }).catch((error) => {
            return {
                error: error.code
            };
        });
        response.status(200).send({'message':"'Message sent successfully'",'data':[], 'error':false});
    }else{

        response.status(201).send({'message':"Message not sent",'data':[], 'error':true});
    }


    
});

exports.receiveMessage =  functions.https.onRequest(async (request, response) => {
    // Extract necessary data from the request
    const {
        senderId,
        recipientId
    } = request.body;
    
    //get all message for reciver user  
    const reciverdata = db.collection('Messages').where("to", "==", recipientId);
    response.status(200).send({'message':"Record found",'data':reciverdata, 'error':''});


});